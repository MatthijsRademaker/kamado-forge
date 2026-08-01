import { expect, test, type Page } from "@playwright/test";

async function expectPlanTouchTargets(page: Page) {
  const undersized = await page
    .locator(".plan-page a, .plan-page button, .plan-page input, .plan-page textarea, .plan-page summary")
    .evaluateAll((elements) =>
      elements.flatMap((element) => {
        const bounds = element.getBoundingClientRect();
        if (bounds.width === 0 || bounds.height === 0 || (bounds.width >= 44 && bounds.height >= 44)) return [];
        const name = element.getAttribute("aria-label") ?? element.id ?? element.textContent?.trim() ?? "unnamed";
        return [`${element.tagName.toLowerCase()} ${name}: ${Math.round(bounds.width)}x${Math.round(bounds.height)}`];
      }),
    );

  expect(undersized).toEqual([]);
}

test("serves Plan directly with its ordered current navigation", async ({ page }) => {
  await page.goto("/plan?fixture=complete");

  await expect(page.getByRole("heading", { level: 1, name: "Reverse-sear steak night" })).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Primary" });
  await expect(navigation.getByRole("link").allTextContents()).resolves.toEqual([
    "Today",
    "Plan",
    "Coach",
    "Learn",
    "Logbook",
  ]);
  await expect(navigation.getByRole("link", { name: "Plan" })).toHaveAttribute("aria-current", "page");

  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Reverse-sear steak night" })).toBeVisible();
});

test("edits the local draft and derives timing from nested array order", async ({ page }) => {
  await page.goto("/plan?fixture=complete");

  await page.getByLabel("Plan title").fill("Sunday reverse sear");
  await expect(page.getByRole("heading", { level: 1, name: "Sunday reverse sear" })).toBeVisible();
  await expect(page.getByText("1 hr 47 min total", { exact: true }).last()).toBeVisible();

  const phases = page.locator("[data-phase-id]");
  await expect(phases).toHaveCount(2);
  await page.getByRole("button", { name: "Move Roast and sear up" }).click();
  await expect(phases.first()).toHaveAttribute("data-phase-id", "phase-roast");
  await expect(page.getByText("Starts at 0 min", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Add phase" }).click();
  await expect(phases).toHaveCount(3);
  await expect(page.getByLabel("Phase 3 title")).toBeVisible();
});

test("relates readiness errors, focuses the first invalid field, and completes only a valid local plan", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/plan?fixture=incomplete");

  const foodTarget = page.getByLabel("Planned food target");
  await expect(foodTarget).toHaveAttribute("aria-invalid", "true");
  const describedBy = await foodTarget.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await expect(page.locator(`#${describedBy}`)).toContainText("Planned food target must be");

  const requirements = page.getByRole("list", { name: "Plan requirements" });
  await expect(requirements).toContainText("Phase 1 identity must be unique.");

  await page.getByRole("button", { name: "Complete plan" }).click();
  await expect(requirements).toBeFocused();
  expect(pageErrors).toEqual([]);

  await page.getByRole("button", { name: "Remove Roast chicken" }).click();
  await page.getByRole("button", { name: "Complete plan" }).click();
  await expect(page.getByLabel("Cooking date")).toBeFocused();

  await page.goto("/plan?fixture=complete");
  await page.getByRole("button", { name: "Complete plan" }).click();
  await expect(page.getByLabel("Plan complete: In memory only")).toBeVisible();

  await page.getByRole("button", { name: "Reset local draft" }).click();
  await expect(page.getByLabel("Ready locally: No save performed")).toBeVisible();
  await expect(page.getByLabel("Plan complete: In memory only")).toHaveCount(0);
});

test("opens collapsed details before focusing the first invalid field", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/plan?fixture=complete");

  const technique = page.getByLabel("Phase 1 technique");
  await technique.fill("");
  const timeline = page.locator("details").filter({ has: page.getByText("Timeline", { exact: true }) });
  await timeline.locator("summary").click();
  await expect(timeline).not.toHaveAttribute("open", "");

  await page.getByRole("button", { name: "Complete plan" }).click();
  await expect(timeline).toHaveAttribute("open", "");
  await expect(technique).toBeFocused();
});

test("prioritizes planned targets and readiness without overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/plan?fixture=complete");

  await expect(page.getByText("Planning values only — not probe readings or live telemetry.")).toBeVisible();
  await expect(page.getByLabel("Planned dome target")).toHaveValue("250");
  await expect(page.getByLabel("Planned food target")).toHaveValue("130");

  const readinessTop = await page.getByRole("heading", { name: "Ready when you are" }).evaluate((element) => element.getBoundingClientRect().top);
  const targetsTop = await page.getByRole("heading", { name: "Planned temperatures" }).evaluate((element) => element.getBoundingClientRect().top);
  const timelineTop = await page.locator("summary").filter({ hasText: "Timeline" }).evaluate((element) => element.getBoundingClientRect().top);
  expect(readinessTop).toBeLessThan(timelineTop);
  expect(targetsTop).toBeLessThan(timelineTop);

  await expectPlanTouchTargets(page);

  const timelineSummary = page.locator("summary").filter({ hasText: "Timeline" });
  await timelineSummary.focus();
  await expect(timelineSummary).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(timelineSummary.locator("xpath=..")).not.toHaveAttribute("open", "");

  const navigation = page.getByRole("navigation", { name: "Primary" });
  await expect(navigation).toHaveCSS("position", "fixed");
  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  for (const fixture of ["loading", "error", "empty"]) {
    await page.goto(`/plan?fixture=${fixture}`);
    await expectPlanTouchTargets(page);
  }
});

test("operates nested add, remove, and reorder controls by keyboard with safe boundaries", async ({ page }) => {
  await page.goto("/plan?fixture=complete");

  await expect(page.getByRole("button", { name: "Move Build the fire up" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Move Roast and sear down" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Move Light a small fire up" })).toBeDisabled();

  const roastPhase = page.locator('[data-phase-id="phase-roast"]');
  const roastSteps = roastPhase.locator("[data-step-id]");
  await expect(roastPhase.locator('[data-step-id="step-sear"]')).toContainText("Starts at 95 min");
  await page.getByRole("button", { name: "Move Sear and rest up" }).focus();
  await page.keyboard.press("Enter");
  await expect(roastSteps.first()).toHaveAttribute("data-step-id", "step-sear");
  await expect(roastSteps.first()).toContainText("Starts at 45 min");
  await expect(roastSteps.last()).toContainText("Starts at 57 min");

  const addStep = page.getByRole("button", { name: "Add step to phase 1" });
  await addStep.focus();
  await page.keyboard.press("Enter");
  const fireSteps = page.locator('[data-phase-id="phase-fire"] [data-step-id]');
  await expect(fireSteps).toHaveCount(3);
  await page.getByRole("button", { name: "Remove step 3" }).click();
  await expect(fireSteps).toHaveCount(2);

  await page.getByRole("button", { name: "Remove Roast and sear" }).click();
  await expect(page.locator("[data-phase-id]")).toHaveCount(1);
});

test("associates an empty phase error with its add-step control", async ({ page }) => {
  await page.goto("/plan?fixture=complete");

  await page.getByRole("button", { name: "Remove Light a small fire" }).click();
  await page.getByRole("button", { name: "Remove Stabilize the dome" }).click();

  const addStep = page.getByRole("button", { name: "Add step to phase 1" });
  await expect(addStep).toHaveAttribute("aria-invalid", "true");
  const describedBy = await addStep.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await expect(page.locator(`#${describedBy}`)).toHaveText("Add at least one step to phase 1.");
});

test("associates the missing-phase error with its add-phase control", async ({ page }) => {
  await page.goto("/plan?fixture=empty");
  await page.getByRole("button", { name: "Create local draft" }).click();

  const addPhase = page.getByRole("button", { name: "Add phase" });
  await expect(addPhase).toHaveAttribute("aria-invalid", "true");
  const describedBy = await addPhase.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await expect(page.locator(`#${describedBy}`)).toHaveText("Add at least one phase.");
});

test("renders every fixture and keeps create, retry, return, reset, and refresh local", async ({ page }) => {
  const apiRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/")) apiRequests.push(request.url());
  });

  await page.goto("/plan?fixture=loading");
  await expect(page.getByText("Preparing local plan")).toBeVisible();
  await page.getByRole("button", { name: "Return to complete fixture" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Reverse-sear steak night" })).toBeVisible();

  await page.goto("/plan?fixture=error");
  await expect(page.getByRole("alert")).toContainText("Local fixture unavailable");
  await page.getByRole("button", { name: "Retry locally" }).click();
  await expect(page.getByLabel("Plan title")).toHaveValue("Reverse-sear steak night");

  await page.goto("/plan?fixture=incomplete");
  await expect(page.getByRole("heading", { name: "Plan needs attention" })).toBeVisible();

  await page.goto("/plan?fixture=empty");
  await expect(page.getByText("Build a local plan")).toBeVisible();
  await page.getByRole("button", { name: "Create local draft" }).click();
  await page.getByLabel("Plan title").fill("Local supper");
  await expect(page.getByRole("heading", { level: 1, name: "Local supper" })).toBeVisible();
  await page.getByRole("button", { name: "Reset local draft" }).click();
  await expect(page.getByText("Build a local plan")).toBeVisible();

  await page.goto("/plan?fixture=complete");
  await page.getByLabel("Plan title").fill("Disposable edit");
  await page.reload();
  await expect(page.getByLabel("Plan title")).toHaveValue("Reverse-sear steak night");
  expect(apiRequests).toEqual([]);
});

test("preserves direct root and showcase behavior", async ({ page }) => {
  for (const path of ["/", "/showcase"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: "HEAT WITH INTENT" })).toBeVisible();
  }
});
