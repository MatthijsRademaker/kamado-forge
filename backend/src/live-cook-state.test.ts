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
  const dispatcher = createApiDispatcher({
    getHealth: () => ({ ok: true, service: "api", database: { status: "ok" } }),
    liveCookRepository: createLiveCookRepository(fixture.bootstrap(), {
      now: () => new Date("2026-08-08T12:00:00.000Z"),
    }),
  });
  return { fixture, dispatcher };
}

async function activate(dispatcher: ReturnType<typeof setup>["dispatcher"]) {
  const created = await dispatcher(
    new Request("http://api.test/api/drafts", { method: "POST", body: JSON.stringify(draft) }),
  );
  const { data } = (await created.json()) as { data: { id: string } };
  return dispatcher(new Request(`http://api.test/api/drafts/${data.id}/activate`, { method: "POST", body: "{}" }));
}

describe("live-cook state machine", () => {
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
        data: { executionHistory: Array<{ notes: Array<{ content: string }> }> };
      };
      expect(advanced.status).toBe(200);
      expect(advancedBody.data.executionHistory).toHaveLength(4);
      expect(advancedBody.data.executionHistory.flatMap((visit) => visit.notes.map((note) => note.content))).toEqual([
        "arrived",
        "returning",
        "second pass",
      ]);
      expect(
        (
          await dispatcher(
            new Request("http://api.test/api/live-session/complete", { method: "POST", body: '{"note":"done"}' }),
          )
        ).status,
      ).toBe(200);
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
