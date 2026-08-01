import { describe, expect, test } from "bun:test";
import { createLiveCookRepository, LiveCookError } from "./persistence/live-cook-repository";
import { createTemporaryPersistence } from "./persistence/test-support";

const clock = { now: () => new Date("2026-08-08T12:00:00.000Z") };
const draft = {
  steps: [
    { ordinal: 0, title: "Light", instructions: "Light charcoal.", durationMinutes: 20 },
    { ordinal: 1, title: "Cook", instructions: "Cook indirectly.", durationMinutes: 40 },
  ],
};

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
      const created = repository.createDraft(draft);
      persistence.database.run("PRAGMA ignore_check_constraints = ON");
      persistence.database.run("DROP TRIGGER live_cook_draft_steps_integer_duration_update");
      persistence.database.run("UPDATE live_cook_draft_steps SET duration_minutes = 1.5 WHERE draft_id = ?", [
        created.id,
      ]);
      persistence.database.run("PRAGMA ignore_check_constraints = OFF");
      const before = durableSnapshot(persistence);

      expect(errorCode(() => repository.activateDraft(created.id, {}))).toBe("INVALID_DRAFT");
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
      expect(errorCode(() => repository.activateDraft("00000000-0000-4000-8000-000000000000", {}))).toBe("NOT_FOUND");
      expect(durableSnapshot(persistence)).toEqual(empty);

      const first = repository.createDraft(draft);
      const second = repository.createDraft(draft);
      repository.activateDraft(first.id, {});
      for (const status of ["ACTIVE", "PAUSED"] as const) {
        if (status === "PAUSED") repository.command("pause", {});
        const before = durableSnapshot(persistence);
        expect(errorCode(() => repository.activateDraft(second.id, {}))).toBe("ACTIVE_SESSION_CONFLICT");
        expect(durableSnapshot(persistence)).toEqual(before);
      }
    } finally {
      fixture.cleanup();
    }
  });

  test("persists cancellation as an unfinished visit with transition and note history", () => {
    const fixture = createTemporaryPersistence();
    try {
      const persistence = fixture.bootstrap();
      const repository = createLiveCookRepository(persistence, clock);
      const created = repository.createDraft(draft);
      repository.activateDraft(created.id, {});

      expect(repository.command("cancel", { note: "Stopped for rain." })).toMatchObject({
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
      const created = repository.createDraft(draft);
      repository.activateDraft(created.id, {});

      const reject = (action: "advance" | "return" | "pause" | "resume" | "complete" | "cancel") => {
        const before = durableSnapshot(persistence);
        expect(errorCode(() => repository.command(action, {}))).toBe("INVALID_TRANSITION");
        expect(durableSnapshot(persistence)).toEqual(before);
      };

      reject("return");
      reject("complete");
      reject("resume");
      repository.command("pause", {});
      reject("pause");
      reject("advance");
      reject("complete");
      repository.command("resume", {});
      repository.command("advance", {});
      reject("advance");
      expect(repository.command("complete", {})).toMatchObject({ status: "COMPLETED" });
      for (const action of ["advance", "return", "pause", "resume", "complete", "cancel"] as const) reject(action);
    } finally {
      fixture.cleanup();
    }
  });

  test("preserves every visit and note across repeated returns and final completion", () => {
    const fixture = createTemporaryPersistence();
    try {
      const repository = createLiveCookRepository(fixture.bootstrap(), clock);
      const created = repository.createDraft({
        steps: [...draft.steps, { ordinal: 2, title: "Rest", instructions: "Rest the meat.", durationMinutes: 10 }],
      });
      repository.activateDraft(created.id, {});
      for (const [action, note] of [
        ["advance", "to cook"],
        ["advance", "to rest"],
        ["return", "back to cook"],
        ["return", "back to light"],
        ["advance", "second cook"],
        ["advance", "second rest"],
      ] as const) {
        repository.command(action, { note });
      }
      const completed = repository.command("complete", { note: "done" });

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
      const created = repository.createDraft(draft);
      const active = repository.activateDraft(created.id, {});
      persistence.close();

      const activePersistence = fixture.bootstrap();
      const reopenedRepository = createLiveCookRepository(activePersistence, clock);
      expect(reopenedRepository.getActive()).toEqual(active);
      const paused = reopenedRepository.command("pause", {});
      activePersistence.close();

      const pausedPersistence = fixture.bootstrap();
      expect(createLiveCookRepository(pausedPersistence, clock).getActive()).toEqual(paused);
    } finally {
      fixture.cleanup();
    }
  });
});
