import { describe, expect, test } from "bun:test";
import { sessionWriteSchema } from "./contract";

const validDraft = {
  title: "Reverse-sear dinner",
  cookingDate: "2026-08-02",
  plannedDomeRange: { minF: 225, maxF: 275 },
  plannedFoodTargetF: 130,
  setupGuidance: "Set the grill for two-zone cooking.",
  deflectorGuidance: "Install the half-moon deflector.",
  heatZoneGuidance: "Keep one direct zone available.",
  ventGuidance: "Settle the vents before adding food.",
  prepNotes: "Dry brine overnight.",
  phases: [
    {
      title: "Roast",
      technique: "Indirect roasting",
      transitionGuidance: "Remove the deflector before searing.",
      steps: [{ title: "Roast", instructions: "Cook over indirect heat.", durationMinutes: 45 }],
    },
  ],
};

describe("draft cooking-session contract", () => {
  test("accepts the pinned complete write shape and temperature boundaries", () => {
    expect(
      sessionWriteSchema.parse({
        ...validDraft,
        plannedDomeRange: { minF: 150, maxF: 700 },
        plannedFoodTargetF: 32,
      }),
    ).toEqual({
      ...validDraft,
      plannedDomeRange: { minF: 150, maxF: 700 },
      plannedFoodTargetF: 32,
    });
    expect(sessionWriteSchema.parse({ ...validDraft, plannedFoodTargetF: 212 })).toBeDefined();
    expect(sessionWriteSchema.parse({ ...validDraft, plannedDomeRange: { minF: 250, maxF: 250 } })).toBeDefined();
    expect(sessionWriteSchema.parse({ ...validDraft, plannedFoodTargetF: undefined })).toBeDefined();
  });

  test("rejects invalid dates, durations, temperatures, ordering, and server-owned fields", () => {
    const invalidDurations = [0, -1, 1.5, 1441];
    const invalidDrafts = [
      { ...validDraft, cookingDate: "2026-02-30" },
      { ...validDraft, cookingDate: "08/02/2026" },
      ...invalidDurations.map((durationMinutes) => ({
        ...validDraft,
        phases: [{ ...validDraft.phases[0], steps: [{ ...validDraft.phases[0].steps[0], durationMinutes }] }],
      })),
      { ...validDraft, plannedDomeRange: { minF: 149, maxF: 275 } },
      { ...validDraft, plannedDomeRange: { minF: 225, maxF: 701 } },
      { ...validDraft, plannedDomeRange: { minF: 225.5, maxF: 275 } },
      { ...validDraft, plannedDomeRange: { minF: 300, maxF: 275 } },
      { ...validDraft, plannedFoodTargetF: 31 },
      { ...validDraft, plannedFoodTargetF: 212.5 },
      { ...validDraft, plannedFoodTargetF: 213 },
      { ...validDraft, phases: [] },
      { ...validDraft, phases: [{ ...validDraft.phases[0], steps: [] }] },
      { ...validDraft, title: "   " },
      { ...validDraft, id: "caller-owned" },
      { ...validDraft, status: "draft" },
      { ...validDraft, createdAt: "2026-08-01T00:00:00.000Z" },
    ];

    for (const draft of invalidDrafts) {
      expect(sessionWriteSchema.safeParse(draft).success).toBe(false);
    }
  });
});
