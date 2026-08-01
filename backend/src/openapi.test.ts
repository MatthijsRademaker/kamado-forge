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

  test("publishes the local plan model and every live-cook operation", () => {
    const document = buildOpenApiDocument();

    expect(document.components?.schemas?.SessionPlan).toBeDefined();
    expect(Object.keys(document.paths ?? {})).toEqual([
      "/health",
      "/sessions",
      "/sessions/{sessionId}",
      "/drafts",
      "/drafts/{draftId}/activate",
      "/live-session",
      "/live-session/advance",
      "/live-session/return",
      "/live-session/pause",
      "/live-session/resume",
      "/live-session/complete",
      "/live-session/cancel",
    ]);
    expect(document.paths?.["/sessions"]?.post?.operationId).toBe("createCookingSession");
    expect(document.paths?.["/sessions/{sessionId}"]?.delete?.operationId).toBe("deleteCookingSession");
    expect(document.paths?.["/drafts"]?.post?.operationId).toBe("createLiveCookDraft");
    expect(document.paths?.["/drafts/{draftId}/activate"]?.post?.operationId).toBe("activateLiveCookDraft");
    expect(document.paths?.["/live-session"]?.get?.operationId).toBe("getActiveLiveCookSession");
    expect(document.paths?.["/live-session/complete"]?.post?.responses[200]).toBeDefined();
  });

  test("represents terminal current and next steps as nullable components", () => {
    const document = buildOpenApiDocument();
    const schemas = document.components?.schemas;

    expect(schemas?.LiveCookCurrentStep).toMatchObject({ nullable: true });
    expect(schemas?.LiveCookNextStep).toMatchObject({ nullable: true });
    expect(schemas?.LiveCookSession).toMatchObject({
      properties: {
        currentStep: { $ref: "#/components/schemas/LiveCookCurrentStep" },
        nextStep: { $ref: "#/components/schemas/LiveCookNextStep" },
      },
    });
  });
});
