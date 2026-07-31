import type { Database } from "bun:sqlite";
import { type Migration, validateMigrationRegistry } from "./migrations";

interface AppliedMigration {
  readonly sequence: number;
  readonly version: string;
  readonly name: string;
}

export function runMigrations(database: Database, migrations: readonly Migration[]): void {
  validateMigrationRegistry(migrations);
  createMigrationHistory(database);

  const appliedMigrations = readAppliedMigrations(database);
  validateAppliedHistory(appliedMigrations, migrations);

  for (let index = appliedMigrations.length; index < migrations.length; index += 1) {
    const migration = migrations[index];

    database.transaction(() => {
      migration.apply(database);
      database.run("INSERT INTO _persistence_migrations (sequence, version, name) VALUES (?, ?, ?)", [
        index + 1,
        migration.version,
        migration.name,
      ]);
    })();
  }
}

function createMigrationHistory(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS _persistence_migrations (
      sequence INTEGER PRIMARY KEY,
      version TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    )
  `);
}

function readAppliedMigrations(database: Database): AppliedMigration[] {
  return database
    .query<AppliedMigration, []>("SELECT sequence, version, name FROM _persistence_migrations ORDER BY sequence ASC")
    .all();
}

function validateAppliedHistory(
  appliedMigrations: readonly AppliedMigration[],
  migrations: readonly Migration[],
): void {
  for (const [index, appliedMigration] of appliedMigrations.entries()) {
    const expectedMigration = migrations[index];

    if (appliedMigration.sequence !== index + 1) {
      throw new Error(`Applied migration history has an invalid sequence: ${appliedMigration.sequence}`);
    }

    if (!expectedMigration) {
      throw new Error(`Applied migration is not shipped: ${appliedMigration.version}`);
    }

    if (appliedMigration.version !== expectedMigration.version) {
      throw new Error(`Applied migrations are not an ordered prefix: ${appliedMigration.version}`);
    }

    if (appliedMigration.name !== expectedMigration.name) {
      throw new Error(`Applied migration name no longer matches: ${appliedMigration.version}`);
    }
  }
}
