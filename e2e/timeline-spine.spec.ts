import { expect, test, type APIRequestContext, type Locator } from "@playwright/test";

// These checks activate cooks against the shared e2e backend, and an activated
// plan cannot be deleted. The file name keeps them after `session-flow`, which
// starts from an empty plan list.

const plan = {
  cookingDate: "2026-08-12",
  plannedDomeRange: { minF: 225, maxF: 275 },
  plannedFoodTargetF: 130,
  setupGuidance: "Set up two heat zones.",
  deflectorGuidance: "Install the half-moon deflector.",
  heatZoneGuidance: "Keep the right side direct.",
  ventGuidance: "Bottom vent one finger, top vent quarter open.",
  prepNotes: "Dry brine overnight.",
  phases: [
    {
      title: "Fire",
      technique: "Two-zone indirect",
      transitionGuidance: "Wait for clean smoke.",
      steps: [
        {
          title: "Stabilize a clean fire",
          instructions: "Settle the dome and make only small vent changes.",
          durationMinutes: 20,
        },
        { title: "Cook over the clean fire", instructions: "Keep the food over indirect heat.", durationMinutes: 30 },
      ],
    },
    {
      title: "Sear",
      technique: "Direct grilling",
      transitionGuidance: "Pull the deflector before searing.",
      steps: [{ title: "Sear and rest", instructions: "Sear both sides, then rest.", durationMinutes: 10 }],
    },
  ],
};

async function startCook(request: APIRequestContext, title: string): Promise<string> {
  const created = await request.post("/api/sessions", { data: { ...plan, title } });
  expect(created.status()).toBe(201);
  const { data } = (await created.json()) as { data: { id: string } };
  const activation = await request.post(`/api/sessions/${data.id}/activate`, { data: {} });
  expect(activation.status()).toBe(200);
  return data.id;
}

// One active cook exists at a time, so a failing check must not stop the next
// one from activating.
test.afterEach(async ({ request }) => {
  const active = await request.get("/api/live-sessions/active");
  if (active.status() !== 200) return;
  const { data } = (await active.json()) as { data: { id: string } };
  const cancelled = await request.post(`/api/live-sessions/${data.id}/cancel`, { data: {} });
  expect(cancelled.status()).toBe(200);
});

async function command(request: APIRequestContext, sessionId: string, action: string): Promise<void> {
  const response = await request.post(`/api/live-sessions/${sessionId}/${action}`, { data: {} });
  expect(response.status()).toBe(200);
}

function withinViewport(box: Box, viewportHeight: number): boolean {
  return box.y >= 0 && box.y + box.height <= viewportHeight;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.first().boundingBox();
  if (!box) throw new Error("Expected a rendered box");
  return box;
}

test("renders a backward cook as ordered visits, a return marker, and attempt labels", async ({ page, request }) => {
  const sessionId = await startCook(request, "Backward cook timeline");
  await page.goto(`/live/${sessionId}`);
  await page.getByLabel("New step note").fill("Fire was still dirty.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Fire was still dirty.")).toBeVisible();

  await page.getByTestId("live-composer").getByRole("button", { name: "Advance" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Cook over the clean fire" })).toBeVisible();
  await page.getByTestId("live-composer").getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Stabilize a clean fire" })).toBeVisible();

  await expect(page.locator('[data-entry="visit"]')).toHaveCount(2);
  await expect(page.locator('[data-entry="return-marker"]')).toHaveCount(1);
  await expect(page.locator('[data-entry="return-marker"]')).toContainText("Returned");
  await expect(page.locator('[data-entry="return-marker"]')).toContainText("Stabilize a clean fire");

  // Both visits of the repeated step are labeled with their attempt so they do
  // not read as duplicates, and the note stays with the visit that owns it.
  await expect(page.locator('[data-entry="visit"]').first()).toContainText("Attempt 1 of 2");
  await expect(page.locator('[data-entry="visit"]').first()).toContainText("Fire was still dirty.");
  await expect(page.locator('[data-entry="visit"]').nth(1)).not.toContainText("Fire was still dirty.");
  await expect(page.getByTestId("live-now")).toContainText("Attempt 2 of 2");
  await expect(page.locator('[data-entry="visit"]').first()).toContainText("ran 0:");
  await expect(page.locator('[data-entry="visit"]').first()).toContainText("of 20:00 planned");
  await expect(page.locator('[data-entry="visit"]').first()).toContainText("under plan");

  await expect(page.locator('[data-entry="visit"][data-visit-id]')).toHaveCount(2);
  await expect(page.locator("[data-note-id]")).toHaveCount(1);

});

test("renders phases, ghosted future steps, and an approximate projected finish in one container", async ({
  page,
  request,
}) => {
  const sessionId = await startCook(request, "Whole arc timeline");
  await page.goto(`/live/${sessionId}`);

  const timeline = page.getByTestId("live-timeline");
  await expect(timeline.locator('[data-entry="phase-divider"]')).toHaveCount(2);
  await expect(timeline.locator('[data-entry="phase-divider"]').first()).toContainText("Phase 1 · Fire · Two-zone indirect");
  await expect(timeline.locator('[data-entry="phase-divider"]').first()).toContainText("Wait for clean smoke.");
  await expect(timeline.locator('[data-entry="phase-divider"]').nth(1)).toContainText("Pull the deflector before searing.");
  await expect(timeline.locator('[data-entry="future-step"]')).toHaveCount(2);
  await expect(timeline.locator('[data-entry="future-step"]').first()).toContainText("Cook over the clean fire");
  await expect(timeline.locator('[data-entry="future-step"]').first()).toContainText("30:00 planned");
  await expect(timeline.locator('[data-entry="closing"]')).toContainText("approximate");
  await expect(timeline.locator('[data-entry="closing"]')).toContainText("Projected finish");

  // Pre-cook guidance sits at the head of the spine, labeled and reachable.
  const guidance = page.getByRole("button", { name: "Before you light" });
  await expect(guidance).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText("Bottom vent one finger, top vent quarter open.")).toBeVisible();
  await expect(page.getByText("Set up two heat zones.")).toBeVisible();
  await guidance.click();
  await expect(guidance).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByText("Bottom vent one finger, top vent quarter open.")).toBeHidden();

});

test("conveys position without any determinate progress element and announces elapsed time once", async ({
  page,
  request,
}) => {
  const sessionId = await startCook(request, "Progressless timeline");
  await page.goto(`/live/${sessionId}`);

  const live = page.locator("article.live-page");
  await expect(live.getByRole("progressbar")).toHaveCount(0);
  expect(await live.innerText()).not.toMatch(/\d+\s?%/);

  await expect(page.getByTestId("live-now")).toContainText("Current action · 1 of 3");
  await expect(page.getByTestId("live-now")).toContainText("elapsed of 20:00 planned");
  await expect(page.getByTestId("live-now").locator("[aria-live]")).toContainText("Step 1 of 3.");

  // Exactly one live region on the page, so the same seconds are not announced twice.
  await expect(live.locator("[aria-live]")).toHaveCount(1);

});

test("pins the now bar with status, position, timing, and both targets once the now region scrolls away", async ({
  page,
  request,
}) => {
  const sessionId = await startCook(request, "Pinned context timeline");
  for (const action of ["advance", "advance", "return", "return", "advance"]) {
    await command(request, sessionId, action);
  }
  await page.setViewportSize({ width: 390, height: 420 });
  await page.goto(`/live/${sessionId}`);
  await expect(page.getByTestId("live-now")).toBeVisible();
  await expect(page.getByTestId("live-now-bar")).toHaveCount(0);

  await page.evaluate(() => window.scrollTo(0, 0));
  const bar = page.getByTestId("live-now-bar");
  await expect(bar).toBeVisible();
  await expect(bar).toContainText("ACTIVE");
  await expect(bar).toContainText("step 2 of 3");
  await expect(bar).toContainText("Planned dome 225–275°F");
  await expect(bar).toContainText("planned food 130°F");
  await expect(bar.getByRole("button", { name: "Advance" })).toBeVisible();
  await expect(bar.locator("[aria-live]")).toHaveCount(0);
  expect(withinViewport(await boxOf(bar), 420)).toBe(true);

  await page.getByTestId("live-now").scrollIntoViewIfNeeded();
  await expect(page.getByTestId("live-now-bar")).toHaveCount(0);
});

// Measured at 320 by 568 with the mobile chrome present: now region y 72-426,
// complete action y 208-248, both target readouts y 308-404, pinned composer
// y 429-568. It fits with 25px of slack, so the pinned context region's target
// row does not need to collapse.
test("keeps the complete action and both planned targets above the fold at 320 by 568", async ({ page, request }) => {
  const sessionId = await startCook(request, "Narrow above fold");
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`/live/${sessionId}`);
  await expect(page.getByTestId("current-action")).toBeVisible();

  const action = await boxOf(page.getByTestId("current-action"));
  const dome = await boxOf(page.getByTestId("planned-dome-target"));
  const food = await boxOf(page.getByTestId("planned-food-target"));
  const composer = await boxOf(page.getByTestId("live-composer"));
  const measurement = { action, dome, food, composer };

  expect(withinViewport(action, 568), `action out of viewport: ${JSON.stringify(measurement)}`).toBe(true);
  expect(withinViewport(dome, 568), `dome target out of viewport: ${JSON.stringify(measurement)}`).toBe(true);
  expect(withinViewport(food, 568), `food target out of viewport: ${JSON.stringify(measurement)}`).toBe(true);
  expect(food.y + food.height, `targets overlap the composer: ${JSON.stringify(measurement)}`).toBeLessThanOrEqual(
    composer.y,
  );
  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

});

test("keeps advance and every pinned control reachable and tappable at narrow widths", async ({ page, request }) => {
  const sessionId = await startCook(request, "Thumb zone timeline");
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto(`/live/${sessionId}`);

  const composer = page.getByTestId("live-composer");
  const advance = composer.getByRole("button", { name: "Advance" });
  await expect(advance).toBeVisible();
  expect(withinViewport(await boxOf(advance), 700)).toBe(true);

  await page.setViewportSize({ width: 320, height: 568 });
  const controls = await composer.getByRole("button").all();
  const boxes: Box[] = [];
  for (const control of controls) {
    const box = await control.boundingBox();
    if (!box) throw new Error("Composer control has no box");
    expect(box.width, `control narrower than 44px: ${JSON.stringify(box)}`).toBeGreaterThanOrEqual(44);
    expect(box.height, `control shorter than 44px: ${JSON.stringify(box)}`).toBeGreaterThanOrEqual(44);
    boxes.push(box);
  }
  for (const [index, box] of boxes.entries()) {
    for (const other of boxes.slice(index + 1)) {
      const overlaps =
        box.x < other.x + other.width &&
        other.x < box.x + box.width &&
        box.y < other.y + other.height &&
        other.y < box.y + box.height;
      expect(overlaps, `controls overlap: ${JSON.stringify([box, other])}`).toBe(false);
    }
  }
  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

});

test("resolves the initial scroll position to the current step rather than the end of the plan", async ({
  page,
  request,
}) => {
  const sessionId = await startCook(request, "Scroll resolution timeline");
  await command(request, sessionId, "advance");
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto(`/live/${sessionId}`);
  await expect(page.getByTestId("live-now")).toBeVisible();

  const scroll = await page.evaluate(() => ({
    y: window.scrollY,
    max: document.documentElement.scrollHeight - window.innerHeight,
  }));
  expect(scroll.y, "the timeline did not scroll to the current step").toBeGreaterThan(0);
  expect(scroll.y, "the timeline anchored to the end of its content").toBeLessThan(scroll.max);
  expect(withinViewport(await boxOf(page.getByTestId("live-now")), 700)).toBe(true);

});

test("repositions to the new current step without animation under reduced motion", async ({ page, request }) => {
  const sessionId = await startCook(request, "Reduced motion timeline");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto(`/live/${sessionId}`);
  await page.getByTestId("live-composer").getByRole("button", { name: "Advance" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Cook over the clean fire" })).toBeVisible();

  expect(withinViewport(await boxOf(page.getByTestId("live-now")), 700)).toBe(true);
  await expect(page.getByTestId("live-now-bar")).toHaveCount(0);

});

test("serves a terminal cook from its own route as the same closed timeline", async ({ page, request }) => {
  const sessionId = await startCook(request, "Terminal timeline");
  await page.goto(`/live/${sessionId}`);
  await page.getByLabel("New step note").fill("Closed the vents.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Closed the vents.")).toBeVisible();
  await command(request, sessionId, "cancel");

  const active = await request.get("/api/live-sessions/active");
  expect(active.status()).toBe(204);
  await page.goto(`/live/${sessionId}`);

  await expect(page.getByText("cancelled cooking session · read-only durable detail")).toBeVisible();
  await expect(page.getByTestId("live-timeline")).toContainText("Cook closed");
  await expect(page.getByText("Closed the vents.")).toBeVisible();
  await expect(page.getByTestId("live-composer")).toHaveCount(0);
  await expect(page.getByTestId("live-now-bar")).toHaveCount(0);
  await expect(page.locator('[data-entry="future-step"]')).toHaveCount(0);
  await expect(page.getByLabel("New step note")).toHaveCount(0);
  await expect(page.locator("[data-note-id] button")).toHaveCount(0);
  await expect(page.locator("article.live-page").getByRole("progressbar")).toHaveCount(0);
});

test("keeps the plan and actual gutter free of page-level horizontal overflow at wide widths", async ({
  page,
  request,
}) => {
  const sessionId = await startCook(request, "Gutter overflow timeline");
  await command(request, sessionId, "advance");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/live/${sessionId}`);

  const visit = page.locator('[data-entry="visit"]').first();
  await expect(visit).toHaveCount(1);
  await expect(visit.getByTestId("entry-gutter")).toBeVisible();
  await expect(visit.getByTestId("entry-gutter")).toContainText("+0:00");
  expect(await visit.innerText()).not.toContain("started");
  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  await page.setViewportSize({ width: 320, height: 568 });
  await expect(visit.getByTestId("entry-gutter")).toBeHidden();
  expect(await visit.innerText()).toContain("started");
  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});
