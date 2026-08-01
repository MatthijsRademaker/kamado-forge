import { describe, expect, test } from "bun:test";
import type { SessionPlan } from "@/api/generated/types.gen";
import {
  addPhase,
  addStep,
  deriveTimeline,
  movePhase,
  moveStep,
  removePhase,
  removeStep,
  validateReadiness,
} from "./model";

const plan = {
  id: "plan-1",
  title: "Reverse-sear supper",
  date: "2026-04-18",
  phases: [
    {
      id: "phase-low",
      title: "Low roast",
      technique: "Indirect roasting",
      transitionGuidance: "Open the vents before searing.",
      steps: [
        { id: "step-light", title: "Light", durationMinutes: 20, instructions: "Light one starter." },
        { id: "step-roast", title: "Roast", durationMinutes: 60, instructions: "Roast indirectly." },
      ],
    },
    {
      id: "phase-sear",
      title: "Sear",
      technique: "Direct grilling",
      transitionGuidance: "Rest before slicing.",
      steps: [{ id: "step-sear", title: "Sear", durationMinutes: 8, instructions: "Sear over direct heat." }],
    },
  ],
  plannedDomeTarget: { value: 250, unit: "F" },
  plannedFoodTarget: { value: 130, unit: "F" },
  setup: "Half-moon deflector.",
  ventFireGuidance: "Bottom vent one finger; top vent one quarter open.",
  prepNotes: "Dry brine overnight.",
} satisfies SessionPlan;

function phaseAt(value: SessionPlan, index: number) {
  const phase = value.phases[index];
  if (!phase) throw new Error(`Expected phase at index ${index}`);
  return phase;
}

function stepAt(value: SessionPlan, phaseIndex: number, stepIndex: number) {
  const step = phaseAt(value, phaseIndex).steps[stepIndex];
  if (!step) throw new Error(`Expected step at phase ${phaseIndex}, index ${stepIndex}`);
  return step;
}

describe("Plan timeline", () => {
  test("derives phase and step offsets and totals from array order", () => {
    expect(deriveTimeline(plan)).toEqual({
      totalMinutes: 88,
      phases: [
        {
          id: "phase-low",
          offsetMinutes: 0,
          totalMinutes: 80,
          steps: [
            { id: "step-light", offsetMinutes: 0, durationMinutes: 20 },
            { id: "step-roast", offsetMinutes: 20, durationMinutes: 60 },
          ],
        },
        {
          id: "phase-sear",
          offsetMinutes: 80,
          totalMinutes: 8,
          steps: [{ id: "step-sear", offsetMinutes: 80, durationMinutes: 8 }],
        },
      ],
    });
  });
});

describe("Plan readiness", () => {
  test("returns ordered field errors and the first invalid path", () => {
    const incomplete: SessionPlan = structuredClone(plan);
    incomplete.title = " ";
    incomplete.date = "2026-02-30";
    incomplete.plannedDomeTarget.value = 701;
    incomplete.plannedFoodTarget.value = null;
    incomplete.setup = "";
    incomplete.ventFireGuidance = "";
    incomplete.prepNotes = "";
    const firstPhase = phaseAt(incomplete, 0);
    const firstStep = stepAt(incomplete, 0, 0);
    firstPhase.technique = "";
    firstPhase.transitionGuidance = "";
    firstStep.title = "";
    firstStep.durationMinutes = 0;
    firstStep.instructions = "";

    const readiness = validateReadiness(incomplete);

    expect(readiness.ready).toBe(false);
    expect(readiness.firstInvalidPath).toBe("title");
    expect(readiness.errors.map(({ path }) => path)).toEqual([
      "title",
      "date",
      "plannedDomeTarget.value",
      "plannedFoodTarget.value",
      "setup",
      "ventFireGuidance",
      "prepNotes",
      "phases.0.technique",
      "phases.0.transitionGuidance",
      "phases.0.steps.0.title",
      "phases.0.steps.0.durationMinutes",
      "phases.0.steps.0.instructions",
    ]);
    expect(validateReadiness(plan)).toEqual({ ready: true, errors: [], firstInvalidPath: null });
  });

  test("requires non-empty identities that are unique across the draft", () => {
    const missing: SessionPlan = structuredClone(plan);
    missing.id = "";
    phaseAt(missing, 1).id = phaseAt(missing, 0).id;
    stepAt(missing, 0, 0).id = "";
    stepAt(missing, 1, 0).id = stepAt(missing, 0, 1).id;

    expect(validateReadiness(missing).errors.map(({ path }) => path)).toEqual([
      "id",
      "phases.1.id",
      "phases.0.steps.0.id",
      "phases.1.steps.0.id",
    ]);

    const invalid: SessionPlan = structuredClone(plan);
    phaseAt(invalid, 0).id = invalid.id;
    phaseAt(invalid, 1).id = "shared-item";
    stepAt(invalid, 0, 0).id = "shared-item";
    stepAt(invalid, 1, 0).id = invalid.id;

    const readiness = validateReadiness(invalid);

    expect(readiness.ready).toBe(false);
    expect(readiness.errors.map(({ path }) => path)).toEqual([
      "phases.0.id",
      "phases.0.steps.0.id",
      "phases.1.steps.0.id",
    ]);
  });
});

describe("Plan nested operations", () => {
  test("adds, removes, and safely reorders phases and steps without mutating the source", () => {
    const addedPhase = addPhase(plan, {
      id: "phase-rest",
      title: "Rest",
      technique: "Resting",
      transitionGuidance: "Slice across the grain.",
      steps: [],
    });
    const movedPhase = movePhase(addedPhase, "phase-rest", "up");
    const withStep = addStep(movedPhase, "phase-rest", {
      id: "step-rest",
      title: "Rest",
      durationMinutes: 10,
      instructions: "Rest uncovered.",
    });
    const movedStep = moveStep(withStep, "phase-low", "step-roast", "up");

    expect(plan.phases.map(({ id }) => id)).toEqual(["phase-low", "phase-sear"]);
    expect(movedPhase.phases.map(({ id }) => id)).toEqual(["phase-low", "phase-rest", "phase-sear"]);
    expect(phaseAt(movedStep, 0).steps.map(({ id }) => id)).toEqual(["step-roast", "step-light"]);
    expect(movePhase(movedStep, "phase-low", "up")).toBe(movedStep);
    expect(moveStep(movedStep, "phase-low", "step-roast", "up")).toBe(movedStep);
    expect(phaseAt(removeStep(withStep, "phase-rest", "step-rest"), 1).steps).toEqual([]);
    expect(removePhase(withStep, "phase-rest").phases.map(({ id }) => id)).toEqual(["phase-low", "phase-sear"]);
    expect(() => removePhase(plan, "missing-phase")).toThrow("Unknown phase: missing-phase");
  });

  test("rejects phase and step identities already used anywhere in the draft", () => {
    const phase = {
      id: plan.id,
      title: "Rest",
      technique: "Resting",
      transitionGuidance: "Slice across the grain.",
      steps: [],
    };
    const step = {
      id: plan.id,
      title: "Rest",
      durationMinutes: 10,
      instructions: "Rest uncovered.",
    };

    expect(() => addPhase(plan, phase)).toThrow(`Duplicate identity: ${plan.id}`);
    expect(() => addPhase(plan, { ...phase, id: "step-light" })).toThrow("Duplicate identity: step-light");
    expect(() => addStep(plan, "phase-low", step)).toThrow(`Duplicate identity: ${plan.id}`);
    expect(() => addStep(plan, "phase-low", { ...step, id: "phase-sear" })).toThrow("Duplicate identity: phase-sear");
  });
});
