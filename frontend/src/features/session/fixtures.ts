import type { SessionPlan } from "@/api/generated/types.gen";

export type SessionFixtureName = "no-session" | "draft" | "active-running" | "active-paused";

interface SessionFixtureBaseline {
  fixture: SessionFixtureName;
  kind: "no-session" | "draft" | "active";
  plan: SessionPlan | null;
  running: boolean;
  stepIndex: number;
  elapsedSeconds: number;
}

const reverseSearPlan = {
  id: "session-reverse-sear",
  title: "Reverse-sear steak night",
  date: "2026-04-18",
  phases: [
    {
      id: "phase-fire",
      title: "Build the fire",
      technique: "Two-zone indirect setup",
      transitionGuidance: "Wait for thin, clean smoke before adding the steaks.",
      steps: [
        {
          id: "step-light",
          title: "Light a small fire",
          durationMinutes: 20,
          instructions: "Light one starter in the center. Keep the dome open until the first coals are glowing.",
        },
        {
          id: "step-stabilize",
          title: "Stabilize the dome",
          durationMinutes: 25,
          instructions: "Install the half-moon deflector and settle the dome at 250°F before adding food.",
        },
      ],
    },
    {
      id: "phase-roast",
      title: "Roast and sear",
      technique: "Reverse sear",
      transitionGuidance: "Remove the deflector and open both vents before the final sear.",
      steps: [
        {
          id: "step-roast",
          title: "Roast indirectly",
          durationMinutes: 50,
          instructions: "Roast on the cool side until the center is 10°F below the planned food target.",
        },
        {
          id: "step-sear",
          title: "Sear and rest",
          durationMinutes: 12,
          instructions: "Sear both sides over direct heat, then rest before slicing across the grain.",
        },
      ],
    },
  ],
  plannedDomeTarget: { value: 250, unit: "F" },
  plannedFoodTarget: { value: 130, unit: "F" },
  setup: "Half-moon heat deflector below the grate, with one direct zone open for the finish.",
  ventFireGuidance:
    "Start with both vents open. At 200°F, close the bottom vent to one finger and the top vent to one quarter.",
  prepNotes: "Dry-brine the steaks overnight.",
} satisfies SessionPlan;

export function selectSessionFixture(search: string): SessionFixtureBaseline {
  const requested = new URLSearchParams(search).get("fixture");
  const fixture = isSessionFixtureName(requested) ? requested : "no-session";

  if (fixture === "no-session") {
    return { fixture, kind: "no-session", plan: null, running: false, stepIndex: 0, elapsedSeconds: 0 };
  }

  const plan = structuredClone(reverseSearPlan);
  if (fixture === "draft") {
    return { fixture, kind: "draft", plan, running: false, stepIndex: 0, elapsedSeconds: 0 };
  }

  return {
    fixture,
    kind: "active",
    plan,
    running: fixture === "active-running",
    stepIndex: 1,
    elapsedSeconds: fixture === "active-running" ? 7 * 60 : 11 * 60,
  };
}

function isSessionFixtureName(value: string | null): value is SessionFixtureName {
  return value === "no-session" || value === "draft" || value === "active-running" || value === "active-paused";
}
