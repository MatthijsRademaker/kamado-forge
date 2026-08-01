# Tasks

## 1. Close the public contract gate

- [x] 1.1 Pin canonical create/update/read DTO field names, requiredness, and optional food-target serialization while preserving the approved semantic ownership, complete-draft shape, and server-owned fields.
- [x] 1.2 Pin exact inclusive Fahrenheit bounds and numeric precision for dome endpoints and the optional food target; encode the decisions as shared strict schemas and explicit valid/boundary/invalid test cases before persistence implementation.

## 2. Define the executable session API

- [x] 2.1 Add separate strict write/read aggregate schemas and collection/item route metadata for POST/GET `/sessions` and GET/PUT/DELETE `/sessions/{sessionId}` under the existing `/api` prefix, including exact success envelopes/statuses and opaque server IDs.
- [x] 2.2 Generalize dispatcher validation issue paths for body, path, and query input while preserving deterministic issue ordering and runtime validation of success/error responses.
- [x] 2.3 Add async body/path dispatch, session-specific not-found mapping, 201/204 handling, repository composition, and PUT/DELETE CORS/preflight support without regressing health or generic route/method behavior.

## 3. Persist normalized draft aggregates

- [x] 3.1 Add the next numbered SQLite migration for session, phase, and step tables with every approved field, aggregate audit timestamps, per-parent ordinals, uniqueness/check constraints, foreign keys, and deletion cascades while preserving migration history and `app_metadata`.
- [x] 3.2 Implement a session repository that reconstructs complete aggregates with explicit ordinal ordering and lists full aggregates by `updatedAt` descending then ID ascending.
- [x] 3.3 Implement create, full PUT child-graph replacement/reordering, and delete through the shared transaction helper; preserve session identity/creation time, regenerate nested IDs, update aggregate `updatedAt`, remove stale children, and rethrow failures.

## 4. Prove repository and route behavior

- [x] 4.1 Add isolated fresh/existing-database migration and repository tests for all persisted fields, multiple phase/step orderings, reorder/add/remove replacement, deterministic list order, cascade deletion, and absence of orphans.
- [x] 4.2 Inject a mid-write nested replacement failure and prove the shared transaction retains the complete prior aggregate and rethrows the failure.
- [x] 4.3 Add route tests for create/get/list/update/delete nested round trips, 201/200/204 envelopes, fresh nested replacement IDs, audit behavior, unknown session IDs, deletion followed by not-found, and validation failure preserving prior data.
- [x] 4.4 Cover impossible calendar dates, zero/negative/fractional/over-limit durations, every pinned temperature boundary and invalid class, reversed dome ranges, malformed or empty nested graphs, server-owned/unknown input fields, invalid path input, and deterministic errors.
- [x] 4.5 Retain health, unknown-route, unsupported-method, runtime response-validation, and CORS tests and add PUT/DELETE preflight coverage.

## 5. Synchronize generated and documented artifacts

- [x] 5.1 Regenerate canonical OpenAPI and the generator-owned frontend client from the executable contract; update generated-type fixture/model compile expectations only where required and add no handwritten frontend API integration.
- [x] 5.2 Update relevant project documentation with durable draft ownership, ordered/integer-minute timing, and planned/manual Fahrenheit semantics, and update LikeC4 descriptions so shipped session API/storage are not labeled wholly planned.

## 6. Verify

- [x] 6.1 Run focused backend repository and route tests plus the existing API generation drift check.
- [x] 6.2 Run `scripts/precommit-run` and resolve all applicable format, lint, typecheck, dead-code, test, build, generated-artifact, documentation, and architecture validation failures.
