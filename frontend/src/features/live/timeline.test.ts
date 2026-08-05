import { describe, expect, test } from "bun:test";
import type {
  CookingSession,
  LiveCookExecutionVisit,
  LiveCookSession,
  LiveCookSessionStatus,
} from "@/api/generated/types.gen";
import { deriveLiveTimeline, flattenPlannedSteps, phaseTitleAtStep, type TimelineEntry } from "./timeline";

const activatedAt = "2026-08-05T13:03:00.000Z";
const projectedAt = "2026-08-05T13:07:05.000Z";

const plan = {
  id: "plan-1",
  title: "Reverse-sear steak night",
  cookingDate: "2026-08-05",
  plannedDomeRange: { minF: 225, maxF: 275 },
  plannedFoodTargetF: 130,
  setupGuidance: "Two zones.",
  deflectorGuidance: "Half moon.",
  heatZoneGuidance: "Direct right.",
  ventGuidance: "Quarter open.",
  prepNotes: "Dry brine.",
  status: "draft",
  createdAt: activatedAt,
  updatedAt: activatedAt,
  phases: [
    {
      id: "phase-fire",
      title: "Fire",
      technique: "Indirect",
      transitionGuidance: "Wait for clean smoke.",
      steps: [
        {
          id: "step-stabilize",
          title: "Stabilize a clean fire",
          instructions: "Settle the dome.",
          durationMinutes: 20,
        },
        { id: "step-cook", title: "Cook over the clean fire", instructions: "Keep it indirect.", durationMinutes: 30 },
      ],
    },
    {
      id: "phase-sear",
      title: "Sear",
      technique: "Direct",
      transitionGuidance: "Pull the deflector.",
      steps: [{ id: "step-sear", title: "Sear and rest", instructions: "Sear both sides.", durationMinutes: 10 }],
    },
  ],
} satisfies CookingSession;

function visit(
  overrides: Partial<LiveCookExecutionVisit> & { id: string; ordinal: number; stepOrdinal: number },
): LiveCookExecutionVisit {
  const planned = flattenPlannedSteps(plan).find(({ ordinal }) => ordinal === overrides.stepOrdinal);
  if (!planned) throw new Error(`Fixture references a missing step ordinal: ${overrides.stepOrdinal}`);
  return {
    id: overrides.id,
    ordinal: overrides.ordinal,
    actualStartedAt: overrides.actualStartedAt ?? activatedAt,
    actualFinishedAt: overrides.actualFinishedAt ?? null,
    cancelledAt: overrides.cancelledAt ?? null,
    elapsedSeconds: overrides.elapsedSeconds ?? 0,
    notes: overrides.notes ?? [],
    step: {
      id: planned.id,
      ordinal: planned.ordinal,
      title: planned.title,
      instructions: planned.instructions,
      durationMinutes: planned.durationMinutes,
    },
  };
}

function session(
  status: LiveCookSessionStatus,
  history: readonly LiveCookExecutionVisit[],
  currentVisitId: string | null,
): LiveCookSession {
  const currentVisit = history.find(({ id }) => id === currentVisitId);
  const totalSteps = flattenPlannedSteps(plan).length;
  const cursor = currentVisit ?? history.at(-1);
  if (!cursor) throw new Error("Fixture requires at least one visit");
  const nextStep = flattenPlannedSteps(plan).find(({ ordinal }) => ordinal === cursor.step.ordinal + 1);
  return {
    id: "session-1",
    status,
    activatedAt,
    projectedAt,
    plan,
    currentStep: currentVisit
      ? {
          id: currentVisit.step.id,
          ordinal: currentVisit.step.ordinal,
          title: currentVisit.step.title,
          instructions: currentVisit.step.instructions,
          durationMinutes: currentVisit.step.durationMinutes,
          execution: {
            id: currentVisit.id,
            ordinal: currentVisit.ordinal,
            actualStartedAt: currentVisit.actualStartedAt,
            actualFinishedAt: currentVisit.actualFinishedAt,
            cancelledAt: currentVisit.cancelledAt,
            elapsedSeconds: currentVisit.elapsedSeconds,
            notes: currentVisit.notes,
          },
        }
      : null,
    nextStep:
      currentVisit && nextStep
        ? {
            id: nextStep.id,
            ordinal: nextStep.ordinal,
            title: nextStep.title,
            instructions: nextStep.instructions,
            durationMinutes: nextStep.durationMinutes,
          }
        : null,
    progress: {
      currentStepOrdinal: cursor.step.ordinal,
      totalSteps,
      percent: Math.round(((cursor.step.ordinal + 1) / totalSteps) * 100),
    },
    executionHistory: [...history],
  };
}

function kinds(entries: readonly TimelineEntry[]): string[] {
  return entries.map((entry) => entry.kind);
}

function entryOfKind<Kind extends TimelineEntry["kind"]>(
  entries: readonly TimelineEntry[],
  kind: Kind,
  index = 0,
): Extract<TimelineEntry, { kind: Kind }> {
  const matches = entries.filter((entry): entry is Extract<TimelineEntry, { kind: Kind }> => entry.kind === kind);
  const match = matches[index];
  if (!match) throw new Error(`Expected a ${kind} entry at index ${index}`);
  return match;
}

// The shape of the real session at /live/ccc78fce-017c-41a2-9141-bddfa0f6f713:
// step 0 for 8s, advance to step 1 for 2s, then return to step 0, still open.
const returnedHistory = [
  visit({
    id: "visit-0",
    ordinal: 0,
    stepOrdinal: 0,
    actualStartedAt: "2026-08-05T13:03:00.000Z",
    actualFinishedAt: "2026-08-05T13:03:08.000Z",
    elapsedSeconds: 8,
    notes: [{ id: "note-a", ordinal: 0, content: "Clean smoke settled in.", createdAt: "2026-08-05T13:03:04.000Z" }],
  }),
  visit({
    id: "visit-1",
    ordinal: 1,
    stepOrdinal: 1,
    actualStartedAt: "2026-08-05T13:03:08.000Z",
    actualFinishedAt: "2026-08-05T13:03:10.000Z",
    elapsedSeconds: 2,
    notes: [{ id: "note-b", ordinal: 0, content: "Too cool to cook.", createdAt: "2026-08-05T13:03:09.000Z" }],
  }),
  visit({
    id: "visit-2",
    ordinal: 2,
    stepOrdinal: 0,
    actualStartedAt: "2026-08-05T13:03:10.000Z",
    elapsedSeconds: 245,
  }),
] satisfies LiveCookExecutionVisit[];

describe("live-cook timeline derivation", () => {
  test("orders the entry vocabulary from pre-cook guidance to the closing entry", () => {
    const { entries, terminal } = deriveLiveTimeline(session("ACTIVE", returnedHistory, "visit-2"), {
      elapsedSeconds: 245,
      nowMs: Date.parse(projectedAt),
    });

    expect(terminal).toBe(false);
    expect(kinds(entries)).toEqual([
      "plan-guidance",
      "phase-divider",
      "visit",
      "visit",
      "return-marker",
      "now",
      "future-step",
      "phase-divider",
      "future-step",
      "closing",
    ]);
  });

  test("renders one entry per visit with its actual start, actual duration, and drift", () => {
    const { entries } = deriveLiveTimeline(session("ACTIVE", returnedHistory, "visit-2"), {
      elapsedSeconds: 245,
      nowMs: Date.parse(projectedAt),
    });

    expect(entryOfKind(entries, "visit", 0)).toMatchObject({
      visitId: "visit-0",
      stepId: "step-stabilize",
      stepOrdinal: 0,
      title: "Stabilize a clean fire",
      attempt: 1,
      attemptTotal: 2,
      offsetMinutes: 0,
      plannedDurationMinutes: 20,
      actualStartedAt: "2026-08-05T13:03:00.000Z",
      actualSeconds: 8,
      driftSeconds: 8 - 20 * 60,
    });
    expect(entryOfKind(entries, "visit", 1)).toMatchObject({
      visitId: "visit-1",
      stepOrdinal: 1,
      offsetMinutes: 20,
      actualSeconds: 2,
      driftSeconds: 2 - 30 * 60,
    });
  });

  test("nests each note under the visit that owns it", () => {
    const { entries } = deriveLiveTimeline(session("ACTIVE", returnedHistory, "visit-2"), {
      elapsedSeconds: 245,
      nowMs: Date.parse(projectedAt),
    });

    expect(entryOfKind(entries, "visit", 0).notes).toEqual([
      { id: "note-a", content: "Clean smoke settled in.", createdAt: "2026-08-05T13:03:04.000Z" },
    ]);
    expect(entryOfKind(entries, "visit", 1).notes).toEqual([
      { id: "note-b", content: "Too cool to cook.", createdAt: "2026-08-05T13:03:09.000Z" },
    ]);
    expect(entryOfKind(entries, "now").notes).toEqual([]);
  });

  test("derives a return marker where the step ordinal decreases and labels the repeated attempt", () => {
    const { entries, now } = deriveLiveTimeline(session("ACTIVE", returnedHistory, "visit-2"), {
      elapsedSeconds: 245,
      nowMs: Date.parse(projectedAt),
    });

    expect(entryOfKind(entries, "return-marker")).toMatchObject({
      fromStepTitle: "Cook over the clean fire",
      toStepId: "step-stabilize",
      toStepTitle: "Stabilize a clean fire",
    });
    expect(now).toMatchObject({
      visitId: "visit-2",
      stepId: "step-stabilize",
      stepPosition: 1,
      totalSteps: 3,
      attempt: 2,
      attemptTotal: 2,
      elapsedSeconds: 245,
      closed: false,
    });
  });

  test("renders a separate return marker for each successive return", () => {
    const history = [
      visit({ id: "v0", ordinal: 0, stepOrdinal: 0, actualFinishedAt: activatedAt, elapsedSeconds: 60 }),
      visit({ id: "v1", ordinal: 1, stepOrdinal: 1, actualFinishedAt: activatedAt, elapsedSeconds: 60 }),
      visit({ id: "v2", ordinal: 2, stepOrdinal: 2, actualFinishedAt: activatedAt, elapsedSeconds: 60 }),
      visit({ id: "v3", ordinal: 3, stepOrdinal: 1, actualFinishedAt: activatedAt, elapsedSeconds: 60 }),
      visit({ id: "v4", ordinal: 4, stepOrdinal: 0, elapsedSeconds: 30 }),
    ];
    const { entries } = deriveLiveTimeline(session("ACTIVE", history, "v4"), {
      elapsedSeconds: 30,
      nowMs: Date.parse(projectedAt),
    });

    const markers = entries.filter((entry) => entry.kind === "return-marker");
    expect(markers).toHaveLength(2);
    expect(markers.map((marker) => marker.kind === "return-marker" && marker.toStepTitle)).toEqual([
      "Cook over the clean fire",
      "Stabilize a clean fire",
    ]);
    expect(entryOfKind(entries, "now")).toMatchObject({ attempt: 2, attemptTotal: 2 });
  });

  test("introduces every phase with a divider and keeps every planned step reachable", () => {
    const { entries } = deriveLiveTimeline(session("ACTIVE", returnedHistory, "visit-2"), {
      elapsedSeconds: 245,
      nowMs: Date.parse(projectedAt),
    });

    expect(entries.filter((entry) => entry.kind === "phase-divider").map((entry) => entry.key)).toEqual([
      "phase:phase-fire:1",
      "phase:phase-sear:1",
    ]);
    expect(entryOfKind(entries, "phase-divider", 1)).toMatchObject({
      phaseId: "phase-sear",
      position: 2,
      title: "Sear",
      technique: "Direct",
      transitionGuidance: "Pull the deflector.",
      offsetMinutes: 50,
    });
    expect(entries.filter((entry) => entry.kind === "future-step").map((entry) => entry.stepId)).toEqual([
      "step-cook",
      "step-sear",
    ]);
  });

  test("re-opens a phase divider when a return moves the cook back into an earlier phase", () => {
    const history = [
      visit({ id: "v0", ordinal: 0, stepOrdinal: 0, actualFinishedAt: activatedAt, elapsedSeconds: 60 }),
      visit({ id: "v1", ordinal: 1, stepOrdinal: 1, actualFinishedAt: activatedAt, elapsedSeconds: 60 }),
      visit({ id: "v2", ordinal: 2, stepOrdinal: 2, actualFinishedAt: activatedAt, elapsedSeconds: 60 }),
      visit({ id: "v3", ordinal: 3, stepOrdinal: 1, elapsedSeconds: 10 }),
    ];
    const { entries } = deriveLiveTimeline(session("ACTIVE", history, "v3"), {
      elapsedSeconds: 10,
      nowMs: Date.parse(projectedAt),
    });

    expect(entries.filter((entry) => entry.kind === "phase-divider").map((entry) => entry.key)).toEqual([
      "phase:phase-fire:1",
      "phase:phase-sear:1",
      "phase:phase-fire:2",
      "phase:phase-sear:2",
    ]);
  });

  test("projects the remaining plan forward from the current step without compensating drift", () => {
    const nowMs = Date.parse(projectedAt);
    const { entries } = deriveLiveTimeline(session("ACTIVE", returnedHistory, "visit-2"), {
      elapsedSeconds: 245,
      nowMs,
    });

    const remainingCurrentMs = (20 * 60 - 245) * 1000;
    expect(entryOfKind(entries, "future-step", 0)).toMatchObject({
      stepId: "step-cook",
      projectedStartAtMs: nowMs + remainingCurrentMs,
    });
    expect(entryOfKind(entries, "future-step", 1)).toMatchObject({
      stepId: "step-sear",
      projectedStartAtMs: nowMs + remainingCurrentMs + 30 * 60_000,
    });
    expect(entryOfKind(entries, "closing")).toMatchObject({
      terminal: false,
      status: "ACTIVE",
      projectedFinishAtMs: nowMs + remainingCurrentMs + 40 * 60_000,
      plannedTotalMinutes: 60,
      actualTotalSeconds: 8 + 2 + 245,
    });
  });

  test("clamps the projection when the current step has already run past its planned duration", () => {
    const nowMs = Date.parse(projectedAt);
    const { entries } = deriveLiveTimeline(session("ACTIVE", returnedHistory, "visit-2"), {
      elapsedSeconds: 30 * 60,
      nowMs,
    });

    expect(entryOfKind(entries, "future-step", 0).projectedStartAtMs).toBe(nowMs);
  });

  test("expands pre-cook guidance until the first visit finishes", () => {
    const openingHistory = [visit({ id: "visit-0", ordinal: 0, stepOrdinal: 0, elapsedSeconds: 12 })];
    const opening = deriveLiveTimeline(session("ACTIVE", openingHistory, "visit-0"), {
      elapsedSeconds: 12,
      nowMs: Date.parse(projectedAt),
    });
    const underway = deriveLiveTimeline(session("ACTIVE", returnedHistory, "visit-2"), {
      elapsedSeconds: 245,
      nowMs: Date.parse(projectedAt),
    });

    expect(entryOfKind(opening.entries, "plan-guidance")).toMatchObject({
      expanded: true,
      setupGuidance: "Two zones.",
      ventGuidance: "Quarter open.",
      deflectorGuidance: "Half moon.",
      heatZoneGuidance: "Direct right.",
    });
    expect(entryOfKind(underway.entries, "plan-guidance").expanded).toBe(false);
  });

  test("closes a terminal session on its final visit with no future steps", () => {
    const finishedHistory = [
      returnedHistory[0],
      returnedHistory[1],
      visit({
        id: "visit-2",
        ordinal: 2,
        stepOrdinal: 0,
        actualStartedAt: "2026-08-05T13:03:10.000Z",
        cancelledAt: "2026-08-05T13:07:15.000Z",
        elapsedSeconds: 245,
      }),
    ].filter((entry): entry is LiveCookExecutionVisit => entry !== undefined);
    const { entries, now, terminal } = deriveLiveTimeline(session("CANCELLED", finishedHistory, null), {
      elapsedSeconds: 245,
      nowMs: Date.parse(projectedAt),
    });

    expect(terminal).toBe(true);
    expect(kinds(entries)).toEqual([
      "plan-guidance",
      "phase-divider",
      "visit",
      "visit",
      "return-marker",
      "now",
      "closing",
    ]);
    expect(now).toMatchObject({ visitId: "visit-2", closed: true, attempt: 2 });
    expect(entryOfKind(entries, "closing")).toMatchObject({
      terminal: true,
      status: "CANCELLED",
      projectedFinishAtMs: null,
      finishedAt: "2026-08-05T13:07:15.000Z",
    });
  });

  test("fails loudly when no visit can be presented as the current step", () => {
    const withoutHistory: LiveCookSession = {
      ...session("ACTIVE", returnedHistory, "visit-2"),
      currentStep: null,
      executionHistory: [],
    };

    expect(() => deriveLiveTimeline(withoutHistory, { elapsedSeconds: 0, nowMs: 0 })).toThrow(
      "Live-cook session has no visit to present as the current step",
    );
  });
});

describe("phase membership of a flat step ordinal", () => {
  test("maps each ordinal to the phase that owns it", () => {
    const active = session("ACTIVE", returnedHistory, "visit-2");

    expect(phaseTitleAtStep(active, 0)).toBe("Fire");
    expect(phaseTitleAtStep(active, 1)).toBe("Fire");
    expect(phaseTitleAtStep(active, 2)).toBe("Sear");
  });

  test("rejects an ordinal outside the displayed plan", () => {
    expect(() => phaseTitleAtStep(session("ACTIVE", returnedHistory, "visit-2"), 3)).toThrow(
      "Current step ordinal is outside the displayed plan: 3",
    );
  });
});
