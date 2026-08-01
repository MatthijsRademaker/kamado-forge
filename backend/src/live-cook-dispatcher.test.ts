import { describe, expect, test } from "bun:test";
import { createApiDispatcher } from "./dispatcher";
import { createLiveCookRepository, type LiveCookRepository } from "./persistence/live-cook-repository";
import { createTemporaryPersistence } from "./persistence/test-support";

const health = () => ({ ok: true, service: "api", database: { status: "ok" } }) as const;

const draft = {
  steps: [
    { ordinal: 0, title: "Light the charcoal", instructions: "Light one starter cube.", durationMinutes: 20 },
    { ordinal: 1, title: "Stabilize the grill", instructions: "Settle at 250F.", durationMinutes: 30 },
  ],
};

describe("live-cook draft API", () => {
  test("creates a minimally ordered draft through the declared contract", async () => {
    const fixture = createTemporaryPersistence();

    try {
      const dispatcher = createApiDispatcher({
        getHealth: health,
        liveCookRepository: createLiveCookRepository(fixture.bootstrap()),
      });
      const response = await dispatcher(
        new Request("http://api.test/api/drafts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(draft),
        }),
      );

      expect(response.status).toBe(201);
      expect(await response.json()).toMatchObject({ data: { steps: draft.steps } });
    } finally {
      fixture.cleanup();
    }
  });

  test("activates a draft atomically with an immutable first visit", async () => {
    const fixture = createTemporaryPersistence();

    try {
      const timestamp = new Date("2026-08-08T12:00:00.000Z");
      const dispatcher = createApiDispatcher({
        getHealth: health,
        liveCookRepository: createLiveCookRepository(fixture.bootstrap(), { now: () => timestamp }),
      });
      const created = await dispatcher(
        new Request("http://api.test/api/drafts", { method: "POST", body: JSON.stringify(draft) }),
      );
      const { data: liveDraft } = (await created.json()) as { data: { id: string } };

      const response = await dispatcher(
        new Request(`http://api.test/api/drafts/${liveDraft.id}/activate`, {
          method: "POST",
          body: JSON.stringify({ note: "First charcoal is lit." }),
        }),
      );
      const body = (await response.json()) as {
        data: {
          status: string;
          activatedAt: string;
          currentStep: { ordinal: number; execution: { actualStartedAt: string; notes: Array<{ content: string }> } };
          nextStep: { ordinal: number } | null;
          executionHistory: unknown[];
        };
      };

      expect(response.status).toBe(200);
      expect(body.data).toMatchObject({
        status: "ACTIVE",
        activatedAt: timestamp.toISOString(),
        currentStep: {
          ordinal: 0,
          execution: { actualStartedAt: timestamp.toISOString(), notes: [{ content: "First charcoal is lit." }] },
        },
        nextStep: { ordinal: 1 },
      });
      expect(body.data.executionHistory).toHaveLength(1);
    } finally {
      fixture.cleanup();
    }
  });

  test("maps the SQLite sole-live-session constraint to a conflict response", async () => {
    const fixture = createTemporaryPersistence();

    try {
      const dispatcher = createApiDispatcher({
        getHealth: health,
        liveCookRepository: createLiveCookRepository(fixture.bootstrap()),
      });
      const firstDraft = (await (
        await dispatcher(new Request("http://api.test/api/drafts", { method: "POST", body: JSON.stringify(draft) }))
      ).json()) as { data: { id: string } };
      const secondDraft = (await (
        await dispatcher(new Request("http://api.test/api/drafts", { method: "POST", body: JSON.stringify(draft) }))
      ).json()) as { data: { id: string } };

      expect(
        (
          await dispatcher(
            new Request(`http://api.test/api/drafts/${firstDraft.data.id}/activate`, {
              method: "POST",
              body: JSON.stringify({}),
            }),
          )
        ).status,
      ).toBe(200);
      const response = await dispatcher(
        new Request(`http://api.test/api/drafts/${secondDraft.data.id}/activate`, {
          method: "POST",
          body: JSON.stringify({}),
        }),
      );

      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({ error: { code: "ACTIVE_SESSION_CONFLICT" } });
    } finally {
      fixture.cleanup();
    }
  });

  test("refuses a live-session projection that violates its declared response schema", () => {
    const dispatcher = createApiDispatcher({
      getHealth: health,
      liveCookRepository: {
        getActive: () => ({}),
      } as unknown as LiveCookRepository,
    });

    expect(() => dispatcher(new Request("http://api.test/api/live-session"))).toThrow();
  });

  test("rejects empty and non-ordered drafts before they persist", async () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      const dispatcher = createApiDispatcher({
        getHealth: health,
        liveCookRepository: createLiveCookRepository(persistence),
      });

      for (const body of [{ steps: [] }, { steps: [draft.steps[1], draft.steps[0]] }]) {
        const response = await dispatcher(
          new Request("http://api.test/api/drafts", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          }),
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
      }

      expect(
        persistence.database.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM live_cook_drafts").get(),
      ).toEqual({ count: 0 });
    } finally {
      fixture.cleanup();
    }
  });
});
