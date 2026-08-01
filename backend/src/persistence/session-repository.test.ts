import { describe, expect, test } from "bun:test";
import type { SessionWrite } from "../session-contract";
import { createSessionRepository } from "./session-repository";
import { createTemporaryPersistence } from "./test-support";

const draft: SessionWrite = {
  title: "Saturday cook",
  cookingDate: "2026-08-08",
  plannedDomeRange: { minF: 225, maxF: 275 },
  plannedFoodTargetF: 130,
  setupGuidance: "Set up for two zones.",
  deflectorGuidance: "Use the half-moon deflector.",
  heatZoneGuidance: "Keep the right side direct.",
  ventGuidance: "Bottom vent one finger, top vent quarter open.",
  prepNotes: "Dry brine overnight.",
  phases: [
    {
      title: "Prepare",
      technique: "Fire building",
      transitionGuidance: "Wait for clean smoke.",
      steps: [
        { title: "Light", instructions: "Light one starter.", durationMinutes: 20 },
        { title: "Settle", instructions: "Settle the dome.", durationMinutes: 25 },
      ],
    },
    {
      title: "Cook",
      technique: "Indirect roast",
      transitionGuidance: "Remove the deflector for the finish.",
      steps: [
        { title: "Roast", instructions: "Roast indirectly.", durationMinutes: 45 },
        { title: "Sear", instructions: "Sear over direct heat.", durationMinutes: 8 },
      ],
    },
  ],
};

describe("cooking-session repository", () => {
  test("creates and retrieves a complete aggregate in explicit nested order", () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      const repository = createSessionRepository(persistence);
      const created = repository.create(draft);

      expect(created).toMatchObject({
        ...draft,
        status: "draft",
        phases: [
          {
            ...draft.phases[0],
            steps: [draft.phases[0].steps[0], draft.phases[0].steps[1]],
          },
          {
            ...draft.phases[1],
            steps: [draft.phases[1].steps[0], draft.phases[1].steps[1]],
          },
        ],
      });
      expect(created.id).toBeString();
      expect(created.createdAt).toBe(created.updatedAt);
      expect(created.phases.every((phase) => phase.id.length > 0)).toBe(true);
      expect(created.phases.flatMap((phase) => phase.steps).every((step) => step.id.length > 0)).toBe(true);
      expect(repository.get(created.id)).toEqual(created);
    } finally {
      fixture.cleanup();
    }
  });

  test("fully replaces and reorders children with fresh nested identities", () => {
    const fixture = createTemporaryPersistence();

    try {
      const repository = createSessionRepository(fixture.bootstrap());
      const created = repository.create(draft);
      const replacement = structuredClone(draft);
      replacement.title = "Updated cook";
      replacement.phases.reverse();
      replacement.phases.forEach((phase) => {
        phase.steps.reverse();
      });
      replacement.phases[0]?.steps.pop();
      replacement.phases[0]?.steps.push({
        title: "Rest",
        instructions: "Rest before slicing.",
        durationMinutes: 10,
      });
      delete replacement.plannedFoodTargetF;

      const updated = repository.update(created.id, replacement);

      expect(updated).toMatchObject(replacement);
      expect(updated?.id).toBe(created.id);
      expect(updated?.createdAt).toBe(created.createdAt);
      expect(updated?.updatedAt).not.toBe(created.updatedAt);
      expect(updated).not.toHaveProperty("plannedFoodTargetF");
      expect(updated?.phases.map((phase) => phase.title)).toEqual(["Cook", "Prepare"]);
      expect(updated?.phases[0]?.steps.map((step) => step.title)).toEqual(["Sear", "Rest"]);
      expect(updated?.phases.map((phase) => phase.id)).not.toEqual(created.phases.map((phase) => phase.id));
    } finally {
      fixture.cleanup();
    }
  });

  test("lists complete aggregates deterministically by update time and ID", () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      const repository = createSessionRepository(persistence);
      const first = repository.create({ ...draft, title: "First" });
      const second = repository.create({ ...draft, title: "Second" });
      persistence.database.run("UPDATE cooking_sessions SET updated_at = ?", ["2026-08-01T00:00:00.000Z"]);

      expect(repository.list().map((session) => session.id)).toEqual([first.id, second.id].sort());
      expect(repository.list().every((session) => session.phases.length === 2)).toBe(true);
    } finally {
      fixture.cleanup();
    }
  });

  test("rolls back a failed nested replacement and rethrows the persistence error", () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      const repository = createSessionRepository(persistence);
      const created = repository.create(draft);
      persistence.database.run(`
        CREATE TRIGGER reject_failed_step
        BEFORE INSERT ON cooking_session_steps
        WHEN NEW.title = 'Fail'
        BEGIN
          SELECT RAISE(ABORT, 'injected nested failure');
        END
      `);
      const replacement: SessionWrite = {
        ...draft,
        phases: [{ ...draft.phases[0], steps: [{ ...draft.phases[0].steps[0], title: "Fail" }] }],
      };

      expect(() => repository.update(created.id, replacement)).toThrow(/injected nested failure/);
      expect(repository.get(created.id)).toEqual(created);
    } finally {
      fixture.cleanup();
    }
  });

  test("deletes the aggregate with cascading children and reports unknown IDs", () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      const repository = createSessionRepository(persistence);
      const created = repository.create(draft);

      expect(repository.delete(created.id)).toBe(true);
      expect(repository.delete(created.id)).toBe(false);
      expect(repository.get(created.id)).toBeUndefined();
      expect(repository.list()).toEqual([]);
      expect(
        persistence.database.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM cooking_session_phases").get(),
      ).toEqual({ count: 0 });
      expect(
        persistence.database.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM cooking_session_steps").get(),
      ).toEqual({ count: 0 });
    } finally {
      fixture.cleanup();
    }
  });
});
