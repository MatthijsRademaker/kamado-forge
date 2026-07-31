import { describe, expect, test } from "bun:test";
import { startApi } from "./api";
import { createTemporaryPersistence } from "./persistence/test-support";

describe("API startup", () => {
  test("bootstraps persistence before exposing the configured health endpoint", async () => {
    const fixture = createTemporaryPersistence();
    let fetchHandler: ((request: Request) => Response) | undefined;

    try {
      const api = startApi({
        port: 3000,
        databasePath: fixture.databasePath,
        corsOrigin: "https://app.example.test",
        serve(options) {
          fetchHandler = options.fetch;
        },
      });

      const response = fetchHandler?.(new Request("http://api.test/api/health"));

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

  test("preserves successful OPTIONS preflight and configured CORS headers", () => {
    const fixture = createTemporaryPersistence();
    let fetchHandler: ((request: Request) => Response) | undefined;

    try {
      const api = startApi({
        port: 3000,
        databasePath: fixture.databasePath,
        corsOrigin: "https://app.example.test",
        serve(options) {
          fetchHandler = options.fetch;
        },
      });

      const response = fetchHandler?.(
        new Request("http://api.test/api/health", {
          method: "OPTIONS",
          headers: { "Access-Control-Request-Method": "GET" },
        }),
      );

      expect(response?.status).toBe(204);
      expect(response?.headers.get("Access-Control-Allow-Origin")).toBe("https://app.example.test");
      expect(response?.headers.get("Access-Control-Allow-Headers")).toBe("content-type, authorization");
      expect(response?.headers.get("Access-Control-Allow-Methods")).toBe("GET,POST,OPTIONS");
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
