import { describe, expect, test } from "bun:test";
import { startApi } from "./api";
import { createTemporaryPersistence } from "./persistence/test-support";

describe("API startup", () => {
  test("bootstraps persistence before exposing the configured health endpoint", async () => {
    const fixture = createTemporaryPersistence();
    let fetchHandler: ((request: Request) => Response | Promise<Response>) | undefined;

    try {
      const api = startApi({
        port: 3000,
        databasePath: fixture.databasePath,
        corsOrigin: "https://app.example.test",
        serve(options) {
          fetchHandler = options.fetch;
        },
      });

      const response = await fetchHandler?.(new Request("http://api.test/api/health"));

      expect(response).toBeDefined();
      expect(await response?.json()).toEqual({
        data: { ok: true, service: "api", database: { status: "ok" } },
      });
      expect(response?.headers.get("Access-Control-Allow-Origin")).toBe("https://app.example.test");
      api.persistence.close();
    } finally {
      fixture.cleanup();
    }
  });

  test("serves planning sessions alongside live-cook routes", async () => {
    const fixture = createTemporaryPersistence();
    let fetchHandler: ((request: Request) => Response | Promise<Response>) | undefined;

    try {
      const api = startApi({
        port: 3000,
        databasePath: fixture.databasePath,
        serve(options) {
          fetchHandler = options.fetch;
        },
      });
      const response = await fetchHandler?.(
        new Request("http://api.test/api/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: "Sunday cook",
            cookingDate: "2026-08-09",
            plannedDomeRange: { minF: 225, maxF: 275 },
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
                steps: [{ title: "Roast", instructions: "Roast indirectly.", durationMinutes: 45 }],
              },
            ],
          }),
        }),
      );

      expect(response?.status).toBe(201);
      expect(await response?.json()).toMatchObject({ data: { title: "Sunday cook", status: "draft" } });
      api.persistence.close();
    } finally {
      fixture.cleanup();
    }
  });

  test("keeps health available while invalid coach configuration returns the safe error", async () => {
    const fixture = createTemporaryPersistence();
    let fetchHandler: ((request: Request) => Response | Promise<Response>) | undefined;

    try {
      const api = startApi({
        port: 3000,
        databasePath: fixture.databasePath,
        environment: {},
        serve(options) {
          fetchHandler = options.fetch;
        },
      });

      const coachResponse = await fetchHandler?.(
        new Request("http://api.test/api/coach", {
          method: "POST",
          body: JSON.stringify({ messages: [{ role: "user", content: "Help" }] }),
        }),
      );
      const healthResponse = await fetchHandler?.(new Request("http://api.test/api/health"));

      expect(coachResponse?.status).toBe(503);
      expect(await coachResponse?.json()).toEqual({
        error: {
          code: "COACH_CONFIGURATION_ERROR",
          message: "Coach provider is not configured",
          issues: [],
        },
      });
      expect(healthResponse?.status).toBe(200);
      api.persistence.close();
    } finally {
      fixture.cleanup();
    }
  });

  test("constructs the configured real coach provider entirely on the server", async () => {
    const fixture = createTemporaryPersistence();
    let fetchHandler: ((request: Request) => Response | Promise<Response>) | undefined;

    try {
      const api = startApi({
        port: 3000,
        databasePath: fixture.databasePath,
        environment: {
          COACH_PROVIDER: "openai",
          COACH_MODEL: "gpt-server-model",
          OPENAI_API_KEY: "server-secret",
        },
        coachFetch: async () =>
          Response.json({
            output: [
              {
                type: "message",
                content: [{ type: "output_text", text: "Make one small vent change." }],
              },
            ],
          }),
        serve(options) {
          fetchHandler = options.fetch;
        },
      });

      const response = await fetchHandler?.(
        new Request("http://api.test/api/coach", {
          method: "POST",
          body: JSON.stringify({ messages: [{ role: "user", content: "What next?" }] }),
        }),
      );

      expect(response?.status).toBe(200);
      expect(await response?.json()).toEqual({
        data: { message: "Make one small vent change.", suggestions: [] },
      });
      api.persistence.close();
    } finally {
      fixture.cleanup();
    }
  });

  test("preserves successful OPTIONS preflight and configured CORS headers", async () => {
    const fixture = createTemporaryPersistence();
    let fetchHandler: ((request: Request) => Response | Promise<Response>) | undefined;

    try {
      const api = startApi({
        port: 3000,
        databasePath: fixture.databasePath,
        corsOrigin: "https://app.example.test",
        serve(options) {
          fetchHandler = options.fetch;
        },
      });

      const response = await fetchHandler?.(
        new Request("http://api.test/api/health", {
          method: "OPTIONS",
          headers: { "Access-Control-Request-Method": "GET" },
        }),
      );

      expect(response?.status).toBe(204);
      expect(response?.headers.get("Access-Control-Allow-Origin")).toBe("https://app.example.test");
      expect(response?.headers.get("Access-Control-Allow-Headers")).toBe("content-type, authorization");
      expect(response?.headers.get("Access-Control-Allow-Methods")).toBe("GET,POST,PUT,DELETE,OPTIONS");
      api.persistence.close();
    } finally {
      fixture.cleanup();
    }
  });

  test("does not serve HTTP when persistence bootstrap fails", () => {
    const bootstrapFailure = new Error("bootstrap failed");
    let served = false;

    expect(() =>
      startApi({
        port: 3000,
        databasePath: "/tmp/unreachable.sqlite",
        bootstrap() {
          throw bootstrapFailure;
        },
        serve() {
          served = true;
        },
      }),
    ).toThrow(bootstrapFailure);
    expect(served).toBe(false);
  });
});
