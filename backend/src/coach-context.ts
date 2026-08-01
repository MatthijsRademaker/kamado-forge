import type { LiveCookProjection } from "./live-cook-contract";

interface ContextStepV1 {
  readonly id: string;
  readonly ordinal: number;
  readonly title: string;
  readonly instructions: string;
  readonly durationMinutes: number;
}

interface ContextTargetsV1 {
  readonly domeTemperatureF: {
    readonly min: number;
    readonly max: number;
  };
  readonly foodTemperatureF: number | null;
}

interface ContextNoteV1 {
  readonly id: string;
  readonly stepId: string;
  readonly stepTitle: string;
  readonly content: string;
  readonly createdAt: string;
}

interface ActiveSessionContextV1 {
  readonly id: string;
  readonly status: "ACTIVE" | "PAUSED";
  readonly title: string;
  readonly currentStep: ContextStepV1;
  readonly targets: ContextTargetsV1;
  readonly recentNotes: readonly ContextNoteV1[];
}

export interface ContextSnapshotV1 {
  readonly version: 1;
  readonly activeSession: ActiveSessionContextV1 | null;
}

export interface ActiveSessionContextSource {
  findActive(): LiveCookProjection | undefined;
}

export function assembleCoachContext(source: ActiveSessionContextSource): ContextSnapshotV1 {
  const active = source.findActive();
  if (!active) return deepFreeze({ version: 1, activeSession: null });
  if (active.status !== "ACTIVE" && active.status !== "PAUSED") {
    throw new Error(`Active-session projection returned terminal status: ${active.status}`);
  }
  if (!active.currentStep) throw new Error(`Active-session projection has no current step: ${active.id}`);

  const recentNotes = active.executionHistory
    .flatMap((visit) =>
      visit.notes.map((note) => ({
        executionOrdinal: visit.ordinal,
        noteOrdinal: note.ordinal,
        id: note.id,
        stepId: visit.step.id,
        stepTitle: visit.step.title,
        content: note.content,
        createdAt: note.createdAt,
      })),
    )
    .sort(
      (left, right) =>
        right.createdAt.localeCompare(left.createdAt) ||
        right.executionOrdinal - left.executionOrdinal ||
        right.noteOrdinal - left.noteOrdinal,
    )
    .slice(0, 5)
    .map(({ executionOrdinal: _, noteOrdinal: __, ...note }) => note);

  return deepFreeze({
    version: 1,
    activeSession: {
      id: active.id,
      status: active.status,
      title: active.plan.title,
      currentStep: {
        id: active.currentStep.id,
        ordinal: active.currentStep.ordinal,
        title: active.currentStep.title,
        instructions: active.currentStep.instructions,
        durationMinutes: active.currentStep.durationMinutes,
      },
      targets: {
        domeTemperatureF: {
          min: active.plan.plannedDomeRange.minF,
          max: active.plan.plannedDomeRange.maxF,
        },
        foodTemperatureF: active.plan.plannedFoodTargetF ?? null,
      },
      recentNotes,
    },
  });
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}
