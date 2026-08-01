import { describe, expect, test } from "bun:test";
import { createPlaywrightConfig } from "../../playwright.config";

describe("Playwright local service targets", () => {
  test("runs local browser coverage against Vite development and built preview", () => {
    const local = createPlaywrightConfig({});
    const external = createPlaywrightConfig({ PLAYWRIGHT_BASE_URL: "http://frontend:5173" });

    expect([local.projects?.[0]?.name, local.projects?.[1]?.name]).toEqual(["vite-development", "vite-preview"]);
    expect([local.projects?.[0]?.use?.baseURL, local.projects?.[1]?.use?.baseURL]).toEqual([
      "http://127.0.0.1:4173",
      "http://127.0.0.1:4174",
    ]);
    expect(Array.isArray(local.webServer)).toBe(true);
    expect(local.webServer).toHaveLength(2);
    expect(external.use?.baseURL).toBe("http://frontend:5173");
    expect(external.projects).toBeUndefined();
    expect(external.webServer).toBeUndefined();
  });
});
