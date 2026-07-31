import { afterEach, describe, expect, test } from "bun:test";
import { PiniaColada } from "@pinia/colada";
import { readFileSync } from "node:fs";
import { createPinia } from "pinia";
import { createApp, effectScope } from "vue";
import { client } from "./generated/client.gen";
import { healthQueryKey, useHealthQuery, type HealthQueryData, type HealthQueryError } from "./health";

const originalFetch = globalThis.fetch;
const originalRequest = globalThis.Request;
const generatedBaseUrl = client.getConfig().baseUrl;

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.Request = originalRequest;
  client.setConfig({ baseUrl: "/api" });
});

describe("health data access", () => {
  test("configures generated requests with the relative API base", () => {
    expect(generatedBaseUrl).toBe("/api");
  });

  test("installs Pinia before Pinia Colada in application bootstrap", () => {
    const bootstrapSource = readFileSync("frontend/src/main.ts", "utf8");

    expect(bootstrapSource.indexOf(".use(createPinia())")).toBeLessThan(bootstrapSource.indexOf(".use(PiniaColada)"));
  });

  test("uses the centralized stable health query key", () => {
    expect(healthQueryKey).toEqual(["health"]);
  });

  test("requests relative /api/health through the generated operation and exposes success data", async () => {
    const requests: Request[] = [];
    const expected: HealthQueryData = { data: { ok: true, service: "api", database: { status: "ok" } } };
    expect(client.getConfig().baseUrl).toBe("/api");
    const relativeRequestInputs = installBrowserRequestBase();
    setControlledFetch(async (request) => {
      requests.push(request);
      return Response.json({ data: { ok: true, service: "api", database: { status: "ok" } } });
    });
    const fixture = createHealthQuery();

    try {
      await fixture.query.refetch(true);

      expect(requests.length).toBeGreaterThan(0);
      expect(relativeRequestInputs.length).toBeGreaterThan(0);
      expect(relativeRequestInputs.every((input) => input === "/api/health")).toBe(true);
      expect(requests.every((request) => request.url === "http://app.test/api/health")).toBe(true);
      expect(fixture.query.data.value).toEqual(expected);
    } finally {
      fixture.dispose();
    }
  });

  test("exposes a declared structured API error for a non-2xx response", async () => {
    const apiError: HealthQueryError = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        issues: [],
      },
    };
    client.setConfig({ baseUrl: "http://app.test/api" });
    setControlledFetch(async () => Response.json(apiError, { status: 400 }));
    const fixture = createHealthQuery();

    try {
      await expect(fixture.query.refetch(true)).rejects.toEqual(apiError);
      expect(fixture.query.error.value).toEqual(apiError);
    } finally {
      fixture.dispose();
    }
  });
});

function installBrowserRequestBase(): string[] {
  const relativeInputs: string[] = [];

  class BrowserRequest extends originalRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      if (typeof input === "string" && input.startsWith("/")) {
        relativeInputs.push(input);
        super(new URL(input, "http://app.test"), init);
        return;
      }

      super(input, init);
    }
  }

  globalThis.Request = BrowserRequest;
  return relativeInputs;
}

function setControlledFetch(handler: (request: Request) => Promise<Response>): void {
  const controlledFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    return handler(request);
  };
  controlledFetch.preconnect = originalFetch.preconnect;
  globalThis.fetch = controlledFetch;
}

function createHealthQuery() {
  const app = createApp({ render: () => null });
  app.use(createPinia());
  app.use(PiniaColada);
  const scope = effectScope();
  const query = app.runWithContext(() => scope.run(() => useHealthQuery()));

  if (!query) {
    scope.stop();
    throw new Error("Health query could not be created");
  }

  return {
    query,
    dispose() {
      scope.stop();
    },
  };
}
