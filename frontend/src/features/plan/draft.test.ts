import { describe, expect, test } from "bun:test";
import type { CookingSession } from "@/api/sessions";
import { createEmptyPlanDraft, fromCookingSession, toCookingSessionWrite } from "./draft";

const session: CookingSession = {
  id: "session-1",
  status: "draft",
  createdAt: "2026-08-08T12:00:00.000Z",
  updatedAt: "2026-08-08T12:00:00.000Z",
  title: "Saturday cook",
  cookingDate: "2026-08-08",
  plannedDomeRange: { minF: 225, maxF: 275 },
  plannedFoodTargetF: 130,
  setupGuidance: "Two zones.",
  deflectorGuidance: "Half moon.",
  heatZoneGuidance: "Direct right.",
  ventGuidance: "Quarter open.",
  prepNotes: "Dry brine.",
  phases: [
    {
      id: "phase-1",
      title: "Prepare",
      technique: "Fire building",
      transitionGuidance: "Wait for clean smoke.",
      steps: [
        { id: "step-1", title: "Light", instructions: "Light one starter.", durationMinutes: 20 },
        { id: "step-2", title: "Settle", instructions: "Settle the dome.", durationMinutes: 25 },
      ],
    },
  ],
};

describe("Plan durable editing buffer", () => {
  test("round-trips every editable field and explicit nested order without server-owned identities", () => {
    const draft = fromCookingSession(session);
    draft.phases[0]?.steps.reverse();

    expect(toCookingSessionWrite(draft)).toEqual({
      title: session.title,
      cookingDate: session.cookingDate,
      plannedDomeRange: session.plannedDomeRange,
      plannedFoodTargetF: session.plannedFoodTargetF,
      setupGuidance: session.setupGuidance,
      deflectorGuidance: session.deflectorGuidance,
      heatZoneGuidance: session.heatZoneGuidance,
      ventGuidance: session.ventGuidance,
      prepNotes: session.prepNotes,
      phases: [
        {
          title: "Prepare",
          technique: "Fire building",
          transitionGuidance: "Wait for clean smoke.",
          steps: [
            { title: "Settle", instructions: "Settle the dome.", durationMinutes: 25 },
            { title: "Light", instructions: "Light one starter.", durationMinutes: 20 },
          ],
        },
      ],
    });
  });

  test("creates an explicit editable buffer without claiming a server identity", () => {
    const draft = createEmptyPlanDraft();

    expect(draft.sessionId).toBeNull();
    expect(draft.phases).toHaveLength(1);
    expect(draft.phases[0]?.steps).toHaveLength(1);
    expect(draft.phases[0]?.key).toBeString();
    expect(draft.phases[0]?.steps[0]?.key).toBeString();
  });
});
