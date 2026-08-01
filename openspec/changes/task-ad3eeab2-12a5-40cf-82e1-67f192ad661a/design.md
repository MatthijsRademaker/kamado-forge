# Design: Durable Draft Cooking-Session Planning

## Context

The project has one unversioned `/api` server prefix, a strict executable Zod contract registry, a shared error envelope, generator-owned OpenAPI/client artifacts, numbered SQLite migrations, enforced foreign keys, and a shared repository transaction helper. The current API and dispatcher are health-only and the database has no cooking-session tables. This change introduces the first product aggregate without adding active-cook behavior.

## Goals

- Provide create, get, deterministic list, full replace/reorder, and delete operations for durable draft cooking-day plans.
- Round-trip every required planning field and exact phase/step array order.
- Make all aggregate writes atomic and prove rollback behavior.
- Keep the executable contract, SQLite schema, OpenAPI, generated frontend client, documentation, and architecture descriptions synchronized.
- Preserve existing health, unknown-route, unsupported-method, CORS, migration, and shared-error behavior.

## Non-Goals

- Active-step progression, pause/resume/finish transitions, timers, or other live-cook lifecycle behavior.
- LLM planning, coaching, or provider integration.
- Handwritten frontend Plan integration or UI work.
- Probes, controllers, telemetry, or measured/current temperatures.
- Generic or reusable recipe catalogs.
- Authentication, accounts, ownership, sharing, pagination, or multi-user behavior.

## Decisions

### Existing unversioned API boundary

“API v2” names this capability iteration; it does not introduce `/api/v2`. Register collection operations at `/sessions` and item operations at `/sessions/{sessionId}` under the existing `/api` server prefix. Use `POST /api/sessions` for create, `GET /api/sessions` for list, and `GET`, `PUT`, and `DELETE /api/sessions/{sessionId}` for item operations. Create returns 201, reads/list/full replacement return 200, and delete returns 204. JSON successes use the existing `{ "data": ... }` convention; delete has no body. Unknown session resources use the shared error envelope with a resource-specific not-found code, distinct from route-not-found.

List returns complete aggregates without pagination, ordered by `updatedAt` descending and then session ID ascending for deterministic ties.

### Separate write and read aggregates

Create and PUT use the same complete replacement shape and do not accept server-owned identifiers, status, or audit fields. Responses include an opaque server-generated ID for the session and each nested phase and step, fixed status `draft`, and session-level `createdAt` and `updatedAt` in server-managed UTC ISO-8601 form. Nested rows do not expose audit timestamps. PUT preserves the session ID and `createdAt`, replaces the child graph with newly generated nested IDs, and advances `updatedAt`.

The complete plan owns title and cooking date at session level. Manual planned targets are a session-level Fahrenheit dome minimum/maximum range and an optional scalar food target. Setup, deflector, heat-zone, vent, and prep guidance are session-level. Each ordered phase has a title, cooking technique, transition guidance, and an ordered non-empty step array. Each step has a title, instructions, and positive integral duration in minutes. A persisted draft contains at least one phase and each phase contains at least one step. Request array order is authoritative; persistence ordinals are never public.

Exact canonical JSON field names and the serialization of the optional food target still require an explicit contract decision before implementation because refinement did not pin them.

### Timing and temperature semantics

`cookingDate` is a real calendar date in `YYYY-MM-DD` form and has no time-zone conversion. Step `durationMinutes` is the planning-time authority and is an integer from 1 through 1440. Phase/step offsets and aggregate totals are derived from ordered durations and are not persisted. The API does not invent overlap or chronology rejection.

Dome and food values are planned/manual Fahrenheit guidance, never measured readings. Dome minimum may equal maximum but must not exceed it. The strict contract must pin exact inclusive Fahrenheit bounds and numeric precision for dome endpoints and the optional food target before migration or route implementation. Values outside those pinned limits are invalid.

### Normalized aggregate persistence

Add the next immutable numbered migration without changing migration 0001 or existing `app_metadata`. Create normalized session, phase, and step tables. Parent-child foreign keys use deletion cascades, ordinals are constrained per parent, and all contractually assigned fields have durable columns. Production and tests continue to enable and verify SQLite foreign keys. Repository reads explicitly order phases and steps by their stored ordinals rather than relying on row order.

### Atomic full replacement

Validate the complete strict request before entering persistence. Create, PUT replacement, and delete execute through the existing shared transaction helper. PUT may delete and reinsert child rows, provided the entire replacement and aggregate timestamp update occur in one transaction. Any validation or injected mid-write failure leaves the prior aggregate unchanged and rethrows persistence failures. A successful replacement contains exactly the submitted graph; removed children are absent.

### Contract dispatch and generated artifacts

Extend the contract registry and dispatcher to handle async repository work, strict JSON bodies, path parameters, 201/204 responses, and resource-not-found mapping while preserving runtime request/response validation and deterministic shared errors. Validation issues identify body, path, or query context and retain deterministic ordering. Expand CORS and preflight coverage for PUT and DELETE.

Generate canonical OpenAPI from the executable registry and regenerate the frontend transport client through the existing generator workflow. Generated artifacts are not edited by hand and no frontend API consumption is added.

### Documentation truth

Document the durable single-owner draft boundary, ordered plan semantics, integer-minute timing authority, and planned/manual Fahrenheit meaning. Update LikeC4 descriptions so the shipped draft Session API and session storage are no longer described as wholly planned, without introducing new architecture containers.

## Conflict Resolution

The reviewer required implementation to remain blocked until public semantics were pinned. The architect and lead developer consistently selected the existing unversioned API, full PUT replacement, draft-only lifecycle, normalized storage, server-owned metadata, and derived timing; those selections are adopted here. Recommendations also resolve list shape/order, aggregate field ownership, complete-draft structure, fresh nested IDs on PUT, and aggregate-only audit data. No validated evidence provides exact DTO field names, optional-food serialization, or temperature limits/precision, so those points remain explicit pre-implementation gaps rather than invented decisions.

## Risks

- Reads that omit explicit ordinal ordering can return nondeterministic phase or step arrays; repository tests must use multiple reordered phases and steps.
- Delete/reinsert replacement churns nested IDs; the read/write contract and tests must enforce the selected fresh-ID policy.
- SQLite foreign-key enforcement is connection-local; production and temporary test databases must use the configured bootstrap and verify cascades and orphan absence.
- Expanding the synchronous health-only dispatcher can regress existing route, method, error-envelope, response-validation, or CORS behavior; retain existing tests while adding CRUD cases.
- Hand-editing OpenAPI or client files can create drift; regenerate from the executable registry and use existing drift checks.
- Implementing before the two remaining contract gaps are resolved would make migrations, tests, and generated clients ambiguous; task 1 is a hard gate.

## Traceability

- `task:ad3eeab2-12a5-40cf-82e1-67f192ad661a`
- `decision:1-swarm-reviewer-recommendation`
- `decision:1-swarm-architect-recommendation`
- `decision:1-swarm-lead-dev-recommendation`
- `round:1:agent:swarm-reviewer`
- `round:1:agent:swarm-architect`
- `round:1:agent:swarm-lead-dev`
