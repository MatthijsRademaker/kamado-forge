import { describe, expect, test } from "bun:test";
import { apiRouteRegistry, healthRoute } from "./contract";
import { buildOpenApiDocument } from "./openapi";

describe("OpenAPI generation", () => {
  test("documents every route in the executable registry", () => {
    const mutableRegistry = apiRouteRegistry as unknown as Array<typeof healthRoute>;
    const readyRoute = {
      ...healthRoute,
      openApiPath: "/ready",
      operationId: "getReady",
    } as unknown as typeof healthRoute;

    try {
      mutableRegistry.push(readyRoute);
      const document = buildOpenApiDocument();

      expect(document.paths?.["/ready"]?.get?.operationId).toBe("getReady");
    } finally {
      mutableRegistry.pop();
    }
  });

  test("derives the documented operation method from route metadata", () => {
    const mutableRoute = healthRoute as { method: string };
    const originalMethod = mutableRoute.method;

    try {
      mutableRoute.method = "POST";
      const document = buildOpenApiDocument();

      expect(document.paths?.["/health"]?.post?.operationId).toBe("getHealth");
      expect(document.paths?.["/health"]?.get).toBeUndefined();
    } finally {
      mutableRoute.method = originalMethod;
    }
  });

  test("documents every response declared by route metadata", () => {
    const mutableResponses = healthRoute.responses as unknown as Record<number, (typeof healthRoute.responses)[400]>;

    try {
      mutableResponses[418] = healthRoute.responses[400];
      const document = buildOpenApiDocument();

      expect(document.paths?.["/health"]?.get?.responses[418]).toBeDefined();
    } finally {
      delete mutableResponses[418];
    }
  });

  test("describes the contract-backed health operation and every declared response", () => {
    const document = buildOpenApiDocument();

    expect(document.openapi).toBe("3.0.3");
    expect(document.info.version).toBe("2.0.0");
    expect(document.servers).toEqual([{ url: "/api" }]);
    expect(document.paths?.["/health"]?.get?.operationId).toBe("getHealth");
    expect(Object.keys(document.paths?.["/health"]?.get?.responses ?? {})).toEqual(["200", "400", "404", "405"]);
  });

  test("emits the complete strict read step as one satisfiable object schema", () => {
    const schema = buildOpenApiDocument().components?.schemas?.CookingSessionStep;

    expect(schema).toMatchObject({
      type: "object",
      properties: {
        title: { type: "string", minLength: 1 },
        instructions: { type: "string", minLength: 1 },
        durationMinutes: { type: "integer", minimum: 1, maximum: 1440 },
        id: { type: "string", format: "uuid" },
      },
      required: ["title", "instructions", "durationMinutes", "id"],
      additionalProperties: false,
    });
    expect(schema).not.toHaveProperty("allOf");
  });

  test("publishes the local plan model and every cooking-session CRUD operation", () => {
    const document = buildOpenApiDocument();
    const sessionPlan = document.components?.schemas?.SessionPlan;

    expect(sessionPlan).toBeDefined();
    expect(sessionPlan).toMatchObject({
      type: "object",
      required: [
        "id",
        "title",
        "date",
        "phases",
        "plannedDomeTarget",
        "plannedFoodTarget",
        "setup",
        "ventFireGuidance",
        "prepNotes",
      ],
    });
    expect(Object.keys(document.paths ?? {})).toEqual(["/health", "/sessions", "/sessions/{sessionId}"]);
    expect(document.paths?.["/sessions"]?.post?.operationId).toBe("createCookingSession");
    expect(document.paths?.["/sessions"]?.post?.requestBody).toMatchObject({ required: true });
    expect(document.paths?.["/sessions"]?.get?.operationId).toBe("listCookingSessions");
    expect(document.paths?.["/sessions/{sessionId}"]?.get?.operationId).toBe("getCookingSession");
    expect(document.paths?.["/sessions/{sessionId}"]?.put?.operationId).toBe("updateCookingSession");
    expect(document.paths?.["/sessions/{sessionId}"]?.delete?.responses[204]).not.toHaveProperty("content");
  });
});
