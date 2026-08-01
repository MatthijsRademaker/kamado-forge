import { expect, test, type Page } from "@playwright/test";

const noneContext = { kind: "none" } as const;
const success = {
  answer: "Keep the vents steady while the ceramic settles.",
  guidance: ["Wait ten minutes.", "Change only one vent at a time."],
  warnings: ["Do not chase short thermometer swings."],
  suggestedFollowUps: ["How do I recognize clean smoke?"],
  contextUsed: noneContext,
};

test("supports review-first suggestions, blank validation, multiline keyboard send, pending protection, and structured output", async ({
  page,
}) => {
  let releaseResponse = () => {};
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  const requests: Array<Record<string, unknown>> = [];
  await page.route("**/api/coach", async (route) => {
    requests.push(route.request().postDataJSON() as Record<string, unknown>);
    await responseGate;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: success }) });
  });

  await page.goto("/coach");
  await expect(page.getByRole("heading", { level: 1, name: "Coach" })).toBeVisible();
  await expect(page.getByText("No active cook context will be used.")).toBeVisible();

  const composer = page.getByRole("textbox", { name: "Question for Coach" });
  const suggestion = page.getByRole("button", { name: "How should I build a clean kamado fire?" });
  await suggestion.focus();
  await page.keyboard.press("Enter");
  await expect(composer).toHaveValue("How should I build a clean kamado fire?");
  await expect(composer).toBeFocused();
  expect(requests).toHaveLength(0);

  await composer.fill("   ");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("alert")).toContainText("Enter a question before sending");
  expect(requests).toHaveLength(0);

  await composer.fill("My dome is climbing.");
  await composer.press("Enter");
  await composer.type("Should I close the top vent?");
  await expect(composer).toHaveValue("My dome is climbing.\nShould I close the top vent?");
  expect(requests).toHaveLength(0);

  await composer.press("Control+Enter");
  await expect(page.getByRole("status")).toContainText("Coach is considering your question");
  await expect(page.getByRole("button", { name: "Send question" })).toBeDisabled();
  await composer.press("Control+Enter");
  expect(requests).toHaveLength(1);
  expect(requests[0]).toEqual({ question: "My dome is climbing.\nShould I close the top vent?" });

  releaseResponse();
  await expect(page.getByText(success.answer)).toBeVisible();
  await expect(page.getByRole("region", { name: "Coach warnings" })).toContainText(success.warnings[0]);
  await expect(page.getByText("Context used for this answer")).toBeVisible();
  await expect(page.getByRole("region", { name: "Context used for this answer" })).toContainText("No active cook");
  await expect(page.locator('[data-speaker="user"]')).toHaveCount(1);
  await expect(page.locator('[data-speaker="coach"]')).toHaveCount(1);
  await expect(page.getByRole("button", { name: success.suggestedFollowUps[0] })).toBeVisible();
});

test("shows current active context separately from the exact response snapshot", async ({ page }) => {
  const activeProjection = {
    id: "11111111-1111-4111-8111-111111111111",
    status: "ACTIVE",
    projectedAt: "2026-09-12T10:00:00.000Z",
    plan: {
      title: "Brisket practice",
      phases: [
        { title: "Build the fire", steps: [{ title: "Light charcoal" }] },
        { title: "Build the bark", steps: [{ title: "Hold clean smoke" }] },
      ],
    },
    currentStep: { ordinal: 0, title: "Light charcoal" },
  };
  const usedContext = {
    kind: "active",
    sessionId: activeProjection.id,
    sessionTitle: "Brisket practice",
    sessionStatus: "ACTIVE",
    phaseTitle: "Build the bark",
    stepOrdinal: 1,
    stepTitle: "Hold clean smoke",
    projectedAt: "2026-09-12T10:05:00.000Z",
  } as const;
  await page.route("**/api/live-sessions/active", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: activeProjection }) }),
  );
  await page.route("**/api/coach", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { ...success, contextUsed: usedContext } }),
    }),
  );

  await page.goto("/coach");
  const current = page.getByRole("region", { name: "Current cook context" });
  await expect(current).toContainText("Brisket practice");
  await expect(current).toContainText("Build the fire");
  await expect(current).toContainText("Light charcoal");

  await page.getByRole("textbox", { name: "Question for Coach" }).fill("What changed?");
  await page.getByRole("button", { name: "Send question" }).click();
  const used = page.getByRole("region", { name: "Context used for this answer" });
  await expect(used).toContainText("Build the bark");
  await expect(used).toContainText("Hold clean smoke");
  await expect(used).toContainText(usedContext.sessionId);
  await expect(used).toContainText(usedContext.projectedAt);
});

test("retains and retries the same failed turn while distinguishing provider and transport failures", async ({ page }) => {
  let attempt = 0;
  const retryContext = {
    kind: "active",
    sessionId: "22222222-2222-4222-8222-222222222222",
    sessionTitle: "Fresh retry cook",
    sessionStatus: "PAUSED",
    phaseTitle: "Retry phase",
    stepOrdinal: 2,
    stepTitle: "Fresh retry step",
    projectedAt: "2026-09-12T11:00:00.000Z",
  } as const;
  await page.route("**/api/coach", async (route) => {
    attempt += 1;
    if (attempt === 1) {
      await route.fulfill({
        status: 504,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "COACH_PROVIDER_TIMEOUT", message: "Coach provider timed out", issues: [] },
        }),
      });
      return;
    }
    if (attempt === 2) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { ...success, contextUsed: retryContext } }),
      });
      return;
    }
    if (attempt === 3) {
      await route.abort("internetdisconnected");
      return;
    }
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "COACH_PROVIDER_DISABLED", message: "Coach provider is not configured", issues: [] },
      }),
    });
  });

  await page.goto("/coach");
  const composer = page.getByRole("textbox", { name: "Question for Coach" });
  await composer.fill("Should I wait?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("alert")).toContainText("Coach provider timed out");
  await expect(page.getByRole("button", { name: "Retry question" })).toBeVisible();
  await expect(page.locator('[data-speaker="user"]')).toHaveCount(1);

  await page.getByRole("button", { name: "Retry question" }).click();
  await expect(page.getByText(success.answer)).toBeVisible();
  await expect(page.getByRole("region", { name: "Context used for this answer" })).toContainText("Fresh retry step");
  await expect(page.locator('[data-speaker="user"]')).toHaveCount(1);

  await composer.fill("Can Coach hear me?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("alert")).toContainText("Coach could not be reached");
  await expect(page.getByRole("alert")).not.toContainText("provider");
  await expect(page.locator('[data-speaker="user"]')).toHaveCount(2);

  await page.getByRole("button", { name: "Retry question" }).click();
  await expect(page.getByRole("alert")).toContainText("Server configuration is required");
  await expect(page.getByRole("button", { name: "Retry question" })).toHaveCount(0);
  await expect(page.locator('[data-speaker="user"]')).toHaveCount(2);
});

test("keeps all Coach content operable without page overflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await mockSuccessfulCoach(page, {
    ...success,
    answer: "Long practical answer ".repeat(16),
    warnings: ["A long warning with an-unbroken-token-that-must-wrap-without-causing-horizontal-overflow."],
  });
  await page.goto("/coach");
  await page.getByRole("textbox", { name: "Question for Coach" }).fill("Help at narrow width");
  await page.getByRole("button", { name: "Send question" }).click();

  for (const locator of [
    page.getByRole("region", { name: "Current cook context" }),
    page.getByRole("log", { name: "Coach transcript" }),
    page.getByRole("region", { name: "Coach warnings" }),
    page.getByRole("textbox", { name: "Question for Coach" }),
    page.getByRole("button", { name: success.suggestedFollowUps[0] }),
  ]) {
    await expect(locator).toBeVisible();
  }
  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const sendBox = await page.getByRole("button", { name: "Send question" }).boundingBox();
  expect(sendBox?.height).toBeGreaterThanOrEqual(44);
  const followUp = page.getByRole("button", { name: success.suggestedFollowUps[0] });
  await followUp.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(followUp).toBeFocused();
  expect(
    await followUp.evaluate((element) => {
      const style = getComputedStyle(element);
      return style.outlineStyle === "solid" || style.boxShadow !== "none";
    }),
  ).toBe(true);
});

async function mockSuccessfulCoach(page: Page, response = success): Promise<void> {
  await page.route("**/api/coach", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: response }) }),
  );
}
