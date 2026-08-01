import { describe, expect, test } from "bun:test";
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
});
