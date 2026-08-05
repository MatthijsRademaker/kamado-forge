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

test("inherits atmosphere budgets and keeps effect controls interactive", async ({ page }) => {
  await page.goto("/showcase");

  for (const level of ["flat", "low", "mid", "high"]) {
    await expect(page.locator(`[data-atmosphere="${level}"]`).first()).toBeVisible();
  }

  const inheritedGrain = await page.getByTestId("atmosphere-mid-inherited").evaluate((element) =>
    getComputedStyle(element).getPropertyValue("--atmosphere-grain-opacity").trim(),
  );
  expect(Number(inheritedGrain)).toBe(0.12);

  const failFlatValues = await page.evaluate(() => {
    const high = document.querySelector('[data-atmosphere="high"]');
    if (!high) throw new Error("High atmosphere specimen not found.");

    const invalid = document.createElement("div");
    invalid.dataset.atmosphere = "extreme";
    high.append(invalid);

    const undeclared = document.createElement("div");
    document.body.append(undeclared);

    const read = (element: Element) => ({
      glow: getComputedStyle(element).getPropertyValue("--atmosphere-glow-alpha").trim(),
      grain: getComputedStyle(element).getPropertyValue("--atmosphere-grain-opacity").trim(),
      radius: getComputedStyle(element).getPropertyValue("--atmosphere-glow-radius").trim(),
    });

    return { invalid: read(invalid), undeclared: read(undeclared) };
  });

  expect(failFlatValues.invalid).toEqual({ glow: "0", grain: "0", radius: "0px" });
  expect(failFlatValues.undeclared).toEqual({ glow: "0", grain: "0", radius: "0px" });

  const control = page.getByRole("button", { name: "Test effect control" });
  await control.focus();
  await expect(control).toHaveCSS("outline-style", "solid");

  const highSurface = control.locator("xpath=ancestor::*[contains(@class, 'atmosphere-effects')]");
  expect(await highSurface.evaluate((element) => getComputedStyle(element, "::after").pointerEvents)).toBe("none");
  expect(await highSurface.evaluate((element) => getComputedStyle(element, "::after").zIndex)).toBe("0");
  expect(await control.locator("xpath=ancestor::*[contains(@class, 'atmosphere-content')]").evaluate((element) => getComputedStyle(element).zIndex)).toBe("1");

  await control.click();
  await expect(page.getByRole("button", { name: "Interaction received" })).toBeVisible();
});

test("keeps high-atmosphere reading contrast above WCAG AA on char, ash, and stone", async ({ page }) => {
  await page.goto("/showcase");

  const measurements = await page.evaluate(() => {
    const relativeLuminance = (rgb: string): number => {
      const channels = rgb.match(/[\d.]+/g)?.slice(0, 3).map(Number);
      if (!channels || channels.length !== 3) throw new Error(`Could not parse color: ${rgb}`);

      const [red, green, blue] = channels.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });

      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };

    const ratio = (foreground: string, background: string): number => {
      const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
      const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
      return (lighter + 0.05) / (darker + 0.05);
    };

    return ["char", "ash", "stone"].map((surfaceToken) => {
      const surface = document.createElement("article");
      surface.dataset.atmosphere = "high";
      surface.className = "atmosphere-effects";
      surface.style.backgroundColor = `var(--color-${surfaceToken})`;

      const content = document.createElement("p");
      content.className = "atmosphere-content";
      content.style.color = "var(--color-text)";
      content.textContent = `${surfaceToken} contrast sample`;
      surface.append(content);
      document.body.append(surface);

      const foreground = getComputedStyle(content).color;
      const background = getComputedStyle(surface).backgroundColor;
      const result = {
        ratio: ratio(foreground, background),
        surface: surfaceToken,
        effectZIndex: getComputedStyle(surface, "::after").zIndex,
        contentZIndex: getComputedStyle(content).zIndex,
      };
      surface.remove();
      return result;
    });
  });

  for (const measurement of measurements) {
    expect(measurement.ratio, `${measurement.surface} contrast`).toBeGreaterThanOrEqual(4.5);
    expect(measurement.effectZIndex).toBe("0");
    expect(measurement.contentZIndex).toBe("1");
  }
});

test("keeps every focusable textured specimen keyboard focusable", async ({ page }) => {
  await page.goto("/showcase");

  const surfaces = page.locator('.atmosphere-effects[tabindex="0"]');
  await expect(surfaces).toHaveCount(4);

  for (let index = 0; index < (await surfaces.count()); index += 1) {
    const surface = surfaces.nth(index);
    await surface.focus();
    await expect(surface).toBeFocused();
    await expect(surface).toHaveCSS("outline-style", "solid");
    await expect(surface).toHaveCSS("outline-offset", "4px");
  }
});

test("serves the showcase directly at its explicit path", async ({ page }) => {
  await page.goto("/showcase");
  await expect(page.getByRole("heading", { level: 1, name: "HEAT WITH INTENT" })).toBeVisible();
});

test("keeps offset focus visible on every retuned control and supports keyboard tab navigation", async ({ page }) => {
  await page.goto("/showcase");

  const controls = page.locator('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [role="tab"]');
  for (let index = 0; index < (await controls.count()); index += 1) {
    const control = controls.nth(index);
    await control.focus();
    await expect(control).toHaveCSS("outline-style", "solid");
    await expect(control).toHaveCSS("outline-offset", "4px");
  }

  const embers = page.getByRole("tab", { name: "Embers" });
  await embers.focus();
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
