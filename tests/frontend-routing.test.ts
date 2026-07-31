import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { routeRecords } from "../frontend/src/router/routes";

const routerSource = readFileSync("frontend/src/router/index.ts", "utf8");

describe("frontend application routes", () => {
  test("keeps the scaffold at the named root route", () => {
    const rootRoute = routeRecords.find((route) => route.name === "home");

    expect(rootRoute).toMatchObject({
      name: "home",
      path: "/",
    });
    expect(rootRoute?.component).toEqual(expect.any(Function));
  });

  test("exposes the internal showcase route with a clear intent", () => {
    const showcaseRoute = routeRecords.find((route) => route.name === "showcase");

    expect(showcaseRoute).toMatchObject({
      name: "showcase",
      path: "/showcase",
      meta: {
        internal: true,
      },
    });
    expect(showcaseRoute?.component).toEqual(expect.any(Function));
    expect(showcaseRoute?.meta?.surface).toBe("design-system-showcase");
  });

  test("uses history mode with the Vite base URL", () => {
    expect(routerSource).toContain("createRouter");
    expect(routerSource).toContain("createWebHistory(import.meta.env.BASE_URL)");
  });
});
