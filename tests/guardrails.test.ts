import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";

const requiredGuardrailScripts = ["scripts/check", "scripts/test", "scripts/build", "scripts/precommit-run"];

describe("verification guardrails", () => {
  test("repository exposes the required guardrail entrypoints", () => {
    for (const script of requiredGuardrailScripts) {
      expect(existsSync(script), `${script} should exist`).toBe(true);
    }
  });

  test("normal checks enforce generated API drift", () => {
    const packageManifest = readPackageManifest();
    const checkScript = readFileSync("scripts/check", "utf8");

    expect(packageManifest.scripts["generate:api"]).toBeDefined();
    expect(packageManifest.scripts["check:api"]).toBeDefined();
    expect(checkScript).toContain("bun run check:api");
  });

  test("normal tests include frontend integration coverage", () => {
    const packageManifest = readPackageManifest();

    expect(packageManifest.scripts.test).toContain("frontend/src");
  });
});

function readPackageManifest(): { scripts: Record<string, string> } {
  try {
    return JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
  } catch (error) {
    throw new Error("package.json must contain valid JSON", { cause: error });
  }
}
