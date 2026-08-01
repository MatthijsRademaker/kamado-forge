import { describe, expect, test } from "bun:test";
import type { CoachProviderInput } from "./coach-provider";
import { createCoachService } from "./coach-service";
import { createFakeCoachProvider } from "./fake-coach-provider";
import { createLiveCookRepository } from "./persistence/live-cook-repository";
import { createSessionRepository } from "./persistence/session-repository";
import { createTemporaryPersistence } from "./persistence/test-support";
import type { SessionWrite } from "./session-contract";

const plan: SessionWrite = {
  title: "Brisket practice",
  cookingDate: "2026-09-12",
  plannedDomeRange: { minF: 250, maxF: 275 },
  plannedFoodTargetF: 203,
  setupGuidance: "Set up indirect.",
  deflectorGuidance: "Install the deflector.",
  heatZoneGuidance: "Use one indirect zone.",
  ventGuidance: "Settle the vents gradually.",
  prepNotes: "Trim and salt the brisket.",
  phases: [
    {
      title: "Build the fire",
      technique: "Clean smoke",
      transitionGuidance: "Wait for stable smoke.",
      steps: [{ title: "Light charcoal", instructions: "Build a small fire.", durationMinutes: 30 }],
    },
    {
      title: "Build the bark",
      technique: "Low and slow",
      transitionGuidance: "Wrap after the bark sets.",
      steps: [{ title: "Hold clean smoke", instructions: "Keep airflow steady.", durationMinutes: 180 }],
    },
  ],
};

describe("CoachService", () => {
  test("reads one active projection and returns the exact allowlisted snapshot used by the provider", async () => {
    const fixture = createTemporaryPersistence();
    let now = new Date("2026-09-12T10:00:00.000Z");

    try {
      const persistence = fixture.bootstrap();
      const sessions = createSessionRepository(persistence);
      const live = createLiveCookRepository(persistence, { now: () => now });
      const created = sessions.create(plan);
      live.activateSession(created.id, {});
      now = new Date("2026-09-12T10:30:00.000Z");
      live.command("advance", {}, created.id);
      now = new Date("2026-09-12T10:31:00.000Z");
      live.addNote(created.id, "private note that must not reach Coach");
      const before = live.getActive();
      let contextReads = 0;
      const provider = createFakeCoachProvider({
        output: {
          answer: "Keep the vents steady while the bark develops.",
          guidance: ["Wait ten minutes.", "Change only one vent if needed."],
          warnings: ["Do not chase short thermometer swings."],
          suggestedFollowUps: ["How do I judge bark texture?"],
        },
      });
      const service = createCoachService({
        contextSource: {
          findActive() {
            contextReads += 1;
            return live.findActive();
          },
        },
        provider,
      });

      const result = await service.ask("Should I adjust the vents?");
      const expectedContext = {
        kind: "active",
        sessionId: created.id,
        sessionTitle: "Brisket practice",
        sessionStatus: "ACTIVE",
        phaseTitle: "Build the bark",
        stepOrdinal: 1,
        stepTitle: "Hold clean smoke",
        projectedAt: "2026-09-12T10:31:00.000Z",
      } as const;

      expect(contextReads).toBe(1);
      expect(provider.inputs).toEqual([{ question: "Should I adjust the vents?", context: expectedContext }]);
      expect(JSON.stringify(provider.inputs)).not.toContain("private note");
      expect(JSON.stringify(provider.inputs)).not.toContain("instructions");
      expect(result).toEqual({
        answer: "Keep the vents steady while the bark develops.",
        guidance: ["Wait ten minutes.", "Change only one vent if needed."],
        warnings: ["Do not chase short thermometer swings."],
        suggestedFollowUps: ["How do I judge bark texture?"],
        contextUsed: expectedContext,
      });
      expect(live.getActive()).toEqual(before);
    } finally {
      fixture.cleanup();
    }
  });

  test("uses explicit none context and rejects invalid provider output", async () => {
    const inputs: CoachProviderInput[] = [];
    const service = createCoachService({
      contextSource: { findActive: () => undefined },
      provider: {
        async complete(input) {
          inputs.push(input);
          return { answer: "partial output" };
        },
      },
    });

    await expect(service.ask("How should I light a kamado?")).rejects.toMatchObject({ kind: "invalid_output" });
    expect(inputs).toEqual([{ question: "How should I light a kamado?", context: { kind: "none" } }]);
  });
});
