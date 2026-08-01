import { expect, test } from "@playwright/test";

const productRoutes = [
  { heading: "Today", path: "/today" },
  { heading: "Reverse-sear steak night", path: "/plan" },
  { heading: "Coach", path: "/coach" },
  { heading: "Learn", path: "/learn" },
  { heading: "Logbook", path: "/logbook" },
] as const;

const navigationNames = ["Today", "Plan", "Coach", "Learn", "Logbook"];

test("replaces the root route with the canonical Today destination", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();
});

for (const { heading, path } of productRoutes) {
  test(`loads and refreshes ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  });
}

test("loads and refreshes the standalone showcase", async ({ page }) => {
  await page.goto("/showcase");
  await expect(page.getByRole("heading", { level: 1, name: "HEAT WITH INTENT" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "HEAT WITH INTENT" })).toBeVisible();
});

test("exposes the exact product vocabulary and one non-color current marker", async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 1280 });
  await page.goto("/coach");

  const navigation = page.getByRole("navigation", { name: "Primary" });
  await expect(navigation.getByRole("link")).toHaveText(navigationNames);
  await expect(navigation.getByRole("link", { name: "Showcase" })).toHaveCount(0);

  const currentDestination = navigation.locator('a[aria-current="page"]');
  await expect(currentDestination).toHaveCount(1);
  await expect(currentDestination).toHaveAccessibleName("Coach");

  const currentMarker = currentDestination.locator("[data-current-marker]");
  await expect(currentMarker).toBeVisible();
  expect((await currentMarker.boundingBox())?.width).toBeGreaterThan(0);
});

test("keeps active-cook continuation prominent throughout product chrome", async ({ page }) => {
  await page.goto("/logbook");

  const continuation = page.getByRole("link", { name: "Continue active cook" });
  await expect(continuation).toBeVisible();
  await continuation.click();
  await expect(page).toHaveURL(/\/today$/);
});

test("preserves the active-cook continuation label at the narrowest width", async ({ page }) => {
  await page.setViewportSize({ height: 720, width: 320 });
  await page.goto("/logbook");

  await expect(page.getByRole("link", { name: "Continue active cook", exact: true })).toBeVisible();
});

test("keeps the showcase outside product chrome", async ({ page }) => {
  await page.goto("/showcase");

  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open product menu" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Continue active cook" })).toHaveCount(0);
});

test("moves focus from the first-focus skip link to the current main region", async ({ page }) => {
  await page.goto("/learn");

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS("outline-style", "solid");

  await page.keyboard.press("Enter");
  await expect(page.getByRole("main", { name: "Learn" })).toBeFocused();
});

test("operates the mobile Sheet by keyboard and restores trigger focus on Escape", async ({ page }) => {
  await page.setViewportSize({ height: 720, width: 320 });
  await page.goto("/plan");

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const trigger = page.getByRole("button", { name: "Open product menu" });
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveCSS("outline-style", "solid");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toHaveAttribute("aria-controls", "product-menu");

  await page.keyboard.press("Enter");
  await expect(page.locator('button[aria-label="Open product menu"]')).toHaveAttribute("aria-expanded", "true");
  const menu = page.getByRole("dialog", { name: "Product menu" });
  await expect(menu).toBeVisible();
  const menuLinks = menu.getByRole("navigation", { name: "Primary" }).getByRole("link");
  await expect(menuLinks).toHaveText(navigationNames);
  await expect(menuLinks.first()).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(menuLinks.nth(1)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("closes the mobile Sheet when a route is selected", async ({ page }) => {
  await page.setViewportSize({ height: 720, width: 320 });
  await page.goto("/today");

  const trigger = page.getByRole("button", { name: "Open product menu" });
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Product menu" });
  await menu.getByRole("link", { name: "Logbook" }).click();

  await expect(page).toHaveURL(/\/logbook$/);
  await expect(menu).toBeHidden();
});

test("dismisses the mobile Sheet when the viewport crosses into the desktop layout", async ({ page }) => {
  await page.setViewportSize({ height: 720, width: 320 });
  await page.goto("/today");

  await page.getByRole("button", { name: "Open product menu" }).click();
  const menu = page.getByRole("dialog", { name: "Product menu" });
  await expect(menu).toBeVisible();

  await page.setViewportSize({ height: 720, width: 1024 });
  await expect(menu).toBeHidden();
  await expect(page.getByTestId("desktop-navigation")).toBeVisible();
});

for (const width of [320, 1023, 1024, 1280]) {
  test(`replaces responsive navigation without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ height: 720, width });
    await page.goto("/today");

    const desktopNavigation = page.getByTestId("desktop-navigation");
    const menuTrigger = page.getByRole("button", { name: "Open product menu" });

    if (width >= 1024) {
      await expect(desktopNavigation).toBeVisible();
      await expect(menuTrigger).toBeHidden();
    } else {
      await expect(desktopNavigation).toBeHidden();
      await expect(menuTrigger).toBeVisible();
      await expect(page.getByRole("dialog", { name: "Product menu" })).toHaveCount(0);
    }

    expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  });
}
