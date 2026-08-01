import { describe, expect, test } from "bun:test";
import { createApiDispatcher } from "./dispatcher";
import { createLiveCookRepository } from "./persistence/live-cook-repository";
import { createTemporaryPersistence } from "./persistence/test-support";

const draft = {
  steps: [
    { ordinal: 0, title: "Light", instructions: "Light charcoal.", durationMinutes: 20 },
    { ordinal: 1, title: "Cook", instructions: "Cook indirectly.", durationMinutes: 40 },
  ],
};

function setup() {
  const fixture = createTemporaryPersistence();
  const persistence = fixture.bootstrap();
  const dispatcher = createApiDispatcher({
    getHealth: () => ({ ok: true, service: "api", database: { status: "ok" } }),
    liveCookRepository: createLiveCookRepository(persistence, {
      now: () => new Date("2026-08-08T12:00:00.000Z"),
    }),
  });
  return { fixture, persistence, dispatcher };
}

async function createDraft(dispatcher: ReturnType<typeof setup>["dispatcher"]): Promise<string> {
  const created = await dispatcher(
    new Request("http://api.test/api/drafts", { method: "POST", body: JSON.stringify(draft) }),
  );
  const { data } = (await created.json()) as { data: { id: string } };
  return data.id;
}

async function activate(dispatcher: ReturnType<typeof setup>["dispatcher"]) {
  const draftId = await createDraft(dispatcher);
  return dispatcher(new Request(`http://api.test/api/drafts/${draftId}/activate`, { method: "POST", body: "{}" }));
}

function durableSnapshot(persistence: ReturnType<typeof setup>["persistence"]) {
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
  test("rejects a malformed persisted draft without activation writes", async () => {
    const { fixture, persistence, dispatcher } = setup();
    try {
      const created = await dispatcher(
        new Request("http://api.test/api/drafts", { method: "POST", body: JSON.stringify(draft) }),
      );
      const { data } = (await created.json()) as { data: { id: string } };
      persistence.database.run("PRAGMA ignore_check_constraints = ON");
      persistence.database.run("DROP TRIGGER live_cook_draft_steps_integer_duration_update");
      persistence.database.run("UPDATE live_cook_draft_steps SET duration_minutes = ? WHERE draft_id = ?", [
        1.5,
        data.id,
      ]);
      persistence.database.run("PRAGMA ignore_check_constraints = OFF");
      const before = [
        persistence.database.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM live_cook_sessions").get(),
        persistence.database
          .query<{ count: number }, []>("SELECT COUNT(*) AS count FROM live_cook_session_steps")
          .get(),
        persistence.database.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM live_cook_transitions").get(),
        persistence.database
          .query<{ count: number }, []>("SELECT COUNT(*) AS count FROM live_cook_execution_visits")
          .get(),
        persistence.database
          .query<{ activated_at: string | null }, [string]>("SELECT activated_at FROM live_cook_drafts WHERE id = ?")
          .get(data.id),
      ];

      const response = await dispatcher(
        new Request(`http://api.test/api/drafts/${data.id}/activate`, { method: "POST", body: "{}" }),
      );

      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: "INVALID_DRAFT" } });
      expect([
        persistence.database.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM live_cook_sessions").get(),
        persistence.database
          .query<{ count: number }, []>("SELECT COUNT(*) AS count FROM live_cook_session_steps")
          .get(),
        persistence.database.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM live_cook_transitions").get(),
        persistence.database
          .query<{ count: number }, []>("SELECT COUNT(*) AS count FROM live_cook_execution_visits")
          .get(),
        persistence.database
          .query<{ activated_at: string | null }, [string]>("SELECT activated_at FROM live_cook_drafts WHERE id = ?")
          .get(data.id),
      ]).toEqual(before);
    } finally {
      fixture.cleanup();
    }
  });

  test("leaves missing-draft and live-slot conflict requests unchanged", async () => {
    const { fixture, persistence, dispatcher } = setup();

    try {
      const empty = durableSnapshot(persistence);
      const missing = await dispatcher(
        new Request("http://api.test/api/drafts/00000000-0000-4000-8000-000000000000/activate", {
          method: "POST",
          body: "{}",
        }),
      );
      expect(missing.status).toBe(404);
      expect(await missing.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
      expect(durableSnapshot(persistence)).toEqual(empty);

      const firstDraft = await createDraft(dispatcher);
      const secondDraft = await createDraft(dispatcher);
      expect(
        (
          await dispatcher(
            new Request(`http://api.test/api/drafts/${firstDraft}/activate`, { method: "POST", body: "{}" }),
          )
        ).status,
      ).toBe(200);
      const beforeConflict = durableSnapshot(persistence);
      const conflict = await dispatcher(
        new Request(`http://api.test/api/drafts/${secondDraft}/activate`, { method: "POST", body: "{}" }),
      );
      expect(conflict.status).toBe(409);
      expect(await conflict.json()).toMatchObject({ error: { code: "ACTIVE_SESSION_CONFLICT" } });
      expect(durableSnapshot(persistence)).toEqual(beforeConflict);
    } finally {
      fixture.cleanup();
    }
  });

  test("enforces every state and step-boundary rejection without durable writes", async () => {
    const { fixture, persistence, dispatcher } = setup();
    const commands = ["advance", "return", "pause", "resume", "complete", "cancel"] as const;

    async function reject(action: (typeof commands)[number]) {
      const before = durableSnapshot(persistence);
      const response = await dispatcher(
        new Request(`http://api.test/api/live-session/${action}`, { method: "POST", body: "{}" }),
      );
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: "INVALID_TRANSITION" } });
      expect(durableSnapshot(persistence)).toEqual(before);
    }

    try {
      const firstDraft = await createDraft(dispatcher);
      expect(
        (
          await dispatcher(
            new Request(`http://api.test/api/drafts/${firstDraft}/activate`, { method: "POST", body: "{}" }),
          )
        ).status,
      ).toBe(200);
      await reject("return");
      await reject("complete");
      await reject("resume");

      expect(
        (await dispatcher(new Request("http://api.test/api/live-session/pause", { method: "POST", body: "{}" })))
          .status,
      ).toBe(200);
      await reject("pause");
      await reject("advance");
      await reject("return");
      await reject("complete");
      expect(
        (await dispatcher(new Request("http://api.test/api/live-session/resume", { method: "POST", body: "{}" })))
          .status,
      ).toBe(200);

      expect(
        (await dispatcher(new Request("http://api.test/api/live-session/advance", { method: "POST", body: "{}" })))
          .status,
      ).toBe(200);
      expect(
        (await dispatcher(new Request("http://api.test/api/live-session/return", { method: "POST", body: "{}" })))
          .status,
      ).toBe(200);
      expect(
        (await dispatcher(new Request("http://api.test/api/live-session/advance", { method: "POST", body: "{}" })))
          .status,
      ).toBe(200);
      await reject("advance");
      const completed = await dispatcher(
        new Request("http://api.test/api/live-session/complete", { method: "POST", body: "{}" }),
      );
      const completedBody = (await completed.json()) as {
        data: { status: string; currentStep: null; nextStep: null };
      };
      expect(completed.status).toBe(200);
      expect(completedBody.data).toMatchObject({ status: "COMPLETED", currentStep: null, nextStep: null });
      for (const action of commands) await reject(action);

      const pausedDraft = await createDraft(dispatcher);
      expect(
        (
          await dispatcher(
            new Request(`http://api.test/api/drafts/${pausedDraft}/activate`, { method: "POST", body: "{}" }),
          )
        ).status,
      ).toBe(200);
      expect(
        (await dispatcher(new Request("http://api.test/api/live-session/pause", { method: "POST", body: "{}" })))
          .status,
      ).toBe(200);
      const cancelled = await dispatcher(
        new Request("http://api.test/api/live-session/cancel", { method: "POST", body: "{}" }),
      );
      expect(cancelled.status).toBe(200);
      for (const action of commands) await reject(action);

      const activeDraft = await createDraft(dispatcher);
      expect(
        (
          await dispatcher(
            new Request(`http://api.test/api/drafts/${activeDraft}/activate`, { method: "POST", body: "{}" }),
          )
        ).status,
      ).toBe(200);
      expect(
        (await dispatcher(new Request("http://api.test/api/live-session/cancel", { method: "POST", body: "{}" })))
          .status,
      ).toBe(200);
    } finally {
      fixture.cleanup();
    }
  });

  test("preserves every visit and note across repeated returns", async () => {
    const { fixture, dispatcher } = setup();
    const repeatedDraft = {
      steps: [
        { ordinal: 0, title: "Light", instructions: "Light charcoal.", durationMinutes: 20 },
        { ordinal: 1, title: "Cook", instructions: "Cook indirectly.", durationMinutes: 40 },
        { ordinal: 2, title: "Rest", instructions: "Rest the meat.", durationMinutes: 10 },
      ],
    };

    try {
      const created = await dispatcher(
        new Request("http://api.test/api/drafts", { method: "POST", body: JSON.stringify(repeatedDraft) }),
      );
      const { data } = (await created.json()) as { data: { id: string } };
      expect(
        (
          await dispatcher(
            new Request(`http://api.test/api/drafts/${data.id}/activate`, { method: "POST", body: "{}" }),
          )
        ).status,
      ).toBe(200);

      for (const [action, note] of [
        ["advance", "to cook"],
        ["advance", "to rest"],
        ["return", "back to cook"],
        ["return", "back to light"],
      ] as const) {
        expect(
          (
            await dispatcher(
              new Request(`http://api.test/api/live-session/${action}`, {
                method: "POST",
                body: JSON.stringify({ note }),
              }),
            )
          ).status,
        ).toBe(200);
      }

      const projection = await dispatcher(new Request("http://api.test/api/live-session"));
      const projectionBody = (await projection.json()) as {
        data: {
          currentStep: { ordinal: number };
          nextStep: { ordinal: number };
          executionHistory: Array<{ step: { ordinal: number }; notes: Array<{ content: string }> }>;
        };
      };
      expect(projection.status).toBe(200);
      expect(projectionBody.data.currentStep.ordinal).toBe(0);
      expect(projectionBody.data.nextStep.ordinal).toBe(1);
      expect(projectionBody.data.executionHistory.map((visit) => visit.step.ordinal)).toEqual([0, 1, 2, 1, 0]);
      expect(projectionBody.data.executionHistory.flatMap((visit) => visit.notes.map((note) => note.content))).toEqual([
        "to cook",
        "to rest",
        "back to cook",
        "back to light",
      ]);
    } finally {
      fixture.cleanup();
    }
  });

  test("retains active and paused projections after reopening SQLite", async () => {
    const { fixture, persistence, dispatcher } = setup();
    const clock = { now: () => new Date("2026-08-08T12:00:00.000Z") };

    try {
      expect((await activate(dispatcher)).status).toBe(200);
      expect(
        (
          await dispatcher(
            new Request("http://api.test/api/live-session/advance", { method: "POST", body: '{"note":"checked"}' }),
          )
        ).status,
      ).toBe(200);
      const active = await dispatcher(new Request("http://api.test/api/live-session"));
      const activeBody = await active.json();
      expect(active.status).toBe(200);

      persistence.close();
      const activePersistence = fixture.bootstrap();
      const activeDispatcher = createApiDispatcher({
        getHealth: () => ({ ok: true, service: "api", database: { status: "ok" } }),
        liveCookRepository: createLiveCookRepository(activePersistence, clock),
      });
      const reopenedActive = await activeDispatcher(new Request("http://api.test/api/live-session"));
      expect(reopenedActive.status).toBe(200);
      expect(await reopenedActive.json()).toEqual(activeBody);

      expect(
        (await activeDispatcher(new Request("http://api.test/api/live-session/pause", { method: "POST", body: "{}" })))
          .status,
      ).toBe(200);
      const paused = await activeDispatcher(new Request("http://api.test/api/live-session"));
      const pausedBody = await paused.json();
      expect(paused.status).toBe(200);

      activePersistence.close();
      const pausedPersistence = fixture.bootstrap();
      const pausedDispatcher = createApiDispatcher({
        getHealth: () => ({ ok: true, service: "api", database: { status: "ok" } }),
        liveCookRepository: createLiveCookRepository(pausedPersistence, clock),
      });
      const reopenedPaused = await pausedDispatcher(new Request("http://api.test/api/live-session"));
      expect(reopenedPaused.status).toBe(200);
      expect(await reopenedPaused.json()).toEqual(pausedBody);
    } finally {
      fixture.cleanup();
    }
  });

  test("preserves visits across pause, return, advance, and final completion", async () => {
    const { fixture, dispatcher } = setup();
    try {
      expect((await activate(dispatcher)).status).toBe(200);
      expect(
        (await dispatcher(new Request("http://api.test/api/live-session/pause", { method: "POST", body: "{}" })))
          .status,
      ).toBe(200);
      expect(
        (await dispatcher(new Request("http://api.test/api/live-session/complete", { method: "POST", body: "{}" })))
          .status,
      ).toBe(409);
      expect(
        (await dispatcher(new Request("http://api.test/api/live-session/resume", { method: "POST", body: "{}" })))
          .status,
      ).toBe(200);
      expect(
        (
          await dispatcher(
            new Request("http://api.test/api/live-session/advance", { method: "POST", body: '{"note":"arrived"}' }),
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await dispatcher(
            new Request("http://api.test/api/live-session/return", { method: "POST", body: '{"note":"returning"}' }),
          )
        ).status,
      ).toBe(200);
      const advanced = await dispatcher(
        new Request("http://api.test/api/live-session/advance", { method: "POST", body: '{"note":"second pass"}' }),
      );
      const advancedBody = (await advanced.json()) as {
        data: {
          executionHistory: Array<{
            actualStartedAt: string;
            actualFinishedAt: string | null;
            notes: Array<{ content: string }>;
          }>;
        };
      };
      expect(advanced.status).toBe(200);
      expect(advancedBody.data.executionHistory).toHaveLength(4);
      expect(advancedBody.data.executionHistory.flatMap((visit) => visit.notes.map((note) => note.content))).toEqual([
        "arrived",
        "returning",
        "second pass",
      ]);
      expect(advancedBody.data.executionHistory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            actualStartedAt: "2026-08-08T12:00:00.000Z",
            actualFinishedAt: "2026-08-08T12:00:00.000Z",
          }),
          expect.objectContaining({ actualStartedAt: "2026-08-08T12:00:00.000Z", actualFinishedAt: null }),
        ]),
      );
      const completed = await dispatcher(
        new Request("http://api.test/api/live-session/complete", { method: "POST", body: '{"note":"done"}' }),
      );
      const completedBody = (await completed.json()) as {
        data: {
          currentStep: null;
          nextStep: null;
          executionHistory: Array<{ actualFinishedAt: string | null; notes: Array<{ content: string }> }>;
        };
      };
      expect(completed.status).toBe(200);
      expect(completedBody.data.currentStep).toBeNull();
      expect(completedBody.data.nextStep).toBeNull();
      expect(completedBody.data.executionHistory.at(-1)).toMatchObject({
        actualFinishedAt: "2026-08-08T12:00:00.000Z",
        notes: [{ content: "second pass" }, { content: "done" }],
      });
      expect((await dispatcher(new Request("http://api.test/api/live-session"))).status).toBe(404);
      expect(
        (await dispatcher(new Request("http://api.test/api/live-session/cancel", { method: "POST", body: "{}" })))
          .status,
      ).toBe(409);
    } finally {
      fixture.cleanup();
    }
  });
});
