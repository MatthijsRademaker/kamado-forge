# Tasks

## 1. Add the minimal durable draft and live-session model

- [x] 1.1 Add a forward-only SQLite migration for drafts, uniquely ordered planned steps, immutable activated session-step snapshots, session status/cursor, transition history, append-only execution visits, and append-only step notes with foreign keys.
- [x] 1.2 Implement the minimal contract-backed draft-creation path that rejects an empty or non-ordered step sequence and does not add a planning editor or draft-cancellation feature.
- [x] 1.3 Implement activation as one transaction: verify a valid once-activatable draft, snapshot its steps, create the `ACTIVE` session and first cursor/visit, record the UTC activation timestamp, and return the live projection.
- [x] 1.4 Enforce the single-owner live-slot invariant in SQLite for both `ACTIVE` and `PAUSED` sessions, and map the database conflict to `409 ACTIVE_SESSION_CONFLICT` without partial writes.

## 2. Implement the deterministic state machine and history model

- [x] 2.1 Encode the approved transition table for activate, pause, resume, advance, return, complete, and cancel, including terminal immutability, paused-completion rejection, final-step completion, immediate-predecessor return, and first/final boundary rejections.
- [x] 2.2 Add a testable UTC clock boundary and ensure each accepted command uses one timestamp for its transition, execution-visit, and note effects; do not add a timer or background job.
- [x] 2.3 Implement append-only execution visits and notes so advance/return close the outgoing visit and create a new target visit, completion closes only the final visit, cancellation records cancellation without a fabricated finish, and no prior visit/note is overwritten.
- [x] 2.4 Implement the deterministic active-session projection with status, current step/current execution data, nullable next step, and ordered execution history; return no active session after a terminal outcome while retaining durable history.

## 3. Extend the executable API contract and generated artifacts

- [x] 3.1 Register strict request, success, and shared structured-error schemas for draft creation, activation, active-session query, advance, return, pause, resume, complete, and cancel; keep health and CORS behavior intact.
- [x] 3.2 Implement dispatcher/startup dependencies so every command uses the transactional live-session boundary and validates declared response bodies.
- [x] 3.3 Implement deterministic error mapping: `400 VALIDATION_ERROR`, `404 NOT_FOUND`, `409 INVALID_TRANSITION`, `409 INVALID_DRAFT`, and `409 ACTIVE_SESSION_CONFLICT` for the approved cases.
- [x] 3.4 Regenerate and commit `backend/openapi/openapi.json` and `frontend/src/api/generated/` from the route registry; do not hand-edit generated output.

## 4. Prove transition, atomicity, persistence, and contract behavior

- [x] 4.1 Add transition-table tests for every permitted status/action pair and every prohibited pair, including first/final step boundaries, paused completion, terminal commands, and exact state/timestamp effects.
- [x] 4.2 Add before/after snapshot tests proving invalid input, invalid transitions, missing entities, invalid drafts, and live-slot conflicts leave status, cursor, execution visits, timestamps, notes, and transition history unchanged.
- [x] 4.3 Add repeated-return tests proving each visit and note remains durable, plus close/reopen tests proving active and paused status, cursor, timing, notes, and history are unchanged after restart.
- [x] 4.4 Add contract/dispatcher tests for current/next projection, deterministic structured errors, one-active-session conflict, terminal active-query behavior, and runtime response validation.

## 5. Update integration records and verify

- [x] 5.1 Update the affected architecture/documentation source of truth narrowly for the implemented live-session API, transactional SQLite persistence flow, and single-live-session invariant.
- [x] 5.2 Run focused backend tests, regenerate/check API artifacts, and run `scripts/precommit-run` through the required Docker-backed verification environment.
