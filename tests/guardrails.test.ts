import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

const requiredGuardrailScripts = ["scripts/check", "scripts/test", "scripts/build", "scripts/precommit-run"];

describe("verification guardrails", () => {
  test("repository exposes the required guardrail entrypoints", () => {
    for (const script of requiredGuardrailScripts) {
      expect(existsSync(script), `${script} should exist`).toBe(true);
    }
  });

  test("writes Playwright results outside the mounted worktree", () => {
    const config = readFileSync("playwright.config.ts", "utf8");

    expect(config).toContain('outputDir: "/tmp/playwright-test-results"');
  });
});
