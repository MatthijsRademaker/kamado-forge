# Establish SQLite Migrations and Repository Foundations

## Why

The Bun API currently opens SQLite and creates `app_metadata` directly in HTTP startup. That approach has no durable schema-history record, no connection-level foreign-key guarantee, no shared transaction or repository boundary, and no isolated persistence fixture for backend tests. A small persistence foundation is required before product tables are added while preserving existing `app_metadata` data.

## What Changes

- Add a dedicated Bun SQLite persistence bootstrap that prepares the configured `DATABASE_PATH`, preserves the current WAL connection behavior, enables foreign keys before persistence work, runs migrations, and exposes an explicit close lifecycle.
- Add an immutable, deterministic registry of numbered migrations and runner-owned durable migration history. Validate registry identity and applied history before applying pending migrations.
- Move idempotent `app_metadata` creation into the initial migration so databases that predate migration history retain compatible existing rows.
- Execute each pending migration and its history record in one transaction; failures stop startup without partial effects for that migration.
- Add a narrow repository context and reusable transaction helper without introducing a domain repository or product schema.
- Replace HTTP-entrypoint DDL with persistence bootstrap composition, add isolated temporary-file persistence tests, include new backend files in applicable verification lanes, and correct SQLite storage documentation.

## Impact

- Affected backend areas are startup composition, persistence modules, and backend tests; the health endpoint remains available against the configured database path.
- SQLite will contain migration infrastructure alongside `app_metadata`; no cooking-session, chat, learning, logbook, memory, or other product-domain schema is added.
- Architecture and tech-stack descriptions must distinguish migration infrastructure from product-domain tables.
- Verification must include focused backend persistence tests and `scripts/precommit-run`.
