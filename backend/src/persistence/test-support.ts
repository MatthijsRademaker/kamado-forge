import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bootstrapPersistence, type BootstrapPersistenceOptions, type PersistenceContext } from "./bootstrap";

interface TemporaryPersistence {
  readonly databasePath: string;
  bootstrap(options?: Omit<BootstrapPersistenceOptions, "databasePath">): PersistenceContext;
  cleanup(): void;
}

export function createTemporaryPersistence(): TemporaryPersistence {
  const directory = mkdtempSync(join(tmpdir(), "kamado-persistence-"));
  const databasePath = join(directory, "app.sqlite");
  const contexts = new Set<PersistenceContext>();

  return {
    databasePath,
    bootstrap(options = {}) {
      const context = bootstrapPersistence({ databasePath, ...options });
      contexts.add(context);
      return context;
    },
    cleanup() {
      for (const context of contexts) {
        context.close();
      }
      rmSync(directory, { force: true, recursive: true });
    },
  };
}
