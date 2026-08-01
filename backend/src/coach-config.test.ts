import { describe, expect, test } from "bun:test";
import { CoachConfigurationError, resolveCoachConfiguration } from "./coach-config";

describe("coach configuration", () => {
  test("requires the exact server-only provider, model, and credential variables", () => {
    expect(
      resolveCoachConfiguration({
        COACH_PROVIDER: "openai",
        COACH_MODEL: "gpt-4.1-mini",
        OPENAI_API_KEY: "server-secret",
      }),
    ).toEqual({
      provider: "openai",
      model: "gpt-4.1-mini",
      apiKey: "server-secret",
    });
  });

  test("rejects missing, blank, or unsupported configuration without defaults", () => {
    const invalid = [
      {},
      { COACH_PROVIDER: "anthropic", COACH_MODEL: "model", OPENAI_API_KEY: "key" },
      { COACH_PROVIDER: "openai", COACH_MODEL: " ", OPENAI_API_KEY: "key" },
      { COACH_PROVIDER: "openai", COACH_MODEL: "model", OPENAI_API_KEY: " " },
    ];

    for (const environment of invalid) {
      expect(() => resolveCoachConfiguration(environment)).toThrow(CoachConfigurationError);
    }
  });
});
