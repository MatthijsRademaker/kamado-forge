import { describe, expect, test } from "bun:test";
import { createPlaywrightConfig } from "../../playwright.config";

describe("Playwright service target", () => {
  test("starts local Vite only without an external frontend URL", () => {
    const local = createPlaywrightConfig({});
    const external = createPlaywrightConfig({ PLAYWRIGHT_BASE_URL: "http://frontend:5173" });

    expect(local.use?.baseURL).toBe("http://127.0.0.1:4173");
    expect(local.webServer).toBeDefined();
    expect(external.use?.baseURL).toBe("http://frontend:5173");
    expect(external.webServer).toBeUndefined();
  });
});
