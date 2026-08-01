import { describe, expect, test } from "bun:test";
import { createLiveCookRepository } from "./persistence/live-cook-repository";
import { createSessionRepository } from "./persistence/session-repository";
import { createTemporaryPersistence } from "./persistence/test-support";
import type { SessionWrite } from "./session-contract";
import { createFakeCoachProvider } from "./fake-coach-provider";
import { createCoachService } from "./coach-service";

const expectedTools = [
  {
    name: "recommend_next_action",
    description: "Suggest one action for the cook to consider without executing it.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string", minLength: 1, maxLength: 120 },
        rationale: { type: "string", minLength: 1, maxLength: 500 },
      },
      required: ["title", "rationale"],
    },
    outputKind: "next_action",
  },
  {
    name: "highlight_cook_risk",
    description: "Highlight one cooking risk for the cook to consider without changing session state.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        title: { type: "string", minLength: 1, maxLength: 120 },
        rationale: { type: "string", minLength: 1, maxLength: 500 },
      },
      required: ["title", "rationale"],
    },
    outputKind: "caution",
  },
] as const;

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
      title: "Cook",
      technique: "Low and slow",
      transitionGuidance: "Wrap after the bark sets.",
      steps: [
        { title: "Build smoke", instructions: "Hold clean smoke.", durationMinutes: 60 },
        { title: "Set bark", instructions: "Cook until the bark is firm.", durationMinutes: 180 },
      ],
    },
  ],
};

describe("CoachService", () => {
  test("sends the exact request with explicit absent-session context", async () => {
    let contextReads = 0;
    const provider = createFakeCoachProvider({
      result: {
        message: "Build a clean fire, then make small vent changes.",
        suggestions: [],
      },
    });
    const service = createCoachService({
      contextSource: {
        findActive() {
          contextReads += 1;
          return undefined;
        },
      },
      model: "gpt-test",
      provider,
    });

    const result = await service.ask([{ role: "user", content: "How should I start?" }]);

    expect(result).toEqual({
      message: "Build a clean fire, then make small vent changes.",
      suggestions: [],
    });
    expect(contextReads).toBe(1);
    expect(provider.requests).toEqual([
      {
        model: "gpt-test",
        chat: [{ role: "user", content: "How should I start?" }],
        context: { version: 1, activeSession: null },
        systemPrompt:
          "You are a kamado BBQ cooking coach. Use only the supplied authoritative context for cook facts. Give concise, practical advice. Tool calls are advisory suggestions only and never execute session changes. Do not claim that a step, target, note, timer, or status was changed.",
        tools: expectedTools,
      },
    ]);
  });

  test("assembles bounded active context from persistence and cannot mutate it", async () => {
    const fixture = createTemporaryPersistence();
    let now = new Date("2026-09-12T10:00:00.000Z");

    try {
      const persistence = fixture.bootstrap();
      const sessions = createSessionRepository(persistence);
      const live = createLiveCookRepository(persistence, { now: () => now });
      const created = sessions.create(plan);
      live.activateSession(created.id, {});
      for (const [timestamp, note] of [
        ["2026-09-12T10:01:00.000Z", "first"],
        ["2026-09-12T10:02:00.000Z", "second"],
        ["2026-09-12T10:03:00.000Z", "third"],
      ] as const) {
        now = new Date(timestamp);
        live.addNote(created.id, note);
      }
      now = new Date("2026-09-12T10:04:00.000Z");
      live.command("advance", {}, created.id);
      for (const [timestamp, note] of [
        ["2026-09-12T10:05:00.000Z", "fourth"],
        ["2026-09-12T10:06:00.000Z", "fifth"],
        ["2026-09-12T10:07:00.000Z", "sixth"],
      ] as const) {
        now = new Date(timestamp);
        live.addNote(created.id, note);
      }
      const before = live.getActive();
      const firstVisit = before.executionHistory[0];
      const secondVisit = before.executionHistory[1];
      if (!firstVisit || !secondVisit || !before.currentStep) throw new Error("Expected active fixture state");
      const notesByContent = new Map(
        before.executionHistory.flatMap((visit) => visit.notes.map((note) => [note.content, note] as const)),
      );
      const noteId = (content: string): string => {
        const note = notesByContent.get(content);
        if (!note) throw new Error(`Expected persisted note: ${content}`);
        return note.id;
      };
      const provider = createFakeCoachProvider({
        result: {
          message: "Keep building the bark before wrapping.",
          suggestions: [
            {
              kind: "next_action",
              title: "Check bark texture",
              rationale: "Wrapping too early can soften the bark.",
            },
          ],
        },
      });
      const service = createCoachService({ contextSource: live, model: "gpt-test", provider });

      const result = await service.ask([{ role: "user", content: "Should I wrap now?" }]);

      expect(result.suggestions).toEqual([
        {
          kind: "next_action",
          title: "Check bark texture",
          rationale: "Wrapping too early can soften the bark.",
        },
      ]);
      expect(provider.requests).toEqual([
        {
          model: "gpt-test",
          chat: [{ role: "user", content: "Should I wrap now?" }],
          context: {
            version: 1,
            activeSession: {
              id: created.id,
              status: "ACTIVE",
              title: "Brisket practice",
              currentStep: {
                id: before.currentStep.id,
                ordinal: 1,
                title: "Set bark",
                instructions: "Cook until the bark is firm.",
                durationMinutes: 180,
              },
              targets: {
                domeTemperatureF: { min: 250, max: 275 },
                foodTemperatureF: 203,
              },
              recentNotes: [
                {
                  id: noteId("sixth"),
                  stepId: secondVisit.step.id,
                  stepTitle: "Set bark",
                  content: "sixth",
                  createdAt: "2026-09-12T10:07:00.000Z",
                },
                {
                  id: noteId("fifth"),
                  stepId: secondVisit.step.id,
                  stepTitle: "Set bark",
                  content: "fifth",
                  createdAt: "2026-09-12T10:06:00.000Z",
                },
                {
                  id: noteId("fourth"),
                  stepId: secondVisit.step.id,
                  stepTitle: "Set bark",
                  content: "fourth",
                  createdAt: "2026-09-12T10:05:00.000Z",
                },
                {
                  id: noteId("third"),
                  stepId: firstVisit.step.id,
                  stepTitle: "Build smoke",
                  content: "third",
                  createdAt: "2026-09-12T10:03:00.000Z",
                },
                {
                  id: noteId("second"),
                  stepId: firstVisit.step.id,
                  stepTitle: "Build smoke",
                  content: "second",
                  createdAt: "2026-09-12T10:02:00.000Z",
                },
              ],
            },
          },
          systemPrompt:
            "You are a kamado BBQ cooking coach. Use only the supplied authoritative context for cook facts. Give concise, practical advice. Tool calls are advisory suggestions only and never execute session changes. Do not claim that a step, target, note, timer, or status was changed.",
          tools: expectedTools,
        },
      ]);
      expect(live.getActive()).toEqual(before);
    } finally {
      fixture.cleanup();
    }
  });
});
