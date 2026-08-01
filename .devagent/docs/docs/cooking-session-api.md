# Durable Cooking-Session API

The Bun API joins complete planning drafts to one durable live-cook lifecycle. Plan, Today, and Live consume this boundary through the generated client and `frontend/src/api/sessions.ts`; browser code does not invent transitions or transport DTOs.

## Executable boundary

`backend/src/session-contract.ts` owns the complete ordered planning aggregate. `backend/src/live-cook-contract.ts` owns activation, active and ID-addressed projections, current-step notes, and transitions.

| Method | Path | Behavior |
| --- | --- | --- |
| `POST` | `/api/sessions` | Create a complete draft |
| `GET` | `/api/sessions` | List complete drafts deterministically |
| `GET` | `/api/sessions/eligible` | List drafts that have never been activated |
| `GET`, `PUT`, `DELETE` | `/api/sessions/{sessionId}` | Read, replace, or delete one draft |
| `POST` | `/api/sessions/{sessionId}/activate` | Snapshot the persisted plan and start it atomically |
| `GET` | `/api/live-sessions/active` | Return the active session or explicit `204` absence |
| `GET` | `/api/live-sessions/{sessionId}` | Read active, paused, completed, or cancelled detail |
| `POST` | `/api/live-sessions/{sessionId}/notes` | Persist a note on the current execution visit |
| `POST` | `/api/live-sessions/{sessionId}/{action}` | `advance`, `return`, `pause`, `resume`, `complete`, or `cancel` |

The planning API owns session, phase, and step identities. Callers submit complete ordered replacements; SQLite transactions preserve the previous aggregate if replacement fails. Draft lists exclude activated plans, and replace or delete rejects an activated ID so the plan embedded in live and terminal detail cannot drift. Activation retains the planning session ID as the live and terminal route identity; a repeated activation returns a structured `INVALID_DRAFT` conflict instead of leaking a SQLite constraint error.

## Live projection and absence

A live projection always contains the complete persisted plan, status, activation and projection timestamps, server-derived progress, and execution history with pause-aware elapsed seconds and notes. `ACTIVE` and `PAUSED` projections expose current and next steps. `COMPLETED` and `CANCELLED` projections retain final history and progress while current and next steps are `null`.

No active session is ordinary absence, not an error: `/api/live-sessions/active` returns `204`. Unknown IDs and rejected transitions use the shared structured error envelope, allowing Today and Live to distinguish absence, validation, conflict, and transport failure.

## Frontend cache boundary

`frontend/src/api/sessions.ts` is the only production session-domain transport boundary. It defines parameterized list, draft/live detail, active, and eligible queries and keys. Successful mutations reconcile their complete response before asynchronously invalidating and refetching every declared key. A later refresh failure remains visible on the affected query but cannot turn a committed mutation into a rejection. Rejected actions retain visible state and trigger the same non-masking refresh when server state may have changed.

Plan alone owns a local editable buffer. `frontend/src/features/plan/draft.ts` converts confirmed server aggregates into form state and strips local keys before a complete create or update.

## Persistence and generation

Migrations `0002` through `0004` create normalized planning data, live snapshots, transitions, visits, notes, integer guards, and the unique `ACTIVE`/`PAUSED` index. `backend/src/openapi.ts` generates `backend/openapi/openapi.json`; Hey API generates `frontend/src/api/generated/`. Never edit generated files by hand.

```bash
bun run generate:api
bun run check:api
```

## Verification

- `backend/src/durable-session-workflow.test.ts` proves activation, explicit no-active semantics, eligible filtering, notes, ID-addressed commands, completion, and terminal detail.
- `frontend/src/api/sessions.test.ts` proves typed queries/errors and the mutation reconciliation matrix.
- `e2e/session-flow.spec.ts` proves the durable browser journey against an isolated real SQLite-backed API.

## Related pages

- [Durable Plan Page](./local-plan.md) — local editing and confirmed persistence.
- [Today and Live Cook](./local-live-cook.md) — active-first selection and live execution.
- [Compose Development](./compose-development.md) — isolated full-stack browser verification.
- [Architecture Diagrams](./architecture.mdx) — current component and data-flow boundaries.
