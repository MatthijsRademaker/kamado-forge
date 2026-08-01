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
const routerSource = readFileSync("frontend/src/router.ts", "utf8");
const frontendPackage = readFrontendPackage();

describe("Vue Router application shell", () => {
  test("renders router-owned layouts from history-mode named routes", () => {
    expect(appSource).toContain("RouterView");
    expect(appSource).not.toContain("window.location.pathname");
    expect(mainSource).toContain(".use(router)");
    expect(mainSource).toContain('from "./router"');
    expect(routerSource).toContain("createWebHistory()");

    for (const routeName of ["today", "live", "plan", "coach", "learn", "logbook", "showcase"]) {
      expect(routerSource).toContain(`name: "${routeName}"`);
    }

    expect(routerSource).toContain('{ path: "/", redirect: { name: "today" } }');
    expect(routerSource).not.toContain("pathMatch");
  });

  test("declares Vue Router as a frontend runtime dependency", () => {
    expect(frontendPackage.dependencies).toHaveProperty("vue-router");
  });
});
