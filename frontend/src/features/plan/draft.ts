import type { CookingSession, CookingSessionWrite } from "@/api/sessions";

type PlanDraftStep = CookingSessionWrite["phases"][number]["steps"][number] & {
  key: string;
};

interface PlanDraftPhase extends Omit<CookingSessionWrite["phases"][number], "steps"> {
  key: string;
  steps: PlanDraftStep[];
}

interface PlanDraft extends Omit<CookingSessionWrite, "phases" | "plannedFoodTargetF"> {
  sessionId: string | null;
  plannedFoodTargetF: number | null;
  phases: PlanDraftPhase[];
}

export interface PlanEditorStep {
  id: string;
  title: string;
  durationMinutes: number;
  instructions: string;
}

export interface PlanEditorPhase {
  id: string;
  title: string;
  technique: string;
  transitionGuidance: string;
  steps: PlanEditorStep[];
}

export interface PlanEditorModel {
  id: string;
  title: string;
  date: string;
  phases: PlanEditorPhase[];
  plannedDomeTarget: { value: number | null; unit: "F" };
  plannedFoodTarget: { value: number | null; unit: "F" };
  setup: string;
  ventFireGuidance: string;
  prepNotes: string;
}

export interface PlanEditorForm extends PlanEditorModel {
  sessionId: string | null;
  plannedDomeMaxF: number | null;
  deflectorGuidance: string;
  heatZoneGuidance: string;
}

let localKeySequence = 0;

function createLocalKey(prefix: "phase" | "step"): string {
  localKeySequence += 1;
  return `${prefix}-local-${localKeySequence}`;
}

export function createEmptyPlanDraft(): PlanDraft {
  return {
    sessionId: null,
    title: "",
    cookingDate: "",
    plannedDomeRange: { minF: 250, maxF: 250 },
    plannedFoodTargetF: null,
    setupGuidance: "",
    deflectorGuidance: "",
    heatZoneGuidance: "",
    ventGuidance: "",
    prepNotes: "",
    phases: [
      {
        key: createLocalKey("phase"),
        title: "",
        technique: "",
        transitionGuidance: "",
        steps: [
          {
            key: createLocalKey("step"),
            title: "",
            instructions: "",
            durationMinutes: 15,
          },
        ],
      },
    ],
  };
}

export function fromCookingSession(session: CookingSession): PlanDraft {
  return {
    sessionId: session.id,
    title: session.title,
    cookingDate: session.cookingDate,
    plannedDomeRange: { ...session.plannedDomeRange },
    plannedFoodTargetF: session.plannedFoodTargetF ?? null,
    setupGuidance: session.setupGuidance,
    deflectorGuidance: session.deflectorGuidance,
    heatZoneGuidance: session.heatZoneGuidance,
    ventGuidance: session.ventGuidance,
    prepNotes: session.prepNotes,
    phases: session.phases.map((phase) => ({
      key: phase.id,
      title: phase.title,
      technique: phase.technique,
      transitionGuidance: phase.transitionGuidance,
      steps: phase.steps.map((step) => ({
        key: step.id,
        title: step.title,
        instructions: step.instructions,
        durationMinutes: step.durationMinutes,
      })),
    })),
  };
}

export function toEditorForm(draft: PlanDraft): PlanEditorForm {
  return {
    sessionId: draft.sessionId,
    id: draft.sessionId ?? "plan-local",
    title: draft.title,
    date: draft.cookingDate,
    phases: draft.phases.map((phase) => ({
      id: phase.key,
      title: phase.title,
      technique: phase.technique,
      transitionGuidance: phase.transitionGuidance,
      steps: phase.steps.map((step) => ({
        id: step.key,
        title: step.title,
        durationMinutes: step.durationMinutes,
        instructions: step.instructions,
      })),
    })),
    plannedDomeTarget: { value: draft.plannedDomeRange.minF, unit: "F" },
    plannedDomeMaxF: draft.plannedDomeRange.maxF,
    plannedFoodTarget: { value: draft.plannedFoodTargetF, unit: "F" },
    setup: draft.setupGuidance,
    deflectorGuidance: draft.deflectorGuidance,
    heatZoneGuidance: draft.heatZoneGuidance,
    ventFireGuidance: draft.ventGuidance,
    prepNotes: draft.prepNotes,
  };
}

export function fromEditorForm(form: PlanEditorForm): PlanDraft {
  return {
    sessionId: form.sessionId,
    title: form.title,
    cookingDate: form.date,
    plannedDomeRange: {
      minF: form.plannedDomeTarget.value ?? Number.NaN,
      maxF: form.plannedDomeMaxF ?? Number.NaN,
    },
    plannedFoodTargetF: form.plannedFoodTarget.value,
    setupGuidance: form.setup,
    deflectorGuidance: form.deflectorGuidance,
    heatZoneGuidance: form.heatZoneGuidance,
    ventGuidance: form.ventFireGuidance,
    prepNotes: form.prepNotes,
    phases: form.phases.map((phase) => ({
      key: phase.id,
      title: phase.title,
      technique: phase.technique,
      transitionGuidance: phase.transitionGuidance,
      steps: phase.steps.map((step) => ({
        key: step.id,
        title: step.title,
        durationMinutes: step.durationMinutes,
        instructions: step.instructions,
      })),
    })),
  };
}

export function toCookingSessionWrite(draft: PlanDraft): CookingSessionWrite {
  return {
    title: draft.title,
    cookingDate: draft.cookingDate,
    plannedDomeRange: { ...draft.plannedDomeRange },
    ...(draft.plannedFoodTargetF === null ? {} : { plannedFoodTargetF: draft.plannedFoodTargetF }),
    setupGuidance: draft.setupGuidance,
    deflectorGuidance: draft.deflectorGuidance,
    heatZoneGuidance: draft.heatZoneGuidance,
    ventGuidance: draft.ventGuidance,
    prepNotes: draft.prepNotes,
    phases: draft.phases.map(({ key: _phaseKey, steps, ...phase }) => ({
      ...phase,
      steps: steps.map(({ key: _stepKey, ...step }) => step),
    })),
  };
}
