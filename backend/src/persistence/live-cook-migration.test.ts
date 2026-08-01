import { describe, expect, test } from "bun:test";
import { shippedMigrations } from "./bootstrap";
import { createTemporaryPersistence } from "./test-support";

describe("live-cook persistence migration", () => {
  test("creates the append-only live-cook tables, foreign keys, and sole-live-session index", () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      const tables = persistence.database
        .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .all()
        .map(({ name }) => name);
      const indexes = persistence.database
        .query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'index' ORDER BY name")
        .all()
        .map(({ name }) => name);

      expect(tables).toEqual(
        expect.arrayContaining([
          "live_cook_drafts",
          "live_cook_draft_steps",
          "live_cook_sessions",
          "live_cook_session_steps",
          "live_cook_transitions",
          "live_cook_execution_visits",
          "live_cook_step_notes",
        ]),
      );
      expect(indexes).toContain("one_live_cook_session");
      expect(
        persistence.database
          .query<{ table: string }, []>("SELECT \"table\" FROM pragma_foreign_key_list('live_cook_step_notes')")
          .all(),
      ).toEqual([{ table: "live_cook_execution_visits" }]);
    } finally {
      fixture.cleanup();
    }
  });

  test("adds integer guards when upgrading existing live-cook tables", () => {
    const fixture = createTemporaryPersistence();

    try {
      const legacy = fixture.bootstrap({
        migrations: shippedMigrations.filter(({ version }) => version !== "0004"),
      });
      legacy.database.run("INSERT INTO live_cook_drafts (id, created_at) VALUES (?, ?)", [
        "draft-id",
        "2026-08-08T12:00:00.000Z",
      ]);
      legacy.database.run(
        `INSERT INTO live_cook_draft_steps
         (id, draft_id, ordinal, title, instructions, duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["draft-step-id", "draft-id", 0, "Light", "Light charcoal.", 20],
      );
      legacy.database.run(
        `INSERT INTO live_cook_sessions
         (id, draft_id, status, current_step_id, activated_at, updated_at)
         VALUES (?, ?, 'COMPLETED', NULL, ?, ?)`,
        ["session-id", "draft-id", "2026-08-08T12:00:00.000Z", "2026-08-08T12:00:00.000Z"],
      );
      legacy.database.run(
        `INSERT INTO live_cook_session_steps
         (id, session_id, ordinal, title, instructions, duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ["session-step-id", "session-id", 0, "Light", "Light charcoal.", 20],
      );
      legacy.close();

      const upgraded = fixture.bootstrap();
      upgraded.database.run("PRAGMA ignore_check_constraints = ON");

      expect(() =>
        upgraded.database.run("UPDATE live_cook_draft_steps SET duration_minutes = ? WHERE id = ?", [
          1.5,
          "draft-step-id",
        ]),
      ).toThrow();
      expect(() =>
        upgraded.database.run("UPDATE live_cook_session_steps SET duration_minutes = ? WHERE id = ?", [
          1.5,
          "session-step-id",
        ]),
      ).toThrow();
      upgraded.database.run("PRAGMA ignore_check_constraints = OFF");
    } finally {
      fixture.cleanup();
    }
  });
});
