import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";

const requiredGuardrailScripts = ["scripts/check", "scripts/test", "scripts/build", "scripts/precommit-run"];

describe("verification guardrails", () => {
  test("repository exposes the required guardrail entrypoints", () => {
    for (const script of requiredGuardrailScripts) {
      expect(existsSync(script), `${script} should exist`).toBe(true);
    }
  });
});
