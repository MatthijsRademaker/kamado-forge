import { describe, expect, test } from "bun:test";
import { createApiDispatcher } from "./dispatcher";
import { createFakeCoachProvider } from "./fake-coach-provider";
import { createCoachService } from "./coach-service";

const health = () => ({ ok: true, service: "api", database: { status: "ok" } }) as const;

describe("coach dispatch", () => {
  test("rejects invalid chat before context lookup or provider invocation", async () => {
    let contextReads = 0;
    const provider = createFakeCoachProvider({
      result: { message: "This must not be returned.", suggestions: [] },
    });
    const coachService = createCoachService({
      contextSource: {
        findActive() {
          contextReads += 1;
          return undefined;
        },
      },
      model: "gpt-test",
      provider,
    });
    const dispatch = createApiDispatcher({ getHealth: health, coachService });

    const response = await dispatch(
      new Request("http://api.test/api/coach", {
        method: "POST",
        body: JSON.stringify({
          messages: [
            { role: "user", content: "" },
            { role: "assistant", content: "No final user question", extra: true },
          ],
          sessionId: "caller-owned",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        issues: [
          { path: "body.messages", code: "invalid_body_field", message: "Invalid body value" },
          { path: "body.messages.0.content", code: "invalid_body_field", message: "Invalid body value" },
          {
            path: "body.messages.1.extra",
            code: "unexpected_body_field",
            message: "Unexpected body field: extra",
          },
          {
            path: "body.sessionId",
            code: "unexpected_body_field",
            message: "Unexpected body field: sessionId",
          },
        ],
      },
    });
    expect(contextReads).toBe(0);
    expect(provider.requests).toEqual([]);
  });

  test("trims chat content before enforcing bounds and invoking the provider", async () => {
    const provider = createFakeCoachProvider();
    const coachService = createCoachService({
      contextSource: { findActive: () => undefined },
      model: "gpt-test",
      provider,
    });
    const dispatch = createApiDispatcher({ getHealth: health, coachService });
    const boundedContent = "x".repeat(2_000);

    const response = await dispatch(
      new Request("http://api.test/api/coach", {
        method: "POST",
        body: JSON.stringify({ messages: [{ role: "user", content: `  ${boundedContent}  ` }] }),
      }),
    );

    expect(response.status).toBe(200);
    expect(provider.requests[0]?.chat).toEqual([{ role: "user", content: boundedContent }]);
  });

  test("awaits provider execution and returns only the validated public result", async () => {
    const coachService = createCoachService({
      contextSource: { findActive: () => undefined },
      model: "gpt-test",
      provider: {
        async complete() {
          await Promise.resolve();
          return {
            message: "Wait for clean smoke before adding food.",
            suggestions: [
              {
                kind: "caution",
                title: "Avoid dirty smoke",
                rationale: "Thick white smoke can make food bitter.",
              },
            ],
          };
        },
      },
    });
    const dispatch = createApiDispatcher({ getHealth: health, coachService });

    const response = await dispatch(
      new Request("http://api.test/api/coach", {
        method: "POST",
        body: JSON.stringify({ messages: [{ role: "user", content: "Can I add the food now?" }] }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: {
        message: "Wait for clean smoke before adding food.",
        suggestions: [
          {
            kind: "caution",
            title: "Avoid dirty smoke",
            rationale: "Thick white smoke can make food bitter.",
          },
        ],
      },
    });
  });

  test("maps invalid provider output instead of returning it", async () => {
    const provider = createFakeCoachProvider({ mode: "malformed_output" });
    const coachService = createCoachService({
      contextSource: { findActive: () => undefined },
      model: "gpt-test",
      provider,
    });
    const dispatch = createApiDispatcher({ getHealth: health, coachService });

    const response = await dispatch(
      new Request("http://api.test/api/coach", {
        method: "POST",
        body: JSON.stringify({ messages: [{ role: "user", content: "Help" }] }),
      }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: {
        code: "COACH_PROVIDER_INVALID_RESPONSE",
        message: "Coach provider returned an invalid response",
        issues: [],
      },
    });
  });

  test("returns exact safe rejection and unavailable errors", async () => {
    for (const fixture of [
      {
        mode: "rejected" as const,
        status: 502,
        error: {
          code: "COACH_PROVIDER_REJECTED",
          message: "Coach provider rejected the request",
          issues: [],
        },
      },
      ...(["network", "timeout"] as const).map((mode) => ({
        mode,
        status: 503,
        error: {
          code: "COACH_PROVIDER_UNAVAILABLE",
          message: "Coach provider is unavailable",
          issues: [],
        },
      })),
    ]) {
      const provider = createFakeCoachProvider({ mode: fixture.mode });
      const coachService = createCoachService({
        contextSource: { findActive: () => undefined },
        model: "secret-model-value",
        provider,
      });
      const dispatch = createApiDispatcher({ getHealth: health, coachService });

      const response = await dispatch(
        new Request("http://api.test/api/coach", {
          method: "POST",
          body: JSON.stringify({ messages: [{ role: "user", content: "Help" }] }),
        }),
      );
      const body = await response.json();

      expect(response.status).toBe(fixture.status);
      expect(body).toEqual({ error: fixture.error });
      expect(JSON.stringify(body)).not.toContain("secret-model-value");
      expect(provider.requests).toHaveLength(1);
    }
  });
});
