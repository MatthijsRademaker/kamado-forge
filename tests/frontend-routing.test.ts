import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

function readFrontendPackage(): { dependencies: Record<string, string> } {
  try {
    return JSON.parse(readFileSync("frontend/package.json", "utf8")) as {
      dependencies: Record<string, string>;
    };
  } catch (error) {
    throw new Error("Could not read frontend/package.json.", { cause: error });
  }
}

const appSource = readFileSync("frontend/src/App.vue", "utf8");
const mainSource = readFileSync("frontend/src/main.ts", "utf8");
const frontendPackage = readFrontendPackage();

describe("direct showcase application shell", () => {
  test("renders the same showcase at root and its direct path without Vue Router", () => {
    expect(appSource).toContain('window.location.pathname === "/showcase"');
    expect(appSource).toContain('"/"');
    expect(appSource).toContain("KamadoShowcase");
    expect(appSource).not.toContain("RouterView");
    expect(mainSource).not.toContain(".use(router)");
    expect(mainSource).not.toContain('from "./router"');
  });

  test("keeps routing dependencies out of the minimal application shell", () => {
    expect(frontendPackage.dependencies).not.toHaveProperty("vue-router");
  });
});
