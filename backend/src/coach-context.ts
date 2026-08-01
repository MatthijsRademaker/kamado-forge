import type { CoachContext } from "./coach-contract";
import type { LiveCookProjection } from "./live-cook-contract";

export interface CoachContextSource {
  findActive(): LiveCookProjection | undefined;
}

export function reduceCoachContext(source: CoachContextSource): CoachContext {
  const active = source.findActive();
  if (!active) return Object.freeze({ kind: "none" });
  if (active.status !== "ACTIVE" && active.status !== "PAUSED") {
    throw new Error(`Active-session projection returned terminal status: ${active.status}`);
  }
  if (!active.currentStep) throw new Error(`Active-session projection has no current step: ${active.id}`);

  const phase = phaseAtStepOrdinal(active, active.currentStep.ordinal);
  return Object.freeze({
    kind: "active",
    sessionId: active.id,
    sessionTitle: active.plan.title,
    sessionStatus: active.status,
    phaseTitle: phase.title,
    stepOrdinal: active.currentStep.ordinal,
    stepTitle: active.currentStep.title,
    projectedAt: active.projectedAt,
  });
}

function phaseAtStepOrdinal(
  projection: LiveCookProjection,
  stepOrdinal: number,
): LiveCookProjection["plan"]["phases"][number] {
  let firstStepOrdinal = 0;
  for (const phase of projection.plan.phases) {
    if (stepOrdinal < firstStepOrdinal + phase.steps.length) return phase;
    firstStepOrdinal += phase.steps.length;
  }
  throw new Error(`Current step ordinal is outside the persisted plan: ${stepOrdinal}`);
}
