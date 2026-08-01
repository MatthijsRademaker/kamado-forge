import { describe, expect, test } from "bun:test";
import { createApiDispatcher } from "./dispatcher";
import { createSessionRepository, type SessionRepository } from "./persistence/session-repository";
import { createTemporaryPersistence } from "./persistence/test-support";
import type { SessionWrite } from "./session-contract";

const validHealthData = {
  ok: true,
  service: "api",
  database: { status: "ok" },
} as const;

const validDraft: SessionWrite = {
  title: "Sunday cook",
  cookingDate: "2026-08-09",
  plannedDomeRange: { minF: 225, maxF: 275 },
  plannedFoodTargetF: 130,
  setupGuidance: "Set up for two zones.",
  deflectorGuidance: "Install the half-moon deflector.",
  heatZoneGuidance: "Leave a direct finishing zone.",
  ventGuidance: "Settle both vents before cooking.",
  prepNotes: "Dry brine overnight.",
  phases: [
    {
      title: "Cook",
      technique: "Indirect roast",
      transitionGuidance: "Remove the deflector before searing.",
      steps: [
        { title: "Roast", instructions: "Roast indirectly.", durationMinutes: 45 },
        { title: "Sear", instructions: "Sear over direct heat.", durationMinutes: 8 },
      ],
    },
  ],
};

describe("API dispatcher", () => {
  test("serves the exact contract-backed health response", async () => {
    const dispatch = createApiDispatcher({ getHealth: () => validHealthData });

    const response = await dispatch(new Request("http://api.test/api/health"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ data: validHealthData });
  });

  test("rejects and deterministically orders every unexpected health query key", async () => {
    const dispatch = createApiDispatcher({ getHealth: () => validHealthData });

    const response = await dispatch(new Request("http://api.test/api/health?zeta=1&alpha=2"));

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        issues: [
          {
            path: "query.alpha",
            code: "unexpected_query_parameter",
            message: "Unexpected query parameter: alpha",
          },
          {
            path: "query.zeta",
            code: "unexpected_query_parameter",
            message: "Unexpected query parameter: zeta",
          },
        ],
      },
    });
  });

  test("orders validation issues lexicographically without locale-dependent collation", async () => {
    const dispatch = createApiDispatcher({ getHealth: () => validHealthData });

    const response = await dispatch(new Request("http://api.test/api/health?%C3%A4=1&z=2"));
    const body = (await response.json()) as { error: { issues: Array<{ path: string }> } };

    expect(body.error.issues.map((issue) => issue.path)).toEqual(["query.z", "query.ä"]);
  });

  test("returns the shared exact error for an unknown route", async () => {
    const dispatch = createApiDispatcher({ getHealth: () => validHealthData });

    const response = await dispatch(new Request("http://api.test/api/missing"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Route not found", issues: [] },
    });
  });

  test("returns the shared exact error for an unsupported health method", async () => {
    const dispatch = createApiDispatcher({ getHealth: () => validHealthData });

    const response = await dispatch(new Request("http://api.test/api/health", { method: "POST" }));

    expect(response.status).toBe(405);
    expect(await response.json()).toEqual({
      error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed", issues: [] },
    });
  });

  test("refuses to return a health payload that violates the declared output schema", () => {
    const dispatch = createApiDispatcher({
      getHealth: () => ({ ...validHealthData, database: { status: "degraded" } }),
    });

    expect(() => dispatch(new Request("http://api.test/api/health"))).toThrow();
  });

  test("serves complete nested create, get, list, replace, and delete round trips", async () => {
    const fixture = createTemporaryPersistence();

    try {
      const dispatch = createApiDispatcher({
        getHealth: () => validHealthData,
        sessionRepository: createSessionRepository(fixture.bootstrap()),
      });
      const createResponse = await dispatch(
        new Request("http://api.test/api/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validDraft),
        }),
      );
      const createdBody = (await createResponse.json()) as { data: { id: string; phases: Array<{ id: string }> } };

      expect(createResponse.status).toBe(201);
      expect(createdBody.data).toMatchObject(validDraft);

      const getResponse = await dispatch(new Request(`http://api.test/api/sessions/${createdBody.data.id}`));
      expect(getResponse.status).toBe(200);
      expect(await getResponse.json()).toEqual(createdBody);

      const listResponse = await dispatch(new Request("http://api.test/api/sessions"));
      expect(listResponse.status).toBe(200);
      expect(await listResponse.json()).toEqual({ data: [createdBody.data] });

      const replacement: SessionWrite = structuredClone(validDraft);
      replacement.title = "Updated Sunday cook";
      replacement.phases[0]?.steps.reverse();
      const updateResponse = await dispatch(
        new Request(`http://api.test/api/sessions/${createdBody.data.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(replacement),
        }),
      );
      const updatedBody = (await updateResponse.json()) as typeof createdBody;

      expect(updateResponse.status).toBe(200);
      expect(updatedBody.data).toMatchObject(replacement);
      expect(updatedBody.data.phases.map((phase) => phase.id)).not.toEqual(
        createdBody.data.phases.map((phase) => phase.id),
      );

      const invalidUpdate = await dispatch(
        new Request(`http://api.test/api/sessions/${createdBody.data.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...replacement, plannedDomeRange: { minF: 300, maxF: 275 } }),
        }),
      );
      expect(invalidUpdate.status).toBe(400);
      const unchanged = await dispatch(new Request(`http://api.test/api/sessions/${createdBody.data.id}`));
      expect(await unchanged.json()).toEqual(updatedBody);

      const deleteResponse = await dispatch(
        new Request(`http://api.test/api/sessions/${createdBody.data.id}`, { method: "DELETE" }),
      );
      expect(deleteResponse.status).toBe(204);
      expect(await deleteResponse.text()).toBe("");

      const missingResponse = await dispatch(new Request(`http://api.test/api/sessions/${createdBody.data.id}`));
      expect(missingResponse.status).toBe(404);
      expect(await missingResponse.json()).toEqual({
        error: { code: "SESSION_NOT_FOUND", message: "Cooking session not found", issues: [] },
      });
      const missingUpdate = await dispatch(
        new Request(`http://api.test/api/sessions/${createdBody.data.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(validDraft),
        }),
      );
      const missingDelete = await dispatch(
        new Request(`http://api.test/api/sessions/${createdBody.data.id}`, { method: "DELETE" }),
      );
      expect(missingUpdate.status).toBe(404);
      expect(missingDelete.status).toBe(404);
    } finally {
      fixture.cleanup();
    }
  });

  test("awaits asynchronous repository operations for every session route", async () => {
    const fixture = createTemporaryPersistence();

    try {
      const synchronousRepository = createSessionRepository(fixture.bootstrap());
      const sessionRepository = {
        async create(draft) {
          return synchronousRepository.create(draft);
        },
        async get(id) {
          return synchronousRepository.get(id);
        },
        async list() {
          return synchronousRepository.list();
        },
        async update(id, draft) {
          return synchronousRepository.update(id, draft);
        },
        async delete(id) {
          return synchronousRepository.delete(id);
        },
      } satisfies SessionRepository;
      const dispatch = createApiDispatcher({ getHealth: () => validHealthData, sessionRepository });

      const createResponse = await dispatch(
        new Request("http://api.test/api/sessions", {
          method: "POST",
          body: JSON.stringify(validDraft),
        }),
      );
      const created = (await createResponse.json()) as { data: { id: string } };
      expect(createResponse.status).toBe(201);

      expect((await dispatch(new Request(`http://api.test/api/sessions/${created.data.id}`))).status).toBe(200);
      expect((await dispatch(new Request("http://api.test/api/sessions"))).status).toBe(200);
      expect(
        (
          await dispatch(
            new Request(`http://api.test/api/sessions/${created.data.id}`, {
              method: "PUT",
              body: JSON.stringify({ ...validDraft, title: "Async replacement" }),
            }),
          )
        ).status,
      ).toBe(200);
      expect(
        (await dispatch(new Request(`http://api.test/api/sessions/${created.data.id}`, { method: "DELETE" }))).status,
      ).toBe(204);
      expect(
        (await dispatch(new Request(`http://api.test/api/sessions/${created.data.id}`, { method: "DELETE" }))).status,
      ).toBe(404);
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects invalid path, query, and body input with contextual deterministic issues", async () => {
    const fixture = createTemporaryPersistence();

    try {
      const dispatch = createApiDispatcher({
        getHealth: () => validHealthData,
        sessionRepository: createSessionRepository(fixture.bootstrap()),
      });
      const invalidPath = await dispatch(new Request("http://api.test/api/sessions/not-a-uuid"));
      expect(invalidPath.status).toBe(400);
      expect((await invalidPath.json()) as object).toMatchObject({
        error: { issues: [{ path: "path.sessionId", code: "invalid_path_parameter" }] },
      });

      const invalidQuery = await dispatch(new Request("http://api.test/api/sessions?extra=true"));
      expect(invalidQuery.status).toBe(400);
      expect((await invalidQuery.json()) as object).toMatchObject({
        error: { issues: [{ path: "query.extra", code: "unexpected_query_parameter" }] },
      });

      const invalidBody = await dispatch(
        new Request("http://api.test/api/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...validDraft, cookingDate: "2026-02-30", id: "caller-owned" }),
        }),
      );
      expect(invalidBody.status).toBe(400);
      expect(
        ((await invalidBody.json()) as { error: { issues: Array<{ path: string }> } }).error.issues.map(
          (issue) => issue.path,
        ),
      ).toEqual(["body.cookingDate", "body.id"]);

      const nestedUnknownBody = structuredClone(validDraft) as SessionWrite & {
        phases: Array<SessionWrite["phases"][number] & { steps: Array<object> }>;
      };
      nestedUnknownBody.phases[0]?.steps.splice(0, 1, {
        ...validDraft.phases[0]?.steps[0],
        unexpected: true,
      });
      const nestedUnknown = await dispatch(
        new Request("http://api.test/api/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(nestedUnknownBody),
        }),
      );
      expect(
        ((await nestedUnknown.json()) as { error: { issues: Array<{ path: string }> } }).error.issues.map(
          (issue) => issue.path,
        ),
      ).toEqual(["body.phases.0.steps.0.unexpected"]);
    } finally {
      fixture.cleanup();
    }
  });
});
