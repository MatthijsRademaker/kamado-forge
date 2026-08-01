import { describe, expect, test } from "bun:test";
import { createLiveCookRepository, LiveCookError } from "./persistence/live-cook-repository";
import { createSessionRepository } from "./persistence/session-repository";
import { createTemporaryPersistence } from "./persistence/test-support";
import type { SessionWrite } from "./session-contract";

const clock = { now: () => new Date("2026-08-08T12:00:00.000Z") };
const draft = {
  steps: [
    { ordinal: 0, title: "Light", instructions: "Light charcoal.", durationMinutes: 20 },
    { ordinal: 1, title: "Cook", instructions: "Cook indirectly.", durationMinutes: 40 },
  ],
};

type TestPersistence = ReturnType<ReturnType<typeof createTemporaryPersistence>["bootstrap"]>;

function createSession(persistence: TestPersistence, steps = draft.steps): string {
  const input: SessionWrite = {
    title: "Saturday cook",
    cookingDate: "2026-08-08",
    plannedDomeRange: { minF: 225, maxF: 275 },
    plannedFoodTargetF: 130,
    setupGuidance: "Set up for two zones.",
    deflectorGuidance: "Use the half-moon deflector.",
    heatZoneGuidance: "Keep the right side direct.",
    ventGuidance: "Bottom vent one finger, top vent quarter open.",
    prepNotes: "Dry brine overnight.",
    phases: [
      {
        title: "Cook",
        technique: "Indirect",
        transitionGuidance: "Follow the ordered steps.",
        steps: steps.map(({ ordinal: _, ...step }) => step),
      },
    ],
  };
  return createSessionRepository(persistence).create(input).id;
}

function errorCode(work: () => unknown): string | undefined {
  try {
    work();
  } catch (error) {
    if (error instanceof LiveCookError) return error.code;
    throw error;
  }
  return undefined;
}

function durableSnapshot(persistence: ReturnType<ReturnType<typeof createTemporaryPersistence>["bootstrap"]>) {
  return {
    drafts: persistence.database.query<Record<string, unknown>, []>("SELECT * FROM live_cook_drafts ORDER BY id").all(),
    sessions: persistence.database
      .query<Record<string, unknown>, []>("SELECT * FROM live_cook_sessions ORDER BY id")
      .all(),
    steps: persistence.database
      .query<Record<string, unknown>, []>("SELECT * FROM live_cook_session_steps ORDER BY id")
      .all(),
    transitions: persistence.database
      .query<Record<string, unknown>, []>("SELECT * FROM live_cook_transitions ORDER BY id")
      .all(),
    visits: persistence.database
      .query<Record<string, unknown>, []>("SELECT * FROM live_cook_execution_visits ORDER BY id")
      .all(),
    notes: persistence.database
      .query<Record<string, unknown>, []>("SELECT * FROM live_cook_step_notes ORDER BY id")
      .all(),
  };
}

describe("live-cook state machine", () => {
  test("rejects a malformed persisted draft without activation writes", () => {
    const fixture = createTemporaryPersistence();
    try {
      const persistence = fixture.bootstrap();
      const repository = createLiveCookRepository(persistence, clock);
      const sessionId = createSession(persistence);
      persistence.database.run("UPDATE cooking_session_steps SET duration_minutes = 1.5");
      const before = durableSnapshot(persistence);

      expect(errorCode(() => repository.activateSession(sessionId, {}))).toBe("INVALID_DRAFT");
      expect(durableSnapshot(persistence)).toEqual(before);
    } finally {
      fixture.cleanup();
    }
  });

  test("leaves missing activation and sole-live-session conflicts unchanged", () => {
    const fixture = createTemporaryPersistence();
    try {
      const persistence = fixture.bootstrap();
      const repository = createLiveCookRepository(persistence, clock);
      const empty = durableSnapshot(persistence);
      expect(errorCode(() => repository.activateSession("00000000-0000-4000-8000-000000000000", {}))).toBe("NOT_FOUND");
      expect(durableSnapshot(persistence)).toEqual(empty);

      const firstId = createSession(persistence);
      const secondId = createSession(persistence);
      repository.activateSession(firstId, {});
      for (const status of ["ACTIVE", "PAUSED"] as const) {
        if (status === "PAUSED") repository.command("pause", {}, firstId);
        const before = durableSnapshot(persistence);
        expect(errorCode(() => repository.activateSession(secondId, {}))).toBe("ACTIVE_SESSION_CONFLICT");
        expect(durableSnapshot(persistence)).toEqual(before);
      }
    } finally {
      fixture.cleanup();
    }
  });

  test("reports terminal progress from the step where cancellation occurred", () => {
    const fixture = createTemporaryPersistence();
    try {
      const persistence = fixture.bootstrap();
      const repository = createLiveCookRepository(persistence, clock);
      const sessionId = createSession(persistence, [
        ...draft.steps,
        { ordinal: 2, title: "Rest", instructions: "Rest the meat.", durationMinutes: 10 },
      ]);
      repository.activateSession(sessionId, {});
      repository.command("advance", {}, sessionId);

      expect(repository.command("cancel", {}, sessionId)).toMatchObject({
        progress: { currentStepOrdinal: 1, totalSteps: 3, percent: 67 },
      });
    } finally {
      fixture.cleanup();
    }
  });

  test("reports pause-aware elapsed time from an authoritative projection timestamp", () => {
    const fixture = createTemporaryPersistence();
    let now = "2026-08-08T12:00:00.000Z";
    const variableClock = { now: () => new Date(now) };
    try {
      const persistence = fixture.bootstrap();
      const repository = createLiveCookRepository(persistence, variableClock);
      const sessionId = createSession(persistence);
      repository.activateSession(sessionId, {});

      now = "2026-08-08T12:01:00.000Z";
      repository.command("pause", {}, sessionId);
      now = "2026-08-08T12:03:00.000Z";
      expect(repository.getActive()).toMatchObject({
        projectedAt: now,
        currentStep: { execution: { elapsedSeconds: 60 } },
      });

      repository.command("resume", {}, sessionId);
      now = "2026-08-08T12:04:00.000Z";
      expect(repository.getActive()).toMatchObject({
        projectedAt: now,
        currentStep: { execution: { elapsedSeconds: 120 } },
      });
    } finally {
      fixture.cleanup();
    }
  });

  test("persists cancellation as an unfinished visit with transition and note history", () => {
    const fixture = createTemporaryPersistence();
    try {
      const persistence = fixture.bootstrap();
      const repository = createLiveCookRepository(persistence, clock);
      const sessionId = createSession(persistence);
      repository.activateSession(sessionId, {});

      expect(repository.command("cancel", { note: "Stopped for rain." }, sessionId)).toMatchObject({
        status: "CANCELLED",
        currentStep: null,
        nextStep: null,
      });
      expect(
        persistence.database
          .query<{ actual_finished_at: string | null; cancelled_at: string | null }, []>(
            "SELECT actual_finished_at, cancelled_at FROM live_cook_execution_visits",
          )
          .get(),
      ).toEqual({ actual_finished_at: null, cancelled_at: "2026-08-08T12:00:00.000Z" });
      expect(
        persistence.database
          .query<{ action: string; to_status: string }, []>(
            "SELECT action, to_status FROM live_cook_transitions ORDER BY ordinal",
          )
          .all(),
      ).toEqual([
        { action: "ACTIVATE", to_status: "ACTIVE" },
        { action: "CANCEL", to_status: "CANCELLED" },
      ]);
      expect(
        persistence.database.query<{ content: string }, []>("SELECT content FROM live_cook_step_notes").get(),
      ).toEqual({ content: "Stopped for rain." });
    } finally {
      fixture.cleanup();
    }
  });

  test("enforces state and step boundaries without durable writes", () => {
    const fixture = createTemporaryPersistence();
    try {
      const persistence = fixture.bootstrap();
      const repository = createLiveCookRepository(persistence, clock);
      const sessionId = createSession(persistence);
      repository.activateSession(sessionId, {});

      const reject = (action: "advance" | "return" | "pause" | "resume" | "complete" | "cancel") => {
        const before = durableSnapshot(persistence);
        expect(errorCode(() => repository.command(action, {}, sessionId))).toBe("INVALID_TRANSITION");
        expect(durableSnapshot(persistence)).toEqual(before);
      };

      reject("return");
      reject("complete");
      reject("resume");
      repository.command("pause", {}, sessionId);
      reject("pause");
      reject("advance");
      reject("complete");
      repository.command("resume", {}, sessionId);
      repository.command("advance", {}, sessionId);
      reject("advance");
      expect(repository.command("complete", {}, sessionId)).toMatchObject({ status: "COMPLETED" });
      for (const action of ["advance", "return", "pause", "resume", "complete", "cancel"] as const) reject(action);
    } finally {
      fixture.cleanup();
    }
  });

  test("preserves every visit and note across repeated returns and final completion", () => {
    const fixture = createTemporaryPersistence();
    try {
      const persistence = fixture.bootstrap();
      const repository = createLiveCookRepository(persistence, clock);
      const sessionId = createSession(persistence, [
        ...draft.steps,
        { ordinal: 2, title: "Rest", instructions: "Rest the meat.", durationMinutes: 10 },
      ]);
      repository.activateSession(sessionId, {});
      for (const [action, note] of [
        ["advance", "to cook"],
        ["advance", "to rest"],
        ["return", "back to cook"],
        ["return", "back to light"],
        ["advance", "second cook"],
        ["advance", "second rest"],
      ] as const) {
        repository.command(action, { note }, sessionId);
      }
      const completed = repository.command("complete", { note: "done" }, sessionId);

      expect(completed.executionHistory.map((visit) => visit.step.ordinal)).toEqual([0, 1, 2, 1, 0, 1, 2]);
      expect(completed.executionHistory.flatMap((visit) => visit.notes.map((note) => note.content))).toEqual([
        "to cook",
        "to rest",
        "back to cook",
        "back to light",
        "second cook",
        "second rest",
        "done",
      ]);
      expect(completed).toMatchObject({ status: "COMPLETED", currentStep: null, nextStep: null });
    } finally {
      fixture.cleanup();
    }
  });

  test("retains active and paused projections after reopening SQLite", () => {
    const fixture = createTemporaryPersistence();
    try {
      const persistence = fixture.bootstrap();
      const repository = createLiveCookRepository(persistence, clock);
      const sessionId = createSession(persistence);
      const active = repository.activateSession(sessionId, {});
      persistence.close();

      const activePersistence = fixture.bootstrap();
      const reopenedRepository = createLiveCookRepository(activePersistence, clock);
      expect(reopenedRepository.getActive()).toEqual(active);
      const paused = reopenedRepository.command("pause", {}, sessionId);
      activePersistence.close();

      const pausedPersistence = fixture.bootstrap();
      expect(createLiveCookRepository(pausedPersistence, clock).getActive()).toEqual(paused);
    } finally {
      fixture.cleanup();
    }
  });
});
