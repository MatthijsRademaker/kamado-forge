# Live Cook Session API

The Bun API turns a minimal ordered draft into one resumable live cook. It owns command validation and transactional persistence; the existing Vue Today and Live views remain local fixtures and do not call this API.

## API boundary

`backend/src/contract.ts` registers `POST /api/drafts`, `POST /api/drafts/{draftId}/activate`, `GET /api/live-session`, and the live-session commands `advance`, `return`, `pause`, `resume`, `complete`, and `cancel`. All payloads are runtime-validated by `backend/src/dispatcher.ts` and use `{ "data": ... }` successes or the shared `{ "error": { "code", "message", "issues" } }` envelope.

A draft is a non-empty sequence of contiguous, zero-based ordered steps. Activation can happen once: it snapshots those steps, creates the first execution visit, and returns the active projection. The projection exposes the current step and execution, nullable next step, and execution history in deterministic visit/note order.

## Transactional state

`backend/src/persistence/live-cook-repository.ts` captures one UTC clock value per accepted command and commits status, cursor, history, visit, and note effects together. SQLite migration `0003` supplies drafts, immutable snapshot steps, transitions, visits, notes, and the partial unique `one_live_cook_session` index. The index permits at most one `ACTIVE` or `PAUSED` session.

| State | Commands |
| --- | --- |
| `ACTIVE` | pause, advance, return, complete at final step, cancel |
| `PAUSED` | resume, cancel |
| `COMPLETED` / `CANCELLED` | none |

Advance and return close the outgoing visit and create a new visit. Completion closes the final visit. Cancellation records `cancelledAt` without inventing an actual finish. Invalid state or boundary commands return `409 INVALID_TRANSITION`; a second live activation returns `409 ACTIVE_SESSION_CONFLICT`.

## Verification

`backend/src/live-cook-dispatcher.test.ts` and `backend/src/live-cook-state.test.ts` exercise draft, activation, conflict, transitions, history, and terminal query behavior. Generated OpenAPI and the fetch client come from the executable registry via `scripts/generate-api`; `scripts/check-api` detects drift.

## Related pages

- [Local Today and Live Cook](./local-live-cook.md) — current fixture-only frontend boundary.
- [Tech Stack](./tech-stack.md) — API, persistence, and generated-contract ownership.
- [Architecture Diagrams](./architecture.mdx) — system ownership boundaries.
