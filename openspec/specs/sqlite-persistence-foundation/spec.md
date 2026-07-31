# sqlite-persistence-foundation Specification

## Purpose
TBD - created by archiving change task-908aaab3-33f4-4f79-938b-cab40ae1cf41. Update Purpose after archive.
## Requirements
### Requirement: Configured SQLite persistence bootstrap

The backend SHALL initialize SQLite through a dedicated persistence bootstrap before serving HTTP. The bootstrap MUST create the configured database path's parent directory, open the configured `DATABASE_PATH` with `bun:sqlite`, retain WAL configuration, enable and verify `PRAGMA foreign_keys = ON` before any migration or repository operation, run migrations, and expose an explicit close lifecycle.

#### Scenario: Bootstrap prepares a configured database connection

- **WHEN** the application bootstraps a fresh configured SQLite database
- **THEN** the parent directory and database are prepared, foreign-key enforcement is enabled on that connection before migrations run, WAL behavior is configured, and the shipped migrations are applied

#### Scenario: Bootstrap failure prevents startup

- **WHEN** persistence bootstrap encounters a migration failure
- **THEN** it closes the opened database handle, propagates the error, and the HTTP server does not begin serving requests

### Requirement: HTTP entrypoint delegates persistence setup

The HTTP entrypoint SHALL compose the dedicated persistence bootstrap before `Bun.serve` and MUST NOT contain SQLite connection setup, migration execution, or `app_metadata` DDL. The existing health endpoint contract SHALL continue to report successful service health against the configured database path.

#### Scenario: HTTP startup uses the persistence boundary

- **WHEN** the backend starts successfully
- **THEN** persistence has already been bootstrapped through the dedicated boundary and `GET /api/health` retains its successful response behavior

### Requirement: Deterministic migration registry and durable history

The persistence layer SHALL maintain an immutable shipped migration registry whose entries use canonical zero-padded numeric identifiers and descriptive names. Before mutating the database, the migration runner MUST validate canonical identifier formatting, unique identifiers, and strictly increasing numeric order. The runner MUST maintain a durable runner-owned migration-history table that records the version and name of each successfully applied migration.

#### Scenario: A fresh database receives ordered migration history

- **WHEN** a fresh database is bootstrapped with the shipped registry
- **THEN** every shipped migration is applied in numeric order and exactly one corresponding ordered version/name history row is durable

#### Scenario: Invalid migration identity is rejected before mutation

- **WHEN** the supplied migration registry has a malformed, duplicate, or out-of-order identifier
- **THEN** bootstrap fails before applying migration work or writing new migration-history rows

### Requirement: Applied-history compatibility validation

The migration runner SHALL require applied migration-history rows to match an ordered prefix of the shipped migration registry. It MUST fail loudly before applying further migrations when an applied identifier is unknown, its recorded name differs from the shipped name, or the applied history is not an ordered prefix.

#### Scenario: Unknown or renamed applied migration is detected

- **WHEN** a database contains a migration-history row that is absent from the shipped registry or has a different recorded name
- **THEN** bootstrap reports a compatibility error and applies no additional migration

### Requirement: Per-migration atomic execution

Each pending migration SHALL execute its schema or data work and insertion of its migration-history row in the same SQLite transaction. If a pending migration throws, bootstrap MUST fail loudly, roll back that migration's effects and its history row, and retain effects and history from earlier successfully committed migrations.

#### Scenario: A controlled pending migration fails atomically

- **WHEN** a focused test injects a pending migration at the persistence runner boundary that changes schema or data and then throws
- **THEN** bootstrap fails, the injected migration's schema or data effect and history row are absent, and earlier committed migrations remain present

### Requirement: Legacy `app_metadata` preservation

The initial numbered migration SHALL create the existing `app_metadata` table idempotently. It MUST preserve all existing rows in a compatible database that contains `app_metadata` but no migration history, without deleting, overwriting, transforming, or otherwise altering those rows.

#### Scenario: A pre-ledger database is adopted safely

- **WHEN** bootstrap runs against a compatible database with pre-existing `app_metadata` values and no migration-history rows
- **THEN** the initial migration is recorded and the pre-existing metadata values remain unchanged

### Requirement: Narrow repository transaction boundary

The persistence layer SHALL expose a narrow repository context over an already configured connection. Its shared transaction helper MUST commit and return successful work, roll back and rethrow thrown work, and prevent repositories from hand-rolling connection setup or transaction control. The boundary MUST NOT introduce an `app_metadata`-specific or product-domain repository in this change.

#### Scenario: Repository transaction work succeeds or rolls back

- **WHEN** repository-context work completes successfully or throws from the shared transaction helper
- **THEN** successful changes are committed and returned, while thrown changes are absent after rollback and the error is rethrown

### Requirement: Isolated persistence test database support

The backend SHALL provide reusable test database support that creates a unique temporary on-disk SQLite file, bootstraps it through the production persistence entrypoint, and never uses or modifies the application `DATABASE_PATH`. Cleanup MUST close the database before removing the database file and any WAL or SHM sidecars.

#### Scenario: A persistence test is isolated and cleaned up

- **WHEN** a backend persistence test completes, including after a failed bootstrap
- **THEN** its unique temporary database is closed and removed with its sidecars and the application database path is untouched

### Requirement: Scoped schema, documentation, and verification coverage

The shipped migration registry SHALL add only migration infrastructure and `app_metadata` in this change and MUST NOT create cooking-session, chat, learning, logbook, memory, or other product-domain tables. Applicable project verification configuration MUST include new backend persistence source and tests in format, lint, typecheck, dead-code, test, and build lanes. The LikeC4 storage description and affected tech-stack prose SHALL describe migration infrastructure alongside `app_metadata` without adding a migration-runner implementation component or future product schema.

#### Scenario: Project artifacts describe and verify the persistence foundation

- **WHEN** the changed project is documented and its applicable quality commands run
- **THEN** storage documentation distinguishes internal migration infrastructure from `app_metadata`, no product-domain schema is introduced, and the new backend persistence files are discovered by the relevant verification lanes
