import { describe, expect, test } from "bun:test";
import { createApiDispatcher } from "./dispatcher";
import { createLiveCookRepository } from "./persistence/live-cook-repository";
import { createSessionRepository } from "./persistence/session-repository";
import { createTemporaryPersistence } from "./persistence/test-support";
import type { SessionWrite } from "./session-contract";

const health = () => ({ ok: true, service: "api", database: { status: "ok" } }) as const;

const plan: SessionWrite = {
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
      title: "Prepare",
      technique: "Fire building",
      transitionGuidance: "Wait for clean smoke.",
      steps: [
        { title: "Light", instructions: "Light one starter.", durationMinutes: 20 },
        { title: "Settle", instructions: "Settle the dome.", durationMinutes: 25 },
      ],
    },
  ],
};

describe("durable planning-to-live workflow", () => {
  test("returns an explicit empty success when no cooking session is active", async () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      const dispatcher = createApiDispatcher({
        getHealth: health,
        sessionRepository: createSessionRepository(persistence),
        liveCookRepository: createLiveCookRepository(persistence),
      });

      const response = await dispatcher(new Request("http://api.test/api/live-sessions/active"));

      expect(response.status).toBe(204);
      expect(await response.text()).toBe("");
    } finally {
      fixture.cleanup();
    }
  });

  test("persists ID-addressed notes, transitions, completion, and terminal detail", async () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      const sessionRepository = createSessionRepository(persistence);
      const created = sessionRepository.create(plan);
      const dispatcher = createApiDispatcher({
        getHealth: health,
        sessionRepository,
        liveCookRepository: createLiveCookRepository(persistence),
      });
      await dispatcher(
        new Request(`http://api.test/api/sessions/${created.id}/activate`, {
          method: "POST",
          body: JSON.stringify({}),
        }),
      );

      const noteResponse = await dispatcher(
        new Request(`http://api.test/api/live-sessions/${created.id}/notes`, {
          method: "POST",
          body: JSON.stringify({ note: "Clean smoke settled in." }),
        }),
      );
      expect(noteResponse.status).toBe(200);
      expect(await noteResponse.json()).toMatchObject({
        data: { currentStep: { execution: { notes: [{ content: "Clean smoke settled in." }] } } },
      });

      const advanceResponse = await dispatcher(
        new Request(`http://api.test/api/live-sessions/${created.id}/advance`, {
          method: "POST",
          body: JSON.stringify({}),
        }),
      );
      expect(advanceResponse.status).toBe(200);
      expect(await advanceResponse.json()).toMatchObject({ data: { currentStep: { title: "Settle" } } });

      const completionResponse = await dispatcher(
        new Request(`http://api.test/api/live-sessions/${created.id}/complete`, {
          method: "POST",
          body: JSON.stringify({}),
        }),
      );
      expect(completionResponse.status).toBe(200);
      expect(await completionResponse.json()).toMatchObject({ data: { id: created.id, status: "COMPLETED" } });

      expect((await dispatcher(new Request("http://api.test/api/live-sessions/active"))).status).toBe(204);
      const detailResponse = await dispatcher(new Request(`http://api.test/api/live-sessions/${created.id}`));
      expect(detailResponse.status).toBe(200);
      const detail = (await detailResponse.json()) as {
        data: { id: string; status: string; executionHistory: Array<{ notes: Array<{ content: string }> }> };
      };
      expect(detail.data).toMatchObject({ id: created.id, status: "COMPLETED" });
      expect(detail.data.executionHistory[0]?.notes).toEqual([
        expect.objectContaining({ content: "Clean smoke settled in." }),
      ]);
    } finally {
      fixture.cleanup();
    }
  });

  test("excludes activated cooking sessions from planning draft lists", async () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      const sessionRepository = createSessionRepository(persistence);
      const activated = sessionRepository.create({ ...plan, title: "Activated" });
      const eligible = sessionRepository.create({ ...plan, title: "Eligible" });
      const dispatcher = createApiDispatcher({
        getHealth: health,
        sessionRepository,
        liveCookRepository: createLiveCookRepository(persistence),
      });
      await dispatcher(
        new Request(`http://api.test/api/sessions/${activated.id}/activate`, {
          method: "POST",
          body: JSON.stringify({}),
        }),
      );

      for (const path of ["/api/sessions", "/api/sessions/eligible"]) {
        const response = await dispatcher(new Request(`http://api.test${path}`));

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ data: [eligible] });
      }

      const updateResponse = await dispatcher(
        new Request(`http://api.test/api/sessions/${activated.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...plan, title: "Changed after activation" }),
        }),
      );
      expect(updateResponse.status).toBe(404);
      expect(await updateResponse.json()).toMatchObject({ error: { code: "SESSION_NOT_FOUND" } });

      const deleteResponse = await dispatcher(
        new Request(`http://api.test/api/sessions/${activated.id}`, { method: "DELETE" }),
      );
      expect(deleteResponse.status).toBe(404);
      expect(await deleteResponse.json()).toMatchObject({ error: { code: "SESSION_NOT_FOUND" } });

      const liveDetail = await dispatcher(new Request(`http://api.test/api/live-sessions/${activated.id}`));
      expect(await liveDetail.json()).toMatchObject({ data: { plan: { title: "Activated" } } });
    } finally {
      fixture.cleanup();
    }
  });

  test("activates a persisted cooking session and exposes its complete plan in live detail", async () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      const sessionRepository = createSessionRepository(persistence);
      const created = sessionRepository.create(plan);
      const dispatcher = createApiDispatcher({
        getHealth: health,
        sessionRepository,
        liveCookRepository: createLiveCookRepository(persistence),
      });

      const response = await dispatcher(
        new Request(`http://api.test/api/sessions/${created.id}/activate`, {
          method: "POST",
          body: JSON.stringify({}),
        }),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        data: {
          id: created.id,
          status: "ACTIVE",
          plan: {
            id: created.id,
            title: plan.title,
            plannedDomeRange: plan.plannedDomeRange,
            phases: plan.phases,
          },
          currentStep: { title: "Light" },
          nextStep: { title: "Settle" },
        },
      });

      const repeatedActivation = await dispatcher(
        new Request(`http://api.test/api/sessions/${created.id}/activate`, {
          method: "POST",
          body: JSON.stringify({}),
        }),
      );
      expect(repeatedActivation.status).toBe(409);
      expect(await repeatedActivation.json()).toMatchObject({ error: { code: "INVALID_DRAFT" } });
    } finally {
      fixture.cleanup();
    }
  });
});
