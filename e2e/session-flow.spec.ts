import { expect, test } from "@playwright/test";

test("loads every Today fixture and starts a draft in the mounted Live flow", async ({ page }) => {
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/")) apiRequests.push(request.url());
  });

  await page.goto("/?fixture=no-session");
  await expect(page).toHaveURL(/\/today\?fixture=no-session$/);
  await expect(page.getByRole("heading", { level: 2, name: "No cook on the fire" })).toBeVisible();

  await page.goto("/today?fixture=draft");
  await expect(page.getByRole("heading", { level: 2, name: "Reverse-sear steak night" })).toBeVisible();
  await page.getByRole("button", { name: "Start cook" }).click();
  await expect(page).toHaveURL(/\/live\?fixture=active-running$/);
  await expect(page.getByRole("heading", { level: 1, name: "Light a small fire" })).toBeVisible();

  await page.goto("/today?fixture=active-running");
  await expect(page.getByRole("link", { name: "Continue cook" })).toBeVisible();
  await page.goto("/today?fixture=active-paused");
  await expect(page.getByRole("link", { name: "Resume cook" })).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test("operates the Live flow, preserves notes, and confirms terminal actions accessibly", async ({ page }) => {
  await page.goto("/live?fixture=active-running");

  await expect(page.getByRole("heading", { level: 1, name: "Stabilize the dome" })).toBeVisible();
  await expect(page.getByTestId("planned-dome-target")).toContainText("250°F");
  await expect(page.getByTestId("planned-food-target")).toContainText("130°F");
  await expect(page.getByRole("progressbar", { name: "Session progress" })).toHaveAttribute("aria-valuenow", "50");

  const elapsed = page.getByRole("heading", { name: /elapsed/ });
  const runningText = await elapsed.textContent();
  await page.waitForTimeout(1_100);
  await expect(elapsed).not.toHaveText(runningText ?? "");

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  const pausedText = await elapsed.textContent();
  await page.waitForTimeout(1_100);
  await expect(elapsed).toHaveText(pausedText ?? "");

  await page.getByLabel("Session note").fill("Close the top vent a touch.");
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Light a small fire" })).toBeVisible();
  await expect(page.getByLabel("Session note")).toHaveValue("Close the top vent a touch.");
  await expect(page.getByRole("button", { name: "Back" })).toBeDisabled();

  for (let index = 0; index < 3; index += 1) await page.getByRole("button", { name: "Advance" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Sear and rest" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Advance" })).toBeDisabled();

  const cancelTrigger = page.getByRole("button", { name: "Cancel cook" });
  await cancelTrigger.click();
  await expect(page.getByRole("dialog", { name: "Cancel cook?" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(cancelTrigger).toBeFocused();
  await expect(page.getByRole("heading", { level: 1, name: "Sear and rest" })).toBeVisible();

  const finishTrigger = page.getByRole("button", { name: "Finish cook" });
  await finishTrigger.click();
  await page.getByRole("button", { name: "Keep cooking" }).click();
  await expect(finishTrigger).toBeFocused();
  await finishTrigger.click();
  await page.getByRole("button", { name: "Confirm finish" }).click();
  await expect(page).toHaveURL(/\/today\?fixture=no-session$/);
  await expect(page.getByRole("heading", { level: 2, name: "No cook on the fire" })).toBeVisible();
});

test("keeps planned guidance and outdoor controls usable at 320 by 568", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/")) apiRequests.push(request.url());
  });
  await page.goto("/live?fixture=active-paused");
  await page.reload();

  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  for (const testId of ["current-action", "planned-dome-target", "planned-food-target"]) {
    const bounds = await page.getByTestId(testId).boundingBox();
    expect(bounds, `${testId} should have measurable bounds`).not.toBeNull();
    expect((bounds?.y ?? 568) + (bounds?.height ?? 0), `${testId} should fit in the first viewport`).toBeLessThanOrEqual(568);
  }
  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  const controlOverlap = await page.locator(".live-page button:visible").evaluateAll((elements) => {
    const rectangles = elements.map((element) => element.getBoundingClientRect());
    return rectangles.some((left, leftIndex) =>
      rectangles.some(
        (right, rightIndex) =>
          rightIndex > leftIndex &&
          Math.min(left.right, right.right) > Math.max(left.left, right.left) &&
          Math.min(left.bottom, right.bottom) > Math.max(left.top, right.top),
      ),
    );
  });
  expect(controlOverlap).toBe(false);

  const cancelTrigger = page.getByRole("button", { name: "Cancel cook" });
  await cancelTrigger.focus();
  await expect(cancelTrigger).toHaveCSS("outline-style", "solid");
  await cancelTrigger.click();
  const undersized = await page
    .locator(".live-page button:visible, .live-page textarea:visible, [role=dialog] button:visible")
    .evaluateAll((elements) =>
      elements.flatMap((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.width >= 44 && bounds.height >= 44
          ? []
          : [`${element.getAttribute("aria-label") ?? element.textContent?.trim()}: ${Math.round(bounds.width)}x${Math.round(bounds.height)}`];
      }),
    );
  expect(undersized).toEqual([]);

  await page.getByRole("button", { name: "Confirm cancel" }).click();
  await expect(page).toHaveURL(/\/today\?fixture=no-session$/);
  await expect(page.getByRole("heading", { level: 2, name: "No cook on the fire" })).toBeVisible();
  expect(apiRequests).toEqual([]);
});
