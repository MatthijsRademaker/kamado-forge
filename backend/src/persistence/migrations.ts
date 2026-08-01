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

const createCookingSessions: Migration = Object.freeze({
  version: "0002",
  name: "create_cooking_sessions",
  apply(database: Database) {
    database.run(`
      CREATE TABLE cooking_sessions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        cooking_date TEXT NOT NULL,
        dome_min_f INTEGER NOT NULL CHECK (dome_min_f BETWEEN 150 AND 700),
        dome_max_f INTEGER NOT NULL CHECK (dome_max_f BETWEEN 150 AND 700 AND dome_min_f <= dome_max_f),
        food_target_f INTEGER CHECK (food_target_f BETWEEN 32 AND 212),
        setup_guidance TEXT NOT NULL,
        deflector_guidance TEXT NOT NULL,
        heat_zone_guidance TEXT NOT NULL,
        vent_guidance TEXT NOT NULL,
        prep_notes TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status = 'draft'),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE cooking_session_phases (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES cooking_sessions(id) ON DELETE CASCADE,
        ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
        title TEXT NOT NULL,
        technique TEXT NOT NULL,
        transition_guidance TEXT NOT NULL,
        UNIQUE (session_id, ordinal)
      );

      CREATE TABLE cooking_session_steps (
        id TEXT PRIMARY KEY,
        phase_id TEXT NOT NULL REFERENCES cooking_session_phases(id) ON DELETE CASCADE,
        ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
        title TEXT NOT NULL,
        instructions TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 1440),
        UNIQUE (phase_id, ordinal)
      );
    `);
  },
});

const createLiveCookSessions: Migration = Object.freeze({
  version: "0003",
  name: "create_live_cook_sessions",
  apply(database: Database) {
    database.run(`
      CREATE TABLE live_cook_drafts (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        activated_at TEXT
      );

      CREATE TABLE live_cook_draft_steps (
        id TEXT PRIMARY KEY,
        draft_id TEXT NOT NULL REFERENCES live_cook_drafts(id) ON DELETE CASCADE,
        ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
        title TEXT NOT NULL CHECK (length(trim(title)) > 0),
        instructions TEXT NOT NULL CHECK (length(trim(instructions)) > 0),
        duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 1440),
        UNIQUE (draft_id, ordinal)
      );

      CREATE TABLE live_cook_sessions (
        id TEXT PRIMARY KEY,
        draft_id TEXT NOT NULL UNIQUE REFERENCES live_cook_drafts(id) ON DELETE RESTRICT,
        status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
        current_step_id TEXT REFERENCES live_cook_session_steps(id) ON DELETE RESTRICT,
        activated_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE live_cook_session_steps (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES live_cook_sessions(id) ON DELETE CASCADE,
        ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
        title TEXT NOT NULL CHECK (length(trim(title)) > 0),
        instructions TEXT NOT NULL CHECK (length(trim(instructions)) > 0),
        duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 1440),
        UNIQUE (session_id, ordinal)
      );

      CREATE TABLE live_cook_transitions (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES live_cook_sessions(id) ON DELETE CASCADE,
        ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
        action TEXT NOT NULL CHECK (action IN ('ACTIVATE', 'PAUSE', 'RESUME', 'ADVANCE', 'RETURN', 'COMPLETE', 'CANCEL')),
        from_status TEXT CHECK (from_status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
        to_status TEXT NOT NULL CHECK (to_status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
        occurred_at TEXT NOT NULL,
        UNIQUE (session_id, ordinal)
      );

      CREATE TABLE live_cook_execution_visits (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES live_cook_sessions(id) ON DELETE CASCADE,
        session_step_id TEXT NOT NULL REFERENCES live_cook_session_steps(id) ON DELETE RESTRICT,
        ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
        actual_started_at TEXT NOT NULL,
        actual_finished_at TEXT,
        cancelled_at TEXT,
        UNIQUE (session_id, ordinal)
      );

      CREATE TABLE live_cook_step_notes (
        id TEXT PRIMARY KEY,
        execution_visit_id TEXT NOT NULL REFERENCES live_cook_execution_visits(id) ON DELETE CASCADE,
        ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
        content TEXT NOT NULL CHECK (length(trim(content)) > 0),
        created_at TEXT NOT NULL,
        UNIQUE (execution_visit_id, ordinal)
      );

      CREATE UNIQUE INDEX one_live_cook_session
      ON live_cook_sessions ((1))
      WHERE status IN ('ACTIVE', 'PAUSED');
    `);
  },
});

export const shippedMigrations: readonly Migration[] = Object.freeze([
  createAppMetadata,
  createCookingSessions,
  createLiveCookSessions,
]);

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
