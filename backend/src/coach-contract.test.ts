import { describe, expect, test } from "bun:test";
import {
  coachContextSchema,
  coachProviderOutputSchema,
  coachRequestSchema,
  coachRoute,
  coachSuccessSchema,
} from "./coach-contract";
import { API_ERRORS } from "./contract";

const activeContext = {
  kind: "active",
  sessionId: "9fb8babc-a028-43ae-93dd-131c129ca61f",
  sessionTitle: "Brisket practice",
  sessionStatus: "ACTIVE",
  phaseTitle: "Build the bark",
  stepOrdinal: 2,
  stepTitle: "Hold clean smoke",
  projectedAt: "2026-09-12T10:00:00.000Z",
} as const;

describe("coach contract", () => {
  test("accepts only one trimmed nonblank question", () => {
    expect(coachRequestSchema.parse({ question: "  Should I open the top vent?  " })).toEqual({
      question: "Should I open the top vent?",
    });

    for (const request of [
      {},
      { question: "" },
      { question: "   " },
      { question: "x".repeat(2_001) },
      { question: "Should I wrap?", sessionId: activeContext.sessionId },
      { question: "Should I wrap?", phaseTitle: activeContext.phaseTitle },
    ]) {
      expect(coachRequestSchema.safeParse(request).success).toBe(false);
    }
  });

  test("pins the discriminated context allowlist", () => {
    expect(coachContextSchema.parse({ kind: "none" })).toEqual({ kind: "none" });
    expect(coachContextSchema.parse(activeContext)).toEqual(activeContext);
    expect(
      coachContextSchema.parse({
        ...activeContext,
        sessionTitle: "  Brisket practice  ",
        phaseTitle: "  Build the bark  ",
        stepTitle: "  Hold clean smoke  ",
      }),
    ).toMatchObject({
      sessionTitle: "  Brisket practice  ",
      phaseTitle: "  Build the bark  ",
      stepTitle: "  Hold clean smoke  ",
    });

    for (const context of [
      {},
      { kind: "none", sessionId: activeContext.sessionId },
      { ...activeContext, notes: ["private note"] },
      { ...activeContext, instructions: "Provider-private detail" },
      { ...activeContext, sessionStatus: "COMPLETED" },
    ]) {
      expect(coachContextSchema.safeParse(context).success).toBe(false);
    }
  });

  test("pins structured provider output and public success", () => {
    const output = {
      answer: "Hold the current vent setting until the dome stabilizes.",
      guidance: ["Wait ten minutes.", "Change only one vent at a time."],
      warnings: ["Do not chase short thermometer swings."],
      suggestedFollowUps: ["How do I recognize clean smoke?"],
    };

    expect(coachProviderOutputSchema.parse(output)).toEqual(output);
    expect(coachSuccessSchema.parse({ data: { ...output, contextUsed: activeContext } })).toEqual({
      data: { ...output, contextUsed: activeContext },
    });
    expect(coachProviderOutputSchema.safeParse({ ...output, warnings: undefined }).success).toBe(false);
    expect(coachSuccessSchema.safeParse({ data: { ...output, contextUsed: null } }).success).toBe(false);
  });

  test("declares every sanitized provider failure mapping", () => {
    expect(coachRoute).toMatchObject({
      method: "POST",
      runtimePath: "/api/coach",
      openApiPath: "/coach",
      operationId: "askCoach",
    });
    expect(Object.keys(coachRoute.responses)).toEqual(["200", "400", "405", "429", "502", "503", "504"]);
    expect(API_ERRORS).toMatchObject({
      coachProviderDisabled: {
        code: "COACH_PROVIDER_DISABLED",
        message: "Coach provider is not configured",
      },
      coachProviderTimeout: {
        code: "COACH_PROVIDER_TIMEOUT",
        message: "Coach provider timed out",
      },
      coachProviderUnavailable: {
        code: "COACH_PROVIDER_UNAVAILABLE",
        message: "Coach provider is unavailable",
      },
      coachProviderRateLimited: {
        code: "COACH_PROVIDER_RATE_LIMITED",
        message: "Coach provider rate limit reached",
      },
      coachProviderInvalidOutput: {
        code: "COACH_PROVIDER_INVALID_OUTPUT",
        message: "Coach provider returned invalid output",
      },
    });
  });
});
