import { describe, expect, test } from "bun:test";
import { resolveCoachProviderMode } from "./coach-config";

describe("coach configuration", () => {
  test("selects fake only when explicitly configured", () => {
    expect(resolveCoachProviderMode({ COACH_PROVIDER: "fake" })).toBe("fake");
  });

  test("uses deliberate disabled behavior when missing or selected", () => {
    expect(resolveCoachProviderMode({})).toBe("disabled");
    expect(resolveCoachProviderMode({ COACH_PROVIDER: "disabled" })).toBe("disabled");
  });

  test("fails loudly for unsupported provider values", () => {
    for (const value of ["", "openai", "Fake"]) {
      expect(() => resolveCoachProviderMode({ COACH_PROVIDER: value })).toThrow(`Unsupported COACH_PROVIDER: ${value}`);
    }
  });
});
