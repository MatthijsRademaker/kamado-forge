import { afterEach, describe, expect, test } from "bun:test";
import { PiniaColada } from "@pinia/colada";
import { createPinia } from "pinia";
import { createApp, effectScope } from "vue";
import { client } from "./generated/client.gen";
import type { ApiError, CoachResult } from "./generated/types.gen";
import { CoachApiRequestError, CoachTransportError, useAskCoachMutation } from "./coach";

const originalFetch = globalThis.fetch;
const originalRequest = globalThis.Request;

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.Request = originalRequest;
  client.setConfig({ baseUrl: "/api" });
});

const success: CoachResult = {
  answer: "Keep the vents steady.",
  guidance: ["Wait ten minutes."],
  warnings: ["Do not chase short swings."],
  suggestedFollowUps: ["What does clean smoke look like?"],
  contextUsed: { kind: "none" },
};

describe("Coach data access", () => {
  test("uses the generated relative route and returns typed structured success", async () => {
    const relativeInputs = installBrowserRequestBase();
    const requests: Request[] = [];
    setControlledFetch(async (request) => {
      requests.push(request);
      return Response.json({ data: success });
    });
    const fixture = createMutationFixture();

    try {
      await expect(fixture.mutation.mutateAsync("How should I stabilize the fire?")).resolves.toEqual(success);
      expect(relativeInputs).toEqual(["/api/coach"]);
      expect(requests).toHaveLength(1);
      expect(requests[0]?.method).toBe("POST");
      expect(await requests[0]?.json()).toEqual({ question: "How should I stabilize the fire?" });
    } finally {
      fixture.dispose();
    }
  });

  test("classifies declared structured API failures", async () => {
    const apiError: ApiError = {
      error: {
        code: "COACH_PROVIDER_TIMEOUT",
        message: "Coach provider timed out",
        issues: [],
      },
    };
    client.setConfig({ baseUrl: "http://app.test/api" });
    setControlledFetch(async () => Response.json(apiError, { status: 504 }));
    const fixture = createMutationFixture();

    try {
      await expect(fixture.mutation.mutateAsync("Should I retry?")).rejects.toEqual(
        expect.objectContaining({ kind: "api", apiError }),
      );
      expect(fixture.mutation.error.value).toBeInstanceOf(CoachApiRequestError);
    } finally {
      fixture.dispose();
    }
  });

  test("classifies failures with no API response as transport failures and retains the cause", async () => {
    const offline = new TypeError("Failed to fetch");
    client.setConfig({ baseUrl: "http://app.test/api" });
    setControlledFetch(async () => {
      throw offline;
    });
    const fixture = createMutationFixture();

    try {
      await expect(fixture.mutation.mutateAsync("Can Coach hear me?")).rejects.toEqual(
        expect.objectContaining({ kind: "transport", cause: offline }),
      );
      expect(fixture.mutation.error.value).toBeInstanceOf(CoachTransportError);
    } finally {
      fixture.dispose();
    }
  });
});

function createMutationFixture() {
  const app = createApp({ render: () => null });
  app.use(createPinia());
  app.use(PiniaColada);
  const scope = effectScope();
  const mutation = app.runWithContext(() => scope.run(() => useAskCoachMutation()));
  if (!mutation) throw new Error("Coach mutation could not be created");

  return {
    mutation,
    dispose() {
      scope.stop();
    },
  };
}

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
