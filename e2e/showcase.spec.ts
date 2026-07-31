import { expect, test } from "@playwright/test";

test("normalizes temperature readings within configured bounds", async ({ page }) => {
  await page.goto("/showcase");

  const gauge = page.getByRole("progressbar", {
    name: "Illustrative grate reading",
  });

  await expect(gauge).toHaveAttribute("aria-valuemin", "200");
  await expect(gauge).toHaveAttribute("aria-valuemax", "700");
  await expect(gauge).toHaveAttribute("aria-valuenow", "425");

  const fillRatio = await gauge
    .locator('[data-slot="temperature-gauge-indicator"]')
    .evaluate((indicator) => {
      const gaugeWidth = indicator.parentElement?.getBoundingClientRect().width ?? 0;

      return indicator.getBoundingClientRect().width / gaugeWidth;
    });

  expect(fillRatio).toBeCloseTo(0.45, 2);
});

test("normalizes generic progress against its configured maximum", async ({ page }) => {
  await page.goto("/showcase");

  const progress = page.getByRole("progressbar", {
    name: "Illustrative bounded progress",
  });

  await expect(progress).toHaveAttribute("aria-valuemax", "200");
  await expect(progress).toHaveAttribute("aria-valuenow", "75");

  const fillRatio = await progress
    .locator('[data-slot="progress-indicator"]')
    .evaluate((indicator) => {
      const progressWidth = indicator.parentElement?.getBoundingClientRect().width ?? 0;
      const indicatorBounds = indicator.getBoundingClientRect();
      const progressBounds = indicator.parentElement?.getBoundingClientRect();

      return Math.max(0, Math.min(indicatorBounds.right, progressBounds?.right ?? 0) - Math.max(indicatorBounds.left, progressBounds?.left ?? 0)) / progressWidth;
    });

  expect(fillRatio).toBeCloseTo(0.375, 2);
});

test("renders primitive borders with the restrained semantic token", async ({ page }) => {
  await page.goto("/showcase");

  const card = page.locator('[data-slot="card"]').first();

  await expect(card).toHaveCSS("border-top-color", "rgb(62, 62, 62)");
});

test("demonstrates every public button size, sheet side, and status", async ({ page }) => {
  await page.goto("/showcase");

  for (const name of [
    "Extra small",
    "Small",
    "Large",
    "Extra-small icon button",
    "Small icon button",
    "Large icon button",
    "Open top sheet",
    "Open right sheet",
    "Open bottom sheet",
    "Open left sheet",
  ]) {
    await expect(page.getByRole("button", { exact: true, name })).toBeVisible();
  }

  await expect(page.getByText("Idle", { exact: true })).toBeVisible();
});

test("serves the showcase directly at its explicit path", async ({ page }) => {
  await page.goto("/showcase");
  await expect(page.getByRole("heading", { level: 1, name: "HEAT WITH INTENT" })).toBeVisible();
});

test("keeps focus visible and supports keyboard tab navigation", async ({ page }) => {
  await page.goto("/showcase");

  const embers = page.getByRole("tab", { name: "Embers" });
  await embers.focus();
  await expect(embers).toHaveCSS("outline-style", "solid");

  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Smoke" })).toHaveAttribute("aria-selected", "true");
});

test("preserves label, description, and invalid-state relationships", async ({ page }) => {
  await page.goto("/showcase");

  const pitName = page.getByLabel("Reference label");
  await expect(pitName).toHaveAttribute("aria-describedby", "showcase-pit-name-help");

  const note = page.getByLabel("Invalid-state example");
  await expect(note).toHaveAttribute("aria-describedby", "showcase-note-help");
  await expect(note).toHaveAttribute("aria-invalid", "true");
});

test("closes named overlays with Escape and restores focus to their triggers", async ({ page }) => {
  await page.goto("/showcase");

  for (const [triggerName, dialogName] of [
    ["Open named dialog", "Illustrative dialog"],
    ["Open right sheet", "Illustrative sheet"],
  ]) {
    const trigger = page.getByRole("button", { exact: true, name: triggerName });
    await trigger.click();
    await expect(page.getByRole("dialog", { name: dialogName })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: dialogName })).toBeHidden();
    await expect(trigger).toBeFocused();
  }
});

test("avoids horizontal overflow at the narrow supported width", async ({ page }) => {
  await page.setViewportSize({ height: 720, width: 320 });
  await page.goto("/showcase");

  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});
