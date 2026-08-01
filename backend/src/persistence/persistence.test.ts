import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { type Migration, shippedMigrations } from "./bootstrap";
import { createTemporaryPersistence } from "./test-support";

interface AppliedMigrationFixture {
  readonly sequence: number;
  readonly version: string;
  readonly name: string;
}

function writeAppliedHistory(databasePath: string, migrations: readonly AppliedMigrationFixture[]): void {
  const database = new Database(databasePath);

  try {
    database.run(`
      CREATE TABLE _persistence_migrations (
        sequence INTEGER PRIMARY KEY,
        version TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL
      )
    `);

    for (const migration of migrations) {
      database.run("INSERT INTO _persistence_migrations (sequence, version, name) VALUES (?, ?, ?)", [
        migration.sequence,
        migration.version,
        migration.name,
      ]);
    }
  } finally {
    database.close();
  }
}

describe("SQLite persistence bootstrap", () => {
  test("prepares an on-disk database with configured foreign keys and ordered migration history", () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      const foreignKeys = persistence.database.query<{ foreign_keys: number }, []>("PRAGMA foreign_keys").get();
      const appliedMigrations = persistence.database
        .query<{ version: string; name: string }, []>(
          "SELECT version, name FROM _persistence_migrations ORDER BY sequence ASC",
        )
        .all();

      expect(foreignKeys).toEqual({ foreign_keys: 1 });
      expect(appliedMigrations).toEqual(shippedMigrations.map(({ version, name }) => ({ version, name })));
    } finally {
      fixture.cleanup();
    }
  });

  test("commits transaction work and rolls back and rethrows failed work", () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      persistence.database.run("CREATE TABLE transaction_records (value TEXT NOT NULL)");

      const result = persistence.transaction(() => {
        persistence.database.run("INSERT INTO transaction_records (value) VALUES (?)", ["committed"]);
        return "saved";
      });
      const rollbackError = new Error("rollback requested");

      expect(result).toBe("saved");
      expect(() =>
        persistence.transaction(() => {
          persistence.database.run("INSERT INTO transaction_records (value) VALUES (?)", ["rolled back"]);
          throw rollbackError;
        }),
      ).toThrow(rollbackError);
      expect(persistence.database.query<{ value: string }, []>("SELECT value FROM transaction_records").all()).toEqual([
        { value: "committed" },
      ]);
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects a registry whose migration name is not descriptive before creating history", () => {
    const fixture = createTemporaryPersistence();
    const malformedRegistry: readonly Migration[] = [
      {
        version: "0001",
        name: "1234",
        apply() {},
      },
    ];

    try {
      expect(() => fixture.bootstrap({ migrations: malformedRegistry })).toThrow(/descriptive/);

      const inspection = new Database(fixture.databasePath);
      try {
        expect(
          inspection
            .query<{ name: string }, [string]>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
            .get("_persistence_migrations"),
        ).toBeNull();
      } finally {
        inspection.close();
      }
    } finally {
      fixture.cleanup();
    }
  });

  test("cleanup closes and removes the database with WAL sidecars", () => {
    const fixture = createTemporaryPersistence();
    fixture.bootstrap();

    fixture.cleanup();

    expect(existsSync(fixture.databasePath)).toBe(false);
    expect(existsSync(`${fixture.databasePath}-wal`)).toBe(false);
    expect(existsSync(`${fixture.databasePath}-shm`)).toBe(false);
  });

  test("rejects malformed, duplicate, and out-of-order registry identities before migration work", () => {
    const invalidRegistries: ReadonlyArray<{ readonly migrations: readonly Migration[]; readonly reason: string }> = [
      {
        reason: "malformed version",
        migrations: [{ version: "1", name: "create_metadata", apply() {} }],
      },
      {
        reason: "duplicate version",
        migrations: [
          { version: "0001", name: "create_metadata", apply() {} },
          { version: "0001", name: "add_metadata", apply() {} },
        ],
      },
      {
        reason: "out-of-order version",
        migrations: [
          { version: "0002", name: "create_metadata", apply() {} },
          { version: "0001", name: "add_metadata", apply() {} },
        ],
      },
    ];

    for (const { migrations, reason } of invalidRegistries) {
      const fixture = createTemporaryPersistence();

      try {
        expect(() => fixture.bootstrap({ migrations }), reason).toThrow();

        const inspection = new Database(fixture.databasePath);
        try {
          expect(
            inspection
              .query<{ name: string }, [string]>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
              .get("_persistence_migrations"),
          ).toBeNull();
        } finally {
          inspection.close();
        }
      } finally {
        fixture.cleanup();
      }
    }
  });

  test("rejects unknown, renamed, and non-prefix history before running a pending migration", () => {
    const pendingMigration: Migration = {
      version: "0004",
      name: "create_pending_marker",
      apply(database) {
        database.run("CREATE TABLE pending_marker (value TEXT NOT NULL)");
      },
    };
    const migrations = [...shippedMigrations, pendingMigration];
    const incompatibleHistories: ReadonlyArray<{
      readonly history: readonly AppliedMigrationFixture[];
      readonly reason: string;
    }> = [
      {
        reason: "unknown migration",
        history: [{ sequence: 1, version: "9999", name: "unknown_migration" }],
      },
      {
        reason: "renamed migration",
        history: [{ sequence: 1, version: "0001", name: "renamed_metadata" }],
      },
      {
        reason: "non-prefix history",
        history: [{ sequence: 1, version: "0003", name: "create_pending_marker" }],
      },
    ];

    for (const { history, reason } of incompatibleHistories) {
      const fixture = createTemporaryPersistence();

      try {
        writeAppliedHistory(fixture.databasePath, history);
        expect(() => fixture.bootstrap({ migrations }), reason).toThrow();

        const inspection = new Database(fixture.databasePath);
        try {
          expect(
            inspection
              .query<{ name: string }, [string]>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
              .get("pending_marker"),
          ).toBeNull();
        } finally {
          inspection.close();
        }
      } finally {
        fixture.cleanup();
      }
    }
  });

  test("runs each pending migration atomically with its history record", () => {
    const fixture = createTemporaryPersistence();
    const migrationFailure = new Error("migration failed");
    const failingMigration: Migration = {
      version: "0004",
      name: "create_failed_marker",
      apply(database) {
        database.run("CREATE TABLE failed_marker (value TEXT NOT NULL)");
        database.run("INSERT INTO failed_marker (value) VALUES (?)", ["transient"]);
        throw migrationFailure;
      },
    };

    try {
      expect(() => fixture.bootstrap({ migrations: [...shippedMigrations, failingMigration] })).toThrow(
        migrationFailure,
      );

      const persistence = fixture.bootstrap();
      expect(
        persistence.database
          .query<{ name: string }, [string]>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
          .get("failed_marker"),
      ).toBeNull();
      expect(
        persistence.database
          .query<{ version: string; name: string }, []>(
            "SELECT version, name FROM _persistence_migrations ORDER BY sequence ASC",
          )
          .all(),
      ).toEqual(shippedMigrations.map(({ version, name }) => ({ version, name })));
    } finally {
      fixture.cleanup();
    }
  });

  test("applies the session migration to an existing compatible database", () => {
    const fixture = createTemporaryPersistence();
    writeAppliedHistory(fixture.databasePath, [{ sequence: 1, version: "0001", name: "create_app_metadata" }]);
    const existing = new Database(fixture.databasePath);

    try {
      existing.run(`
        CREATE TABLE app_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      existing.run("INSERT INTO app_metadata (key, value) VALUES (?, ?)", ["existing", "preserved"]);
    } finally {
      existing.close();
    }

    try {
      const persistence = fixture.bootstrap();

      expect(
        persistence.database
          .query<{ version: string }, []>("SELECT version FROM _persistence_migrations ORDER BY sequence")
          .all(),
      ).toEqual([{ version: "0001" }, { version: "0002" }, { version: "0003" }]);
      expect(
        persistence.database
          .query<{ value: string }, [string]>("SELECT value FROM app_metadata WHERE key = ?")
          .get("existing"),
      ).toEqual({ value: "preserved" });
      expect(
        persistence.database
          .query<{ name: string }, [string]>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
          .get("cooking_sessions"),
      ).toEqual({ name: "cooking_sessions" });
    } finally {
      fixture.cleanup();
    }
  });

  test("repeats bootstrap idempotently and preserves pre-ledger metadata rows", () => {
    const fixture = createTemporaryPersistence();
    const legacy = new Database(fixture.databasePath);

    try {
      legacy.run(`
        CREATE TABLE app_metadata (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      legacy.run("INSERT INTO app_metadata (key, value) VALUES (?, ?)", ["legacy_key", "legacy_value"]);
    } finally {
      legacy.close();
    }

    try {
      const firstBootstrap = fixture.bootstrap();
      const repeatedBootstrap = fixture.bootstrap();

      expect(
        firstBootstrap.database
          .query<{ value: string }, [string]>("SELECT value FROM app_metadata WHERE key = ?")
          .get("legacy_key"),
      ).toEqual({
        value: "legacy_value",
      });
      expect(
        repeatedBootstrap.database
          .query<{ version: string; name: string }, []>(
            "SELECT version, name FROM _persistence_migrations ORDER BY sequence ASC",
          )
          .all(),
      ).toEqual(shippedMigrations.map(({ version, name }) => ({ version, name })));
    } finally {
      fixture.cleanup();
    }
  });

  test("rejects actual foreign-key violations on the configured connection", () => {
    const fixture = createTemporaryPersistence();

    try {
      const persistence = fixture.bootstrap();
      persistence.database.run("CREATE TABLE parent_records (id INTEGER PRIMARY KEY)");
      persistence.database.run(`
        CREATE TABLE child_records (
          id INTEGER PRIMARY KEY,
          parent_id INTEGER NOT NULL REFERENCES parent_records(id)
        )
      `);

      expect(() =>
        persistence.database.run("INSERT INTO child_records (id, parent_id) VALUES (?, ?)", [1, 999]),
      ).toThrow();
    } finally {
      fixture.cleanup();
    }
  });
});
