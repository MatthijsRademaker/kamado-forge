# Design: Cooking-session draft planning

## Context

The backend currently has a strict health-only Zod route registry, a synchronous dispatcher seam, SQLite migration infrastructure, and a shared repository transaction helper. This change establishes the first product aggregate while preserving those boundaries: the route registry remains executable API truth, the repository owns aggregate persistence, SQLite enforces relational integrity, and generated artifacts follow the registry.

A cooking session is the aggregate root. Its phases and steps have no independent lifecycle in this change, and request array order is the authoritative order. Every public operation is draft-only and implicitly belongs to the one owner.

## Goals

- Persist and round-trip a complete ordered draft cooking day.
- Support complete replacement, addition, removal, and reordering of nested phases and steps atomically.
- Make local planning time and unit-tagged temperature semantics explicit and strictly validated.
- Provide deterministic CRUD behavior, structured validation/resource errors, stable child identity, and server-owned auditing.
- Keep SQLite, the runtime contract, OpenAPI, generated frontend transport, tests, and current documentation synchronized.

## Non-Goals

- Active-step transitions, actual timing, pause/resume, completion, or any live-session state machine.
- LLM generation, coaching, recommendations, or memory enrichment.
- Frontend planner/Today screens or hand-authored frontend data access.
- Probe/controller integrations or live readings.
- A generic recipe catalog, cook outcomes/reporting, sharing, authentication, authorization, tenants, or multi-user ownership.

## Decisions

### Aggregate and fields

`CookingSession` contains an opaque server UUID, non-empty title, valid local `cookingDate`, literal `draft` status, ordered phases, and UTC `createdAt`/`updatedAt`. Each phase has an opaque server UUID, non-empty title, and ordered steps. Each step has an opaque server UUID, non-empty title, local `plannedStartTime`, `durationMinutes`, non-empty free-text `technique`, one unit-tagged dome target range, an optional scalar unit-tagged food target, and optional step-level setup, deflector, heat-zone, vent, and prep guidance. Optional values are omitted rather than materialized as `null`.

The date is lexical `YYYY-MM-DD` plus calendar-validity checking with no timezone conversion. Step time is local 24-hour `HH:mm`. Duration is an integer from 1 through 1440 minutes.

A dome target is `{min, max, unit}` where unit is `F` or `C`, both values are finite, and `min <= max`. Fahrenheit dome values are 100 through 1200; Celsius dome values are 38 through 650. A food target is `{value, unit}` with a finite value from 32 through 212 F or 0 through 100 C. Each target carries its own unit so clients never infer it from text.

### Draft lifecycle and HTTP shape

The executable registry defines:

- `POST /api/sessions` -> HTTP 201 `{data: session}`.
- `GET /api/sessions` -> HTTP 200 `{data: {sessions: summaries[]}}`.
- `GET /api/sessions/{id}` -> HTTP 200 `{data: session}`.
- `PUT /api/sessions/{id}` -> HTTP 200 `{data: session}`.
- `DELETE /api/sessions/{id}` -> HTTP 204 with no body.

Create defaults omitted status to `draft` and rejects any supplied non-draft value. PUT is a complete aggregate replacement and requires the literal `draft`; neither operation can create active or completed state. List summaries contain id, title, cooking date, draft status, audit timestamps, phase count, and step count. The unpaginated single-owner list sorts by cooking date ascending, then updated time descending, then id ascending.

A syntactically valid but unknown session ID returns the shared structured resource 404 for get, update, and delete. An invalid path UUID is a field-specific 400. Unknown DELETE is deliberately non-idempotent at the HTTP result level and returns 404.

### Nesting, order, and child identity

Every draft contains at least one phase and every phase contains at least one step. Clients do not send positions; the repository derives zero-based sibling positions from array order, and storage enforces unique sibling positions.

Create never accepts client-created child identities. On PUT, an existing child UUID may be supplied to retain that child across edits and reordering; a child without an ID is new and receives a server UUID. Omitted children are deleted. Duplicate IDs, IDs unknown to the session, phase IDs owned by another session, step IDs owned by another session, and steps supplied under a different phase are rejected with structured 400 issues.

### Persistence and auditing

Migration `0002` adds `cooking_sessions`, `session_phases`, and `phase_steps`. Foreign keys are enabled on each connection, child relationships use `ON DELETE CASCADE`, sibling positions are non-negative and unique, status is constrained to `draft`, and basic duration and temperature invariants are backed by storage checks. Reads explicitly order every child level by position.

A dedicated cooking-session repository uses `PersistenceContext.transaction` for the complete create, PUT replacement, and delete. Replacement loads and validates ownership of retained child IDs, mutates the root and entire hierarchy, and commits as one unit. A nested write failure rolls back the complete operation. Relevant domain invariants are also checked at the repository boundary rather than relying only on HTTP validation.

Identifiers and timestamps are server-owned. Create initializes both UTC timestamps. Successful update preserves `createdAt` and advances `updatedAt` strictly; validation failures and rolled-back mutations do not change the durable aggregate or its audit values. An injectable clock/monotonic policy makes this behavior deterministic in tests.

### Contract, dispatch, and errors

The route registry gains path and body metadata and remains the sole source for runtime validation and OpenAPI generation. Dispatch becomes promise-aware so JSON bodies and repository operations are handled without bypassing runtime success/error response validation. Malformed JSON, unknown fields, and body/path validation failures use the shared HTTP 400 envelope with deterministic project-owned issues containing nested paths. Unknown API routes remain distinct from registered session routes whose resource is absent.

CORS advertises `GET`, `POST`, `PUT`, `DELETE`, and `OPTIONS` while retaining existing origin/header behavior and health preflight behavior.

### Verification and synchronized artifacts

Repository tests cover migrations, foreign keys/cascades, nested round trips and ordering, full replacement/reordering, identity validation, rollback after nested mutation for create and update, deletion, and audit clock behavior. Route tests cover every CRUD status and payload, malformed JSON, all validation classes, unknown resources including DELETE, deterministic list order, non-mutation after rejection, health, and CORS.

After contract work, regenerate `backend/openapi/openapi.json` and `frontend/src/api/generated/` through existing generation commands. Update Product Guardrails, Tech Stack, the LikeC4 model, and current Session API wording only where they currently describe draft-session API/storage as planned. Finish with `scripts/precommit-run`.

## Conflict Resolution

- The reviewer suggested `/api/cooking-sessions`, while the lead developer gave the only concrete accepted route family and response/status contract. This design uses `/api/sessions`.
- The architect and reviewer recommended metadata summaries for list; one lead-developer risk note preferred full aggregates. The two aligned recommendations are adopted: list returns summaries and resource/create/update operations return full aggregates.
- The reviewer suggested a session-level shared temperature unit, while the lead developer supplied concrete F/C ranges for unit-tagged targets. This design uses a unit on each dome or food target, retaining unambiguous units without adding a session-wide conversion rule.

## Risks

- A split delete/insert replacement could expose a partial plan. Keep the whole aggregate mutation in one repository transaction and prove rollback with controlled failures after nested writes begin.
- Wall-clock timestamps can fail strict advancement. Use an injectable clock and monotonic update policy inside transactional repository work.
- Permissive JavaScript parsing can admit impossible dates, malformed times, non-finite values, or unsafe ranges. Validate lexical and domain invariants in strict schemas and repeat relevant checks at persistence.
- Accepting arbitrary nested IDs can attach another aggregate's rows. Validate every supplied child ID and parent association before commit.
- Dispatcher, route metadata, CORS, OpenAPI, and generated client drift can leave browser and published contracts broken. Extend these seams together and run generated-artifact drift verification.

## Traceability

- `task:4c658069-2e16-408d-923e-ef84864e2f47`
- `decision:1-swarm-reviewer-recommendation`
- `decision:1-swarm-architect-recommendation`
- `decision:1-swarm-lead-dev-recommendation`
- `round:1:agent:swarm-reviewer`
- `round:1:agent:swarm-architect`
- `round:1:agent:swarm-lead-dev`
