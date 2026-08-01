# Draft Cooking-Session API

The backend persists complete single-owner cooking-day drafts through `/api/sessions`. The API owns durable session, phase, and step identities while callers own the full editable plan submitted on create or replacement.

## Aggregate boundary

```text
Vue/generated client
        │ JSON under /api/sessions
        ▼
Bun contract dispatcher
        │ validated complete aggregate
        ▼
Session repository transaction
        │ normalized ordered rows
        ▼
SQLite session → phases → steps
```

The central rule is **complete aggregate replacement**. `POST /api/sessions` creates a draft, while `PUT /api/sessions/{sessionId}` atomically replaces all editable values and nested items. PUT preserves the session ID and creation timestamp, generates fresh phase and step IDs, and advances the update timestamp. Failed replacements leave the prior aggregate unchanged.

| Method | Path | Behavior |
| --- | --- | --- |
| `POST` | `/api/sessions` | Create a complete draft and return `201` |
| `GET` | `/api/sessions` | List complete drafts by update time descending, then ID |
| `GET` | `/api/sessions/{sessionId}` | Retrieve one complete draft |
| `PUT` | `/api/sessions/{sessionId}` | Atomically replace and reorder the complete draft |
| `DELETE` | `/api/sessions/{sessionId}` | Delete the draft and nested rows, returning `204` |

JSON successes use `{ "data": ... }`. Unknown well-formed session IDs use the shared error envelope with `SESSION_NOT_FOUND`; malformed path, query, or body input uses deterministic contextual validation issues.

## Planning semantics

`backend/src/session-contract.ts` is the executable write/read contract. A complete draft contains at least one phase and each phase contains at least one step. Array order is authoritative; SQLite ordinals are internal and responses reproduce explicit phase and step order.

Step `durationMinutes` is integral from 1 through 1440. Offsets and totals are derived from ordered durations and are not persisted. `cookingDate` is a real `YYYY-MM-DD` calendar date without time-zone conversion.

Temperatures are manual planned Fahrenheit guidance, never probe readings or telemetry:

- `plannedDomeRange.minF` and `maxF` are integers from 150°F through 700°F, with minimum not exceeding maximum.
- `plannedFoodTargetF` is omitted when absent and otherwise is an integer from 32°F through 212°F.

Setup, deflector, heat-zone, vent, and prep guidance are distinct required session-level fields. Phase technique and transition guidance and step title, instructions, and duration are also required.

## Persistence and generated contracts

Migration `0002` in `backend/src/persistence/migrations.ts` creates normalized `cooking_sessions`, `cooking_session_phases`, and `cooking_session_steps` tables. Foreign-key cascades remove nested rows, and per-parent ordinal uniqueness protects ordering.

`backend/src/openapi.ts` generates the canonical OpenAPI document and the Hey API client under `frontend/src/api/generated/`. The generated client exposes the transport operations, but the current Plan and Today/Live interfaces remain fixture-driven and do not call them.

## Verification

Repository behavior is covered in `backend/src/persistence/session-repository.test.ts`; route and validation behavior is covered in `backend/src/dispatcher.test.ts` and `backend/src/session-contract.test.ts`. Generated drift is checked by `bun run check:api`, and the complete repository gate is `scripts/precommit-run`.

## Related pages

- [Local Plan Page](./local-plan.md) — fixture-driven Plan UI and its separate local `SessionPlan` model.
- [Tech Stack](./tech-stack.md) — backend, SQLite, OpenAPI, and generated-client ownership.
- [Architecture Diagrams](./architecture.mdx) — product containers and API/persistence boundaries.
