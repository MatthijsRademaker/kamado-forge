# Design: SQLite Persistence Foundation

## Context

`backend/src/index.ts` currently creates the database directory, opens `bun:sqlite`, sets WAL mode, and issues `CREATE TABLE IF NOT EXISTS app_metadata` before starting the HTTP server. The application needs deterministic forward-only schema evolution, connection-scoped foreign-key enforcement, a reusable transaction/repository boundary, and isolated on-disk database tests. Existing databases can already contain `app_metadata` but no migration ledger.

## Goals

- Establish one configured SQLite bootstrap path for production and reusable persistence tests.
- Apply immutable numbered migrations deterministically and record successful applications durably.
- Preserve existing compatible `app_metadata` rows during first migration-ledger adoption.
- Make each pending migration atomic with its corresponding history record.
- Provide a closeable, narrow persistence/repository context with shared transaction behavior.
- Prove migration, foreign-key, transaction, isolation, and cleanup behavior with focused backend tests.
- Keep storage documentation and verification coverage accurate.

## Non-Goals

- Product-domain tables or APIs for cooking sessions, chat, learning, logbook, memory, or any other domain.
- An ORM, network database, connection pool, migration service or CLI, or rollback/down-migration workflow.
- Checksums or general schema-drift detection beyond validation of migration version/name identity.
- Changes to CORS, HTTP routing, frontend behavior, or the health endpoint contract beyond startup composition.

## Decisions

### Dedicated bootstrap and persistence context

A dedicated persistence factory is the backend path that creates the configured database parent directory, opens `bun:sqlite`, retains WAL configuration, enables and verifies `PRAGMA foreign_keys = ON` before any migration or repository operation, runs migrations, and returns a closeable repository context. If bootstrap fails, it closes its database handle and rethrows so the HTTP server does not start. `index.ts` remains HTTP composition and delegates persistence setup to this factory.

### Deterministic migration contract

Shipped migrations are a static immutable registry with canonical zero-padded numeric identifiers and descriptive names. The runner validates canonical formatting, uniqueness, and strictly increasing numeric order before mutating the database. Its durable migration-history table is runner-owned infrastructure rather than a numbered product migration, allowing history inspection before numbered migrations run.

Applied history must match an ordered prefix of the shipped registry. Before applying further work, the runner rejects an unknown applied identifier, a recorded name that differs from the shipped migration, malformed/duplicate/out-of-order registry identity, or a non-prefix history. This is a hard compatibility error rather than a silent upgrade against an unknown schema.

### Per-migration atomicity

The runner handles pending migrations in numeric order. Each migration's schema/data work and insertion of its version/name history row execute in one SQLite transaction. A thrown migration error rolls back that migration and its history row, preserves earlier committed migrations, and fails bootstrap loudly. Controlled migration injection is limited to the persistence runner/bootstrap boundary for focused tests; HTTP composition always uses the shipped registry.

### Legacy `app_metadata` compatibility

The first numbered migration creates the existing `app_metadata` table idempotently. It does not delete, overwrite, transform, or otherwise alter rows in a compatible pre-ledger database. Repair of an incompatible legacy table is outside this foundation.

### Repository and transaction boundary

The initial repository boundary is intentionally small: it accepts the already configured persistence context instead of opening or configuring connections, exposes explicit lifecycle ownership, and supplies one transaction helper backed by Bun SQLite transaction semantics. Successful work commits and returns its result; thrown work rolls back and is rethrown. No app-metadata-specific or product-domain repository is introduced.

### Isolated test databases and project integration

Backend tests use unique temporary on-disk SQLite databases, bootstrap through the production persistence path, never use `DATABASE_PATH`, and close handles before removing database files and WAL/SHM sidecars. Focused tests use the runner-boundary injection point to prove failure atomicity. Applicable format, lint, typecheck, dead-code, test, and build configuration must discover the new backend files. The LikeC4 model and tech-stack prose describe internal migration infrastructure alongside `app_metadata` without adding a migration-runner component or future product tables to the product model.

## Risks

- `PRAGMA foreign_keys` is connection-local; enabling it after migrations or only in one creation path would leave another connection unprotected. Configure it immediately after every database open and verify it on the same connection used by persistence work.
- WAL can leave sidecar files and open handles can retain locks. Test cleanup must close before removal, including after failed bootstrap.
- Idempotent creation preserves compatible legacy data but intentionally does not repair an incompatible pre-existing table.
- Version/name history detects unknown or renamed migrations but does not detect manual SQL drift; checksums remain outside the approved scope.

## Traceability

- `task:908aaab3-33f4-4f79-938b-cab40ae1cf41`
- `decision:1-swarm-reviewer-recommendation`
- `decision:1-swarm-architect-recommendation`
- `decision:1-swarm-lead-dev-recommendation`
- `round:1:agent:swarm-reviewer`
- `round:1:agent:swarm-architect`
- `round:1:agent:swarm-lead-dev`
