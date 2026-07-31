import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { runMigrations } from "./migration-runner";
import { shippedMigrations, type Migration } from "./migrations";
import { createPersistenceContext, type PersistenceContext } from "./repository-context";

export interface BootstrapPersistenceOptions {
  readonly databasePath: string;
  readonly migrations?: readonly Migration[];
}

export { shippedMigrations, type Migration } from "./migrations";
export type { PersistenceContext } from "./repository-context";

export function bootstrapPersistence({
  databasePath,
  migrations = shippedMigrations,
}: BootstrapPersistenceOptions): PersistenceContext {
  mkdirSync(dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);

  try {
    database.run("PRAGMA journal_mode = WAL");
    database.run("PRAGMA foreign_keys = ON");
    verifyForeignKeysEnabled(database);
    runMigrations(database, migrations);

    return createPersistenceContext(database);
  } catch (error) {
    database.close();
    throw error;
  }
}

function verifyForeignKeysEnabled(database: Database): void {
  const foreignKeys = database.query<{ foreign_keys: number }, []>("PRAGMA foreign_keys").get();

  if (foreignKeys?.foreign_keys !== 1) {
    throw new Error("SQLite foreign-key enforcement could not be enabled");
  }
}
