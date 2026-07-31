# Tasks

## 1. Build the persistence foundation

- [x] 1.1 Create dedicated Bun SQLite persistence modules that prepare the configured database path, open and configure the connection with WAL and `PRAGMA foreign_keys = ON`, verify foreign-key enforcement, run bootstrap migrations, and provide explicit close lifecycle behavior.
- [x] 1.2 Define a narrow repository context that receives the configured connection and a shared transaction helper that commits successful work, rolls back and rethrows thrown work, and does not create a domain repository.
- [x] 1.3 Define the immutable numbered migration registry and validate canonical zero-padded numeric identifiers, descriptive names, uniqueness, and strictly increasing numeric order before database mutation.
- [x] 1.4 Create runner-owned durable migration-history infrastructure and validate that applied version/name records match an ordered prefix of the shipped registry; fail loudly for unknown, renamed, or incompatible applied history.
- [x] 1.5 Add the initial idempotent `app_metadata` migration and run each pending migration with its history insertion in a separate transaction.

## 2. Integrate application startup

- [x] 2.1 Replace direct SQLite setup and `app_metadata` DDL in `backend/src/index.ts` with persistence bootstrap before `Bun.serve` while retaining the health endpoint behavior and configured database-path reporting.
- [x] 2.2 Ensure bootstrap failure closes the connection and prevents the HTTP server from serving.

## 3. Add focused backend persistence tests

- [x] 3.1 Add a reusable test helper that creates a unique temporary on-disk database, bootstraps it through the production persistence entrypoint, and closes and removes the database and WAL/SHM sidecars during cleanup without using `DATABASE_PATH`.
- [x] 3.2 Test fresh bootstrap records all shipped migrations in deterministic order, repeated bootstrap is idempotent, and compatible pre-ledger `app_metadata` rows remain unchanged.
- [x] 3.3 Test malformed, duplicate, or out-of-order migration registry identity and unknown, renamed, or non-prefix applied history fail before further migration work.
- [x] 3.4 Inject a real pending migration at the persistence runner boundary that makes a schema or data change and throws; verify bootstrap fails, that migration's effects and history row are absent, and earlier committed migrations remain.
- [x] 3.5 Test an actual foreign-key violation on a configured persistence connection and test transaction-helper commit and rollback/rethrow behavior through the repository context.

## 4. Update integration artifacts and verify

- [x] 4.1 Update applicable root/backend quality configuration so new persistence source and backend tests participate in format, lint, typecheck, dead-code, test, and build lanes.
- [x] 4.2 Update the LikeC4 SQLite storage description and affected tech-stack prose to describe migration infrastructure alongside `app_metadata` without modeling implementation details or product-domain tables.
- [x] 4.3 Run focused backend persistence tests and `scripts/precommit-run` in the Docker-backed verification environment.
