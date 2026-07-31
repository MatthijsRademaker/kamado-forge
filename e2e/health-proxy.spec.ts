import { expect, test } from "@playwright/test";

test("proxies relative health requests through frontend", async ({ page }) => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL, "requires an external frontend service");

  await page.goto("/");
  const health = await page.evaluate(async () => {
    const response = await fetch("/api/health");

    return { body: await response.json(), status: response.status };
  });

  expect(health).toEqual({
    body: { data: { ok: true, service: "api", database: { status: "ok" } } },
    status: 200,
  });
});
