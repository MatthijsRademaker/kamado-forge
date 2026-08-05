import type {
  CookingSession,
  CookingSessionPhase,
  LiveCookSession,
  LiveCookSessionStatus,
  LiveCookStepNote,
} from "@/api/generated/types.gen";

interface PlannedStep {
  readonly ordinal: number;
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly durationMinutes: number;
  readonly offsetMinutes: number;
  readonly phase: CookingSessionPhase;
  readonly phaseIndex: number;
}

export interface TimelineNote {
  readonly id: string;
  readonly content: string;
  readonly createdAt: string;
}

interface PlanGuidanceEntry {
  readonly kind: "plan-guidance";
  readonly key: string;
  readonly setupGuidance: string;
  readonly ventGuidance: string;
  readonly deflectorGuidance: string;
  readonly heatZoneGuidance: string;
  readonly expanded: boolean;
}

interface PhaseDividerEntry {
  readonly kind: "phase-divider";
  readonly key: string;
  readonly phaseId: string;
  readonly position: number;
  readonly title: string;
  readonly technique: string;
  readonly transitionGuidance: string;
  readonly offsetMinutes: number;
}

interface VisitEntry {
  readonly kind: "visit";
  readonly key: string;
  readonly visitId: string;
  readonly stepId: string;
  readonly stepOrdinal: number;
  readonly title: string;
  readonly attempt: number;
  readonly attemptTotal: number;
  readonly offsetMinutes: number;
  readonly plannedDurationMinutes: number;
  readonly actualStartedAt: string;
  readonly actualSeconds: number;
  readonly driftSeconds: number;
  readonly notes: readonly TimelineNote[];
}

interface ReturnMarkerEntry {
  readonly kind: "return-marker";
  readonly key: string;
  readonly fromStepTitle: string;
  readonly toStepId: string;
  readonly toStepTitle: string;
}

export interface NowEntry {
  readonly kind: "now";
  readonly key: string;
  readonly visitId: string;
  readonly stepId: string;
  readonly stepOrdinal: number;
  readonly stepPosition: number;
  readonly totalSteps: number;
  readonly title: string;
  readonly instructions: string;
  readonly attempt: number;
  readonly attemptTotal: number;
  readonly offsetMinutes: number;
  readonly plannedDurationMinutes: number;
  readonly actualStartedAt: string;
  readonly elapsedSeconds: number;
  readonly driftSeconds: number;
  readonly closed: boolean;
  readonly notes: readonly TimelineNote[];
}

interface FutureStepEntry {
  readonly kind: "future-step";
  readonly key: string;
  readonly stepId: string;
  readonly stepOrdinal: number;
  readonly title: string;
  readonly instructions: string;
  readonly offsetMinutes: number;
  readonly plannedDurationMinutes: number;
  readonly projectedStartAtMs: number;
}

interface ClosingEntry {
  readonly kind: "closing";
  readonly key: string;
  readonly status: LiveCookSessionStatus;
  readonly terminal: boolean;
  readonly projectedFinishAtMs: number | null;
  readonly finishedAt: string | null;
  readonly plannedTotalMinutes: number;
  readonly actualTotalSeconds: number;
}

export type TimelineEntry =
  | PlanGuidanceEntry
  | PhaseDividerEntry
  | VisitEntry
  | ReturnMarkerEntry
  | NowEntry
  | FutureStepEntry
  | ClosingEntry;

export interface LiveTimeline {
  readonly entries: readonly TimelineEntry[];
  readonly now: NowEntry;
  readonly terminal: boolean;
}

interface TimelineClock {
  /** Live elapsed seconds for the current visit, derived by the caller from `projectedAt`. */
  readonly elapsedSeconds: number;
  /** Wall clock used for the naïve projection of the remaining plan. */
  readonly nowMs: number;
}

export function flattenPlannedSteps(plan: CookingSession): PlannedStep[] {
  const steps: PlannedStep[] = [];
  let offsetMinutes = 0;
  plan.phases.forEach((phase, phaseIndex) => {
    for (const step of phase.steps) {
      steps.push({
        ordinal: steps.length,
        id: step.id,
        title: step.title,
        instructions: step.instructions,
        durationMinutes: step.durationMinutes,
        offsetMinutes,
        phase,
        phaseIndex,
      });
      offsetMinutes += step.durationMinutes;
    }
  });
  return steps;
}

function plannedStepAt(plan: CookingSession, stepOrdinal: number): PlannedStep {
  const step = flattenPlannedSteps(plan).find(({ ordinal }) => ordinal === stepOrdinal);
  if (!step) throw new Error(`Current step ordinal is outside the displayed plan: ${stepOrdinal}`);
  return step;
}

export function phaseTitleAtStep(session: LiveCookSession, stepOrdinal: number): string {
  return plannedStepAt(session.plan, stepOrdinal).phase.title;
}

export function deriveLiveTimeline(session: LiveCookSession, clock: TimelineClock): LiveTimeline {
  const plannedSteps = flattenPlannedSteps(session.plan);
  const terminal = session.status === "COMPLETED" || session.status === "CANCELLED";
  const history = session.executionHistory;
  const nowIndex = terminal
    ? history.length - 1
    : history.findIndex((visit) => visit.id === session.currentStep?.execution.id);
  const nowVisit = history[nowIndex];
  if (!nowVisit) throw new Error(`Live-cook session has no visit to present as the current step: ${session.id}`);

  const attemptTotals = countAttempts(history.map((visit) => visit.step.ordinal));
  const attemptsSoFar = new Map<number, number>();
  const nextAttempt = (stepOrdinal: number): number => {
    const attempt = (attemptsSoFar.get(stepOrdinal) ?? 0) + 1;
    attemptsSoFar.set(stepOrdinal, attempt);
    return attempt;
  };
  const phaseOccurrences = new Map<string, number>();
  const entries: TimelineEntry[] = [];
  let emittedPhaseIndex = -1;
  const openPhase = (planned: PlannedStep): void => {
    if (planned.phaseIndex === emittedPhaseIndex) return;
    emittedPhaseIndex = planned.phaseIndex;
    const occurrence = (phaseOccurrences.get(planned.phase.id) ?? 0) + 1;
    phaseOccurrences.set(planned.phase.id, occurrence);
    entries.push({
      kind: "phase-divider",
      key: `phase:${planned.phase.id}:${occurrence}`,
      phaseId: planned.phase.id,
      position: planned.phaseIndex + 1,
      title: planned.phase.title,
      technique: planned.phase.technique,
      transitionGuidance: planned.phase.transitionGuidance,
      offsetMinutes: planned.offsetMinutes,
    });
  };

  entries.push({
    kind: "plan-guidance",
    key: "plan-guidance",
    setupGuidance: session.plan.setupGuidance,
    ventGuidance: session.plan.ventGuidance,
    deflectorGuidance: session.plan.deflectorGuidance,
    heatZoneGuidance: session.plan.heatZoneGuidance,
    expanded: !history.some((visit) => visit.actualFinishedAt !== null),
  });

  for (const [index, visit] of history.slice(0, nowIndex).entries()) {
    const planned = plannedStepAt(session.plan, visit.step.ordinal);
    openPhase(planned);
    entries.push({
      kind: "visit",
      key: `visit:${visit.id}`,
      visitId: visit.id,
      stepId: visit.step.id,
      stepOrdinal: visit.step.ordinal,
      title: visit.step.title,
      attempt: nextAttempt(visit.step.ordinal),
      attemptTotal: attemptTotals.get(visit.step.ordinal) ?? 1,
      offsetMinutes: planned.offsetMinutes,
      plannedDurationMinutes: visit.step.durationMinutes,
      actualStartedAt: visit.actualStartedAt,
      actualSeconds: visit.elapsedSeconds,
      driftSeconds: visit.elapsedSeconds - visit.step.durationMinutes * 60,
      notes: toNotes(visit.notes),
    });

    const successor = history[index + 1];
    if (successor && successor.step.ordinal < visit.step.ordinal) {
      entries.push({
        kind: "return-marker",
        key: `return:${visit.id}`,
        fromStepTitle: visit.step.title,
        toStepId: successor.step.id,
        toStepTitle: successor.step.title,
      });
    }
  }

  const nowPlanned = plannedStepAt(session.plan, nowVisit.step.ordinal);
  openPhase(nowPlanned);
  const now: NowEntry = {
    kind: "now",
    key: `now:${nowVisit.id}`,
    visitId: nowVisit.id,
    stepId: nowVisit.step.id,
    stepOrdinal: nowVisit.step.ordinal,
    stepPosition: nowVisit.step.ordinal + 1,
    totalSteps: session.progress.totalSteps,
    title: nowVisit.step.title,
    instructions: nowVisit.step.instructions,
    attempt: nextAttempt(nowVisit.step.ordinal),
    attemptTotal: attemptTotals.get(nowVisit.step.ordinal) ?? 1,
    offsetMinutes: nowPlanned.offsetMinutes,
    plannedDurationMinutes: nowVisit.step.durationMinutes,
    actualStartedAt: nowVisit.actualStartedAt,
    elapsedSeconds: clock.elapsedSeconds,
    driftSeconds: clock.elapsedSeconds - nowVisit.step.durationMinutes * 60,
    closed: terminal,
    notes: toNotes(nowVisit.notes),
  };
  entries.push(now);

  // The projection is naïve on purpose: it spends the remainder of the current
  // step and every planned duration after it, ignoring the drift already
  // accumulated above. It is presented as an approximation, never a deadline.
  let projectedMs = clock.nowMs + Math.max(0, nowVisit.step.durationMinutes * 60 - clock.elapsedSeconds) * 1000;
  if (!terminal) {
    for (const planned of plannedSteps.filter(({ ordinal }) => ordinal > nowVisit.step.ordinal)) {
      openPhase(planned);
      entries.push({
        kind: "future-step",
        key: `future:${planned.id}`,
        stepId: planned.id,
        stepOrdinal: planned.ordinal,
        title: planned.title,
        instructions: planned.instructions,
        offsetMinutes: planned.offsetMinutes,
        plannedDurationMinutes: planned.durationMinutes,
        projectedStartAtMs: projectedMs,
      });
      projectedMs += planned.durationMinutes * 60_000;
    }
  }

  entries.push({
    kind: "closing",
    key: "closing",
    status: session.status,
    terminal,
    projectedFinishAtMs: terminal ? null : projectedMs,
    finishedAt: nowVisit.actualFinishedAt ?? nowVisit.cancelledAt,
    plannedTotalMinutes: plannedSteps.reduce((total, { durationMinutes }) => total + durationMinutes, 0),
    actualTotalSeconds:
      history.slice(0, nowIndex).reduce((total, visit) => total + visit.elapsedSeconds, 0) + clock.elapsedSeconds,
  });

  return { entries, now, terminal };
}

function countAttempts(stepOrdinals: readonly number[]): Map<number, number> {
  const totals = new Map<number, number>();
  for (const ordinal of stepOrdinals) totals.set(ordinal, (totals.get(ordinal) ?? 0) + 1);
  return totals;
}

function toNotes(notes: readonly LiveCookStepNote[]): TimelineNote[] {
  return notes.map(({ id, content, createdAt }) => ({ id, content, createdAt }));
}
