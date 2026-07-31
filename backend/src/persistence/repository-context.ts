import type { Database } from "bun:sqlite";

export interface PersistenceContext {
  readonly database: Database;
  transaction<T>(work: () => T): T;
  close(): void;
}

export function createPersistenceContext(database: Database): PersistenceContext {
  return {
    database,
    transaction<T>(work: () => T): T {
      return database.transaction(work)();
    },
    close() {
      database.close();
    },
  };
}
