import { expect, test } from "@playwright/test";
import type { CookingSession, CookingSessionWrite } from "../frontend/src/api/generated/types.gen";

test("persists the complete Plan-to-Live journey, recovers from a backend conflict, and reloads terminal detail", async ({
  page,
}) => {
  await page.goto("/plan");
  await page.getByRole("button", { name: "Create plan" }).click();

  await page.getByLabel("Plan title").fill("Durable steak night");
  await page.getByLabel("Cooking date").fill("2026-08-08");
  await page.getByLabel("Planned dome target").fill("225");
  await page.getByLabel("Planned dome maximum").fill("275");
  await page.getByLabel("Planned food target").fill("130");
  await page.getByLabel("Phase 1 title").fill("Build the fire");
  await page.getByLabel("Phase 1 technique").fill("Two-zone fire");
  await page.getByLabel("Phase 1 transition guidance").fill("Wait for clean smoke.");
  await page.getByLabel("Step 1 title").fill("Light the charcoal");
  await page.getByLabel("Step 1 duration (minutes)").fill("20");
  await page.getByLabel("Step 1 instructions").fill("Light one starter and wait for clean smoke.");

  await page.getByRole("button", { name: "Add step to phase 1" }).click();
  await page.getByLabel("Step 2 title").fill("Stabilize the dome");
  await page.getByLabel("Step 2 duration (minutes)").fill("25");
  await page.getByLabel("Step 2 instructions").fill("Settle the kamado in the planned range.");

  await page.getByLabel("Kamado setup").fill("Set up two heat zones.");
  await page.getByLabel("Deflector guidance").fill("Install the half-moon deflector.");
  await page.getByLabel("Heat-zone guidance").fill("Keep the right side direct.");
  await page.getByLabel("Vent and fire guidance").fill("Bottom vent one finger, top vent quarter open.");
  await page.getByLabel("Prep notes").fill("Dry brine overnight.");

  await page.getByRole("button", { name: "Save plan" }).click();
  await expect(page.getByText(/^Saved \d/)).toBeVisible();
  await expect(page).toHaveURL(/\/plan\?sessionId=[0-9a-f-]+$/);
  const selectedPlanUrl = page.url();
  const selectedSessionId = /sessionId=([0-9a-f-]+)/.exec(selectedPlanUrl)?.[1];
  if (!selectedSessionId) throw new Error("Saved Plan route did not retain a session ID");
  const selectedResponse = await page.request.get(`/api/sessions/${selectedSessionId}`);
  expect(selectedResponse.status()).toBe(200);
  const selectedPlan = (await selectedResponse.json()) as { data: CookingSession };
  const newerResponse = await page.request.post("/api/sessions", {
    data: { ...toSessionWrite(selectedPlan.data), title: "Newer competing plan" },
  });
  expect(newerResponse.status()).toBe(201);

  await page.goto(selectedPlanUrl);
  await page.reload();
  await expect(page.getByLabel("Plan title")).toHaveValue("Durable steak night");
  await expect(page.getByLabel("Step 1 title")).toHaveValue("Light the charcoal");
  await expect(page.getByLabel("Step 2 title")).toHaveValue("Stabilize the dome");

  await page.route("**/api/sessions**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "REFRESH_FAILED", message: "Refresh unavailable", issues: [] } }),
      });
      return;
    }
    await route.continue();
  });
  await page.getByLabel("Prep notes").fill("Dry brine overnight and retain this edit.");
  await page.getByRole("button", { name: "Save plan" }).click();
  await expect(page.getByText(/^Saved \d/)).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Saved plan refresh failed");
  await expect(page.getByLabel("Prep notes")).toHaveValue("Dry brine overnight and retain this edit.");
  await page.unroute("**/api/sessions**");
  await page.getByRole("button", { name: "Retry refresh" }).click();
  await expect(page.getByText("Saved plan refresh failed")).toBeHidden();

  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "Eligible saved plans" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Durable steak night" })).toBeVisible();
  await page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Durable steak night" }) })
    .getByRole("button", { name: "Start this cook" })
    .click();
  await expect(page).toHaveURL(/\/live\/[0-9a-f-]+$/);
  const liveUrl = page.url();
  const sessionId = liveUrl.split("/").at(-1);
  if (!sessionId) throw new Error("Live route did not retain a session ID");

  await expect(page.getByRole("heading", { level: 1, name: "Light the charcoal" })).toBeVisible();
  const initialElapsed = await page.getByTestId("step-elapsed").textContent();
  await expect
    .poll(() => page.getByTestId("step-elapsed").textContent(), { timeout: 3000 })
    .not.toBe(initialElapsed);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Light the charcoal" })).toBeVisible();

  const liveRoutePattern = "**/*";
  await page.route(liveRoutePattern, async (route) => {
    const request = route.request();
    if (
      request.url().includes(`/api/live-sessions/${sessionId}`) &&
      (request.method() === "GET" || request.method() === "POST")
    ) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "REFRESH_FAILED", message: "Refresh unavailable", issues: [] } }),
      });
      return;
    }
    await route.continue();
  });
  await page.getByLabel("New step note").fill("Keep this note through refresh failure.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Cook refresh failed")).toBeVisible();
  await expect(page.getByLabel("New step note")).toHaveValue("Keep this note through refresh failure.");
  await expect(page.getByRole("heading", { level: 1, name: "Light the charcoal" })).toBeVisible();
  await page.unroute(liveRoutePattern);
  await page.getByRole("button", { name: "Retry refresh" }).click();
  await expect(page.getByText("Cook refresh failed")).toBeHidden();

  const externalPause = await page.request.post(`/api/live-sessions/${sessionId}/pause`, { data: {} });
  expect(externalPause.status()).toBe(200);
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText(/server state changed/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

  await page.getByLabel("New step note").fill("Clean smoke settled in.");
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText("Clean smoke settled in.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Clean smoke settled in.")).toBeVisible();

  await page.getByRole("button", { name: "Advance" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Stabilize the dome" })).toBeVisible();
  await page.getByRole("button", { name: "Finish cook" }).click();
  const finalStepPause = await page.request.post(`/api/live-sessions/${sessionId}/pause`, { data: {} });
  expect(finalStepPause.status()).toBe(200);
  await page.getByRole("button", { name: "Confirm finish" }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("server state changed");
  await page.getByRole("button", { name: "Keep cooking" }).click();
  await page.getByRole("button", { name: "Resume" }).click();
  await page.getByRole("button", { name: "Finish cook" }).click();
  await page.getByRole("button", { name: "Confirm finish" }).click();
  await expect(page).toHaveURL(liveUrl);
  await expect(page.getByText("completed cooking session · read-only durable detail")).toBeVisible();
  await expect(page.getByTestId("session-progress")).toContainText("100%");

  await page.reload();
  await expect(page).toHaveURL(liveUrl);
  await expect(page.getByText("completed cooking session · read-only durable detail")).toBeVisible();
  await expect(page.getByTestId("session-progress")).toContainText("100%");
  await expect(page.getByText("Clean smoke settled in.")).toBeVisible();

  await page.goto("/today");
  await expect(page.getByRole("heading", { name: "Eligible saved plans" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Newer competing plan" })).toBeVisible();
});

test("keeps durable Live current action and key targets usable at 320px", async ({ page, request }) => {
  const planResponse = await request.post("/api/sessions", {
    data: {
      title: "Narrow live cook",
      cookingDate: "2026-08-09",
      plannedDomeRange: { minF: 225, maxF: 275 },
      plannedFoodTargetF: 130,
      setupGuidance: "Two zones.",
      deflectorGuidance: "Half moon.",
      heatZoneGuidance: "Direct right.",
      ventGuidance: "Quarter open.",
      prepNotes: "Dry brine.",
      phases: [
        {
          title: "Fire",
          technique: "Indirect",
          transitionGuidance: "Wait for clean smoke.",
          steps: [
            {
              title: "Stabilize a clean fire",
              instructions: "Settle the dome and make only small vent changes.",
              durationMinutes: 20,
            },
            {
              title: "Cook over the clean fire",
              instructions: "Keep the food over indirect heat.",
              durationMinutes: 30,
            },
          ],
        },
      ],
    },
  });
  expect(planResponse.status()).toBe(201);
  const created = (await planResponse.json()) as { data: { id: string } };
  const activation = await request.post(`/api/sessions/${created.data.id}/activate`, { data: {} });
  expect(activation.status()).toBe(200);

  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto(`/live/${created.data.id}`);

  for (const testId of ["current-action", "planned-dome-target", "planned-food-target"]) {
    await expect(page.getByTestId(testId)).toBeVisible();
  }
  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  const cancellation = await request.post(`/api/live-sessions/${created.data.id}/cancel`, { data: {} });
  expect(cancellation.status()).toBe(200);
  await page.reload();
  await expect(page.getByText("cancelled cooking session · read-only durable detail")).toBeVisible();
  await expect(page.getByTestId("session-progress")).toContainText("50%");
});

function toSessionWrite(session: CookingSession): CookingSessionWrite {
  return {
    title: session.title,
    cookingDate: session.cookingDate,
    plannedDomeRange: session.plannedDomeRange,
    ...(session.plannedFoodTargetF === undefined ? {} : { plannedFoodTargetF: session.plannedFoodTargetF }),
    setupGuidance: session.setupGuidance,
    deflectorGuidance: session.deflectorGuidance,
    heatZoneGuidance: session.heatZoneGuidance,
    ventGuidance: session.ventGuidance,
    prepNotes: session.prepNotes,
    phases: session.phases.map((phase) => ({
      title: phase.title,
      technique: phase.technique,
      transitionGuidance: phase.transitionGuidance,
      steps: phase.steps.map((step) => ({
        title: step.title,
        instructions: step.instructions,
        durationMinutes: step.durationMinutes,
      })),
    })),
  };
}
