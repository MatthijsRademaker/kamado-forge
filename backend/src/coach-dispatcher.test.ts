import { describe, expect, test } from "bun:test";
import { CoachProviderError, type CoachProviderFailureKind } from "./coach-provider";
import { createCoachService } from "./coach-service";
import { createApiDispatcher } from "./dispatcher";

const health = () => ({ ok: true, service: "api", database: { status: "ok" } }) as const;
const coachRequest = (question = "Should I adjust the vents?") =>
  new Request("http://api.test/api/coach", {
    method: "POST",
    body: JSON.stringify({ question }),
  });

describe("coach dispatch", () => {
  test("rejects caller-owned context before reading context or invoking the provider", async () => {
    let contextReads = 0;
    let providerCalls = 0;
    const dispatch = createApiDispatcher({
      getHealth: health,
      coachService: createCoachService({
        contextSource: {
          findActive() {
            contextReads += 1;
            return undefined;
          },
        },
        provider: {
          async complete() {
            providerCalls += 1;
            return {};
          },
        },
      }),
    });

    const response = await dispatch(
      new Request("http://api.test/api/coach", {
        method: "POST",
        body: JSON.stringify({
          question: "Should I wrap?",
          sessionId: "caller-owned",
          context: { kind: "none" },
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        issues: [
          { path: "body.context", code: "unexpected_body_field" },
          { path: "body.sessionId", code: "unexpected_body_field" },
        ],
      },
    });
    expect(contextReads).toBe(0);
    expect(providerCalls).toBe(0);
  });

  test("returns validated structured output with the exact no-active snapshot", async () => {
    const dispatch = createApiDispatcher({
      getHealth: health,
      coachService: createCoachService({
        contextSource: { findActive: () => undefined },
        provider: {
          async complete() {
            return {
              answer: "Build a small clean fire.",
              guidance: ["Light one starter.", "Wait for clean smoke."],
              warnings: ["Do not add food over thick white smoke."],
              suggestedFollowUps: ["What does clean smoke look like?"],
            };
          },
        },
      }),
    });

    const response = await dispatch(coachRequest("How should I light the kamado?"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      data: {
        answer: "Build a small clean fire.",
        guidance: ["Light one starter.", "Wait for clean smoke."],
        warnings: ["Do not add food over thick white smoke."],
        suggestedFollowUps: ["What does clean smoke look like?"],
        contextUsed: { kind: "none" },
      },
    });
  });

  test("maps every declared provider failure to a sanitized public error", async () => {
    const fixtures: Array<{
      kind: CoachProviderFailureKind;
      status: number;
      code: string;
      message: string;
    }> = [
      {
        kind: "disabled",
        status: 503,
        code: "COACH_PROVIDER_DISABLED",
        message: "Coach provider is not configured",
      },
      { kind: "timeout", status: 504, code: "COACH_PROVIDER_TIMEOUT", message: "Coach provider timed out" },
      {
        kind: "unavailable",
        status: 503,
        code: "COACH_PROVIDER_UNAVAILABLE",
        message: "Coach provider is unavailable",
      },
      {
        kind: "rate_limited",
        status: 429,
        code: "COACH_PROVIDER_RATE_LIMITED",
        message: "Coach provider rate limit reached",
      },
      {
        kind: "invalid_output",
        status: 502,
        code: "COACH_PROVIDER_INVALID_OUTPUT",
        message: "Coach provider returned invalid output",
      },
    ];

    for (const fixture of fixtures) {
      const dispatch = createApiDispatcher({
        getHealth: health,
        coachService: createCoachService({
          contextSource: { findActive: () => undefined },
          provider: {
            async complete() {
              const error = new CoachProviderError(fixture.kind);
              error.message = "secret prompt, credential, and provider payload";
              throw error;
            },
          },
        }),
      });

      const response = await dispatch(coachRequest());
      const body = await response.json();

      expect(response.status).toBe(fixture.status);
      expect(body).toEqual({
        error: { code: fixture.code, message: fixture.message, issues: [] },
      });
      expect(JSON.stringify(body)).not.toContain("secret");
    }
  });

  test("maps schema-invalid provider output and leaves unknown failures fail-loud", async () => {
    const invalidOutputDispatch = createApiDispatcher({
      getHealth: health,
      coachService: createCoachService({
        contextSource: { findActive: () => undefined },
        provider: {
          async complete() {
            return { answer: "partial" };
          },
        },
      }),
    });
    const invalidOutputResponse = await invalidOutputDispatch(coachRequest());
    expect(invalidOutputResponse.status).toBe(502);
    expect(await invalidOutputResponse.json()).toMatchObject({
      error: { code: "COACH_PROVIDER_INVALID_OUTPUT", issues: [] },
    });

    const programmingFailure = new Error("programming failure");
    const unknownFailureDispatch = createApiDispatcher({
      getHealth: health,
      coachService: createCoachService({
        contextSource: { findActive: () => undefined },
        provider: {
          async complete() {
            throw programmingFailure;
          },
        },
      }),
    });
    await expect(unknownFailureDispatch(coachRequest())).rejects.toBe(programmingFailure);
  });
});
