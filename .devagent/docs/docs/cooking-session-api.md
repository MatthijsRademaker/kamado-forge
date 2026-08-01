# Cooking and Live-Cook APIs

The Bun API exposes two durable, single-owner boundaries: complete planning drafts at `/api/sessions` and minimal live-cook drafts/session commands at `/api/drafts` and `/api/live-session`. The current Vue Plan, Today, and Live screens remain fixture-driven and do not call either boundary.

## Planning drafts

`backend/src/session-contract.ts` defines the strict aggregate persisted by `backend/src/persistence/session-repository.ts`. The executable registry in `backend/src/contract.ts` exposes:

| Method | Path | Behavior |
| --- | --- | --- |
| `POST` | `/api/sessions` | Create a complete draft and return `201` |
| `GET` | `/api/sessions` | List drafts by update time descending, then ID |
| `GET` | `/api/sessions/{sessionId}` | Retrieve one complete draft |
| `PUT` | `/api/sessions/{sessionId}` | Atomically replace a complete draft |
| `DELETE` | `/api/sessions/{sessionId}` | Delete the aggregate and nested rows with `204` |

The planning API owns session, phase, and step identities. Its write shape requires complete ordered phases and steps, real `YYYY-MM-DD` cooking dates, integer minute durations, and planned Fahrenheit guidance. Successes use `{ "data": ... }`; an unknown well-formed session ID returns `SESSION_NOT_FOUND` in the shared error envelope.

## Live-cook sessions

`backend/src/live-cook-contract.ts` defines a separate minimal ordered-step draft. `POST /api/drafts` creates that draft, `POST /api/drafts/{draftId}/activate` snapshots it once, and `GET /api/live-session` reads the sole `ACTIVE` or `PAUSED` session. The live-session commands are `advance`, `return`, `pause`, `resume`, `complete`, and `cancel` under `/api/live-session`.

The live projection includes deterministic execution history, the active current step, and the immediate next step. At terminal completion or cancellation, `currentStep` and `nextStep` are both `null`; subsequent active-session reads return `404 NOT_FOUND` while durable history remains available.

## Persistence and generated contract

Migration `0002` owns normalized planning session, phase, and step tables. Migration `0003` owns live-cook drafts, immutable session-step snapshots, transitions, visits, notes, and the single `ACTIVE`/`PAUSED` session index. Migration `0004` adds integer-duration guards for existing live-cook step tables; activation independently revalidates persisted draft rows before creating a snapshot.

`backend/src/openapi.ts` generates `backend/openapi/openapi.json`, and Hey API generates `frontend/src/api/generated/`. Generated artifacts are read-only: change the executable schemas and route registry, run `bun run generate:api`, and use `bun run check:api` to detect drift.

## Verification

Planning contract, repository, and dispatcher coverage lives in `backend/src/session-contract.test.ts`, `backend/src/persistence/session-repository.test.ts`, and `backend/src/dispatcher.test.ts`. Live-cook transition, rollback, restart, migration, and response-validation coverage lives in `backend/src/live-cook-*.test.ts` and `backend/src/persistence/live-cook-migration.test.ts`.

## Related pages

- [Local Plan Page](./local-plan.md) — fixture-only Plan behavior and its generated local model.
- [Local Today and Live Cook](./local-live-cook.md) — fixture-only live walkthrough behavior.
- [Tech Stack](./tech-stack.md) — backend, SQLite, generated-client, and verification ownership.
