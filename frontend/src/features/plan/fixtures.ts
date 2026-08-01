import type { SessionPlan } from "@/api/generated/types.gen";

type FixtureName = "complete" | "incomplete" | "empty" | "loading" | "error";
type DataFixtureName = Extract<FixtureName, "complete" | "incomplete" | "empty">;

export type PlanFixtureState =
  | { kind: "draft"; fixture: DataFixtureName; draft: SessionPlan }
  | { kind: "empty"; fixture: "empty"; draft: SessionPlan }
  | { kind: "loading"; fixture: "loading" }
  | { kind: "error"; fixture: "error" };

const completeFixture = {
  id: "plan-complete",
  title: "Reverse-sear steak night",
  date: "2026-04-18",
  phases: [
    {
      id: "phase-fire",
      title: "Build the fire",
      technique: "Two-zone indirect setup",
      transitionGuidance: "Wait for clean smoke before adding food.",
      steps: [
        {
          id: "step-light",
          title: "Light a small fire",
          durationMinutes: 20,
          instructions: "Light one starter in the center and leave the dome open for 10 minutes.",
        },
        {
          id: "step-stabilize",
          title: "Stabilize the dome",
          durationMinutes: 25,
          instructions: "Install the half-moon deflector and settle at the planned dome target.",
        },
      ],
    },
    {
      id: "phase-roast",
      title: "Roast and sear",
      technique: "Reverse sear",
      transitionGuidance: "Remove the deflector, open both vents, then sear over direct heat.",
      steps: [
        {
          id: "step-roast",
          title: "Roast indirectly",
          durationMinutes: 50,
          instructions: "Roast on the cool side until 10°F below the planned food target.",
        },
        {
          id: "step-sear",
          title: "Sear and rest",
          durationMinutes: 12,
          instructions: "Sear both sides, then rest before slicing.",
        },
      ],
    },
  ],
  plannedDomeTarget: { value: 250, unit: "F" },
  plannedFoodTarget: { value: 130, unit: "F" },
  setup: "Half-moon heat deflector below the grate; direct zone left open for the finish.",
  ventFireGuidance:
    "Begin with both vents open. At 200°F, close the bottom vent to one finger and top vent to one quarter.",
  prepNotes: "Dry-brine steaks overnight and uncover them 45 minutes before lighting.",
} satisfies SessionPlan;

const incompleteFixture = {
  id: "plan-incomplete",
  title: "Saturday chicken",
  date: "",
  phases: [
    {
      id: "phase-chicken",
      title: "Roast chicken",
      technique: "",
      transitionGuidance: "",
      steps: [
        {
          id: "step-chicken",
          title: "",
          durationMinutes: 60,
          instructions: "",
        },
      ],
    },
  ],
  plannedDomeTarget: { value: 350, unit: "F" },
  plannedFoodTarget: { value: null, unit: "F" },
  setup: "",
  ventFireGuidance: "",
  prepNotes: "Spatchcock before seasoning.",
} satisfies SessionPlan;

const emptyFixture = {
  id: "plan-empty",
  title: "",
  date: "",
  phases: [],
  plannedDomeTarget: { value: null, unit: "F" },
  plannedFoodTarget: { value: null, unit: "F" },
  setup: "",
  ventFireGuidance: "",
  prepNotes: "",
} satisfies SessionPlan;

const fixtureRegistry = {
  complete: completeFixture,
  incomplete: incompleteFixture,
  empty: emptyFixture,
} satisfies Record<DataFixtureName, SessionPlan>;

export function selectFixture(search: string): PlanFixtureState {
  const requested = new URLSearchParams(search).get("fixture");
  const fixture = isFixtureName(requested) ? requested : "complete";

  if (fixture === "loading") return { kind: "loading", fixture: "loading" };
  if (fixture === "error") return { kind: "error", fixture: "error" };
  const draft = structuredClone(fixtureRegistry[fixture]);
  return fixture === "empty" ? { kind: "empty", fixture, draft } : { kind: "draft", fixture, draft };
}

export function createLocalDraft(state: PlanFixtureState): PlanFixtureState {
  if (state.kind !== "empty") throw new Error("Local draft creation requires the empty fixture");
  return { kind: "draft", fixture: "empty", draft: structuredClone(fixtureRegistry.empty) };
}

export function resetLocalDraft(state: PlanFixtureState): PlanFixtureState {
  if (state.kind !== "draft" && state.kind !== "empty") throw new Error("Only data fixtures can be reset");
  return selectFixture(`?fixture=${state.fixture}`);
}

export function retryLocalFixture(state: PlanFixtureState): PlanFixtureState {
  if (state.kind !== "error") throw new Error("Only the error fixture can be retried");
  return selectFixture("?fixture=complete");
}

export function returnToDefaultFixture(_state: PlanFixtureState): PlanFixtureState {
  return selectFixture("?fixture=complete");
}

function isFixtureName(value: string | null): value is FixtureName {
  return (
    value === "complete" || value === "incomplete" || value === "empty" || value === "loading" || value === "error"
  );
}
