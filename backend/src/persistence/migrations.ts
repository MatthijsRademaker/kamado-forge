import type { Database } from "bun:sqlite";

export interface Migration {
  readonly version: string;
  readonly name: string;
  readonly apply: (database: Database) => void;
}

const migrationVersionPattern = /^\d{4}$/;

const createAppMetadata: Migration = Object.freeze({
  version: "0001",
  name: "create_app_metadata",
  apply(database: Database) {
    database.run(`
      CREATE TABLE IF NOT EXISTS app_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },
});

export const shippedMigrations: readonly Migration[] = Object.freeze([createAppMetadata]);

export function validateMigrationRegistry(migrations: readonly Migration[]): void {
  const versions = new Set<string>();
  let previousVersion = -1;

  for (const migration of migrations) {
    if (!migrationVersionPattern.test(migration.version)) {
      throw new Error(`Migration version must be a four-digit, zero-padded number: ${migration.version}`);
    }

    if (migration.name.length === 0 || migration.name !== migration.name.trim() || !/[a-z]/i.test(migration.name)) {
      throw new Error(`Migration name must be descriptive: ${migration.version}`);
    }

    if (versions.has(migration.version)) {
      throw new Error(`Migration version is duplicated: ${migration.version}`);
    }

    const numericVersion = Number(migration.version);
    if (numericVersion <= previousVersion) {
      throw new Error(`Migration versions must be strictly increasing: ${migration.version}`);
    }

    versions.add(migration.version);
    previousVersion = numericVersion;
  }
}
