import { describe, expect, test } from "bun:test";
import { createApiDispatcher } from "./dispatcher";

const validHealthData = {
  ok: true,
  service: "api",
  database: { status: "ok" },
} as const;

describe("API dispatcher", () => {
  test("serves the exact contract-backed health response", async () => {
    const dispatch = createApiDispatcher({ getHealth: () => validHealthData });

    const response = dispatch(new Request("http://api.test/api/health"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ data: validHealthData });
  });

  test("rejects and deterministically orders every unexpected health query key", async () => {
    const dispatch = createApiDispatcher({ getHealth: () => validHealthData });

    const response = dispatch(new Request("http://api.test/api/health?zeta=1&alpha=2"));

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

    const response = dispatch(new Request("http://api.test/api/health?%C3%A4=1&z=2"));
    const body = (await response.json()) as { error: { issues: Array<{ path: string }> } };

    expect(body.error.issues.map((issue) => issue.path)).toEqual(["query.z", "query.ä"]);
  });

  test("returns the shared exact error for an unknown route", async () => {
    const dispatch = createApiDispatcher({ getHealth: () => validHealthData });

    const response = dispatch(new Request("http://api.test/api/missing"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Route not found", issues: [] },
    });
  });

  test("returns the shared exact error for an unsupported health method", async () => {
    const dispatch = createApiDispatcher({ getHealth: () => validHealthData });

    const response = dispatch(new Request("http://api.test/api/health", { method: "POST" }));

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
});
