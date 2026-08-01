# cooking-session-planning Specification

## ADDED Requirements

### Requirement: Canonical draft-session CRUD surface

The executable API registry MUST define one unversioned draft-session collection at `/sessions` and item resource at `/sessions/{sessionId}` under the existing `/api` server prefix. It SHALL provide POST create and GET list on the collection plus GET, full-replacement PUT, and DELETE on an item. Create SHALL return HTTP 201, get/list/update SHALL return HTTP 200, and delete SHALL return HTTP 204 with no body. JSON successes MUST use `{ "data": ... }`; an unknown session ID MUST use the shared structured error envelope with a session-specific resource-not-found code distinct from route-not-found.

#### Scenario: Create and retrieve a session

- **WHEN** a valid complete draft is posted to `/api/sessions`
- **THEN** the API returns 201 with a runtime-validated aggregate and a subsequent item GET returns that complete aggregate in a 200 `{ "data": ... }` response

#### Scenario: Replace and delete a session

- **WHEN** a known session receives a valid full PUT and is then deleted
- **THEN** PUT returns the complete replacement with HTTP 200, DELETE returns HTTP 204 without a body, and a later item GET returns the session-specific not-found error

#### Scenario: Unknown session resource

- **WHEN** GET, PUT, or DELETE addresses a well-formed but unknown session ID
- **THEN** the API returns the declared shared resource-not-found response rather than generic route-not-found

### Requirement: Deterministic complete draft list

GET `/api/sessions` MUST return all single-user draft aggregates without pagination or ownership filtering. Results SHALL include complete nested phases and steps and MUST be ordered by `updatedAt` descending, with session ID ascending as a deterministic tie-breaker.

#### Scenario: List multiple drafts

- **WHEN** multiple draft sessions exist
- **THEN** collection GET returns every complete aggregate in the documented deterministic order

### Requirement: Separate strict write and read contracts

Create and PUT MUST use one strict complete-draft write shape that rejects unknown fields and excludes server-owned identifiers, status, and audit timestamps. Read responses SHALL add opaque server-generated IDs for the session, phases, and steps, fixed status `draft`, and server-managed session-level `createdAt` and `updatedAt` UTC ISO-8601 timestamps. Nested items MUST NOT expose audit timestamps. The canonical contract MUST pin exact JSON field names, requiredness, and optional food-target serialization before implementation.

#### Scenario: Server metadata is generated

- **WHEN** a valid write body creates a draft
- **THEN** the response supplies session, phase, and step IDs, `draft` status, and aggregate audit timestamps that were not accepted from the caller

#### Scenario: Server fields or unknown fields are submitted

- **WHEN** a create or PUT body contains an ID, status, audit timestamp, or any unrecognized field
- **THEN** strict body validation rejects the request with the deterministic shared error envelope before persistence begins

### Requirement: Complete ordered planning aggregate

A persisted draft MUST contain a non-empty session title, a valid cooking date, a planned/manual Fahrenheit dome minimum and maximum, optional scalar planned/manual Fahrenheit food target, and session-level setup, deflector, heat-zone, vent, and prep guidance. It SHALL contain at least one ordered phase; each phase MUST contain a non-empty title, cooking technique, transition guidance, and at least one ordered step. Each step MUST contain a non-empty title, instructions, and duration in integer minutes. Request array order SHALL be authoritative, responses MUST reproduce that order, and persistence ordinals MUST NOT be exposed publicly.

#### Scenario: Complete nested round trip

- **WHEN** a caller creates a draft with multiple phases and multiple differently ordered steps containing every planning field
- **THEN** create, item get, and list reproduce every value and both nesting orders without exposing ordinal fields

#### Scenario: Incomplete nested draft

- **WHEN** a write omits a required planning field, contains no phases, or contains a phase with no steps
- **THEN** strict validation rejects the complete request before any aggregate data is written

### Requirement: Explicit planning time validation

The API MUST accept cooking dates only when they are real calendar dates serialized as `YYYY-MM-DD`. Step durations SHALL be integral minutes from 1 through 1440 inclusive. Ordered step durations are the timing authority; offsets and totals MUST be derived and MUST NOT be persisted. The API MUST NOT invent overlap or chronology validation beyond these date and duration rules.

#### Scenario: Valid planning time

- **WHEN** a complete draft has a real `YYYY-MM-DD` cooking date and each step duration is an integer from 1 through 1440
- **THEN** timing validation accepts the draft and persisted reads derive ordering from arrays rather than stored offsets

#### Scenario: Invalid planning time

- **WHEN** a date is malformed or impossible, or a duration is zero, negative, fractional, or greater than 1440
- **THEN** strict body validation rejects the request with deterministic issues and no aggregate mutation

### Requirement: Explicit planned temperature validation

Dome and optional food targets MUST be interpreted only as planned/manual Fahrenheit guidance and MUST NOT represent probe or current readings. The dome minimum SHALL be less than or equal to the maximum. Before implementation, the executable contract MUST pin exact inclusive Fahrenheit bounds and numeric precision for dome endpoints and the optional scalar food target, and it MUST apply those rules consistently to create and PUT.

#### Scenario: Equal dome endpoints

- **WHEN** both dome endpoints are equal and satisfy the pinned Fahrenheit bounds and precision
- **THEN** temperature validation accepts the range

#### Scenario: Invalid planned temperature

- **WHEN** a dome endpoint or food target is outside the pinned bounds, violates the pinned precision, or the dome minimum exceeds the maximum
- **THEN** strict validation rejects the complete request with deterministic issues and no aggregate mutation

### Requirement: Normalized ordered SQLite storage

The next immutable numbered migration SHALL add normalized session, phase, and step tables without altering prior migration identity or existing `app_metadata`. The schema MUST durably store every approved aggregate field, session audit timestamps, and per-parent phase/step ordinals, MUST enforce parent foreign keys and deletion cascades, and MUST constrain ordinals against duplicate positions within a parent. Repository reads SHALL explicitly order every nesting level by ordinal on a bootstrap-configured connection with foreign keys enabled.

#### Scenario: Fresh and existing databases migrate

- **WHEN** production bootstrap opens a fresh database or a compatible database with the existing migration history
- **THEN** the session schema is applied once in numeric order without disturbing prior history or `app_metadata`

#### Scenario: Ordered aggregate is reconstructed

- **WHEN** a stored session has multiple phases and steps with persisted ordinals
- **THEN** repository get and list explicitly reconstruct arrays in ordinal order rather than relying on SQLite row order

### Requirement: Atomic aggregate writes and replacement identity

Create, full PUT replacement, and delete MUST execute through the shared repository transaction boundary. PUT SHALL preserve the session ID and `createdAt`, replace all nested rows with newly generated nested IDs, advance session `updatedAt`, and leave exactly the submitted child graph. Any validation failure or thrown mid-write persistence failure MUST leave the previously stored aggregate unchanged and persistence failures MUST be rethrown. Delete MUST remove all nested rows through enforced cascade behavior or an equivalent operation in the same transaction.

#### Scenario: Successful reorder and replacement

- **WHEN** a valid PUT changes session values, reorders phases and steps, removes children, and adds children
- **THEN** a following GET returns exactly the submitted graph and order, preserves session identity and creation time, has fresh nested IDs and a new update timestamp, and exposes no removed child

#### Scenario: Failed replacement rolls back

- **WHEN** a controlled repository test throws after replacement has begun or a route receives an invalid replacement
- **THEN** the failure is reported and a following GET returns the complete pre-update aggregate unchanged

#### Scenario: Delete cascades

- **WHEN** an existing session is deleted
- **THEN** the session and every nested phase and step are absent, list excludes it, and no orphan rows remain

### Requirement: Contract dispatch remains deterministic

The dispatcher MUST validate path, body, query, success, and error data against the executable contract and MUST report body/path/query validation issues with project-owned fields in the existing deterministic sort order. It SHALL support asynchronous repository operations, item path parameters, 201 and 204 responses, and session-specific not-found mapping while retaining existing health, unknown-route, and unsupported-method behavior. CORS preflight MUST advertise and support PUT and DELETE in addition to existing methods.

#### Scenario: Invalid input uses contextual deterministic issues

- **WHEN** a session request contains invalid body, path, or query input
- **THEN** the response uses the shared error envelope with correctly contextualized, deterministically ordered validation issues

#### Scenario: Existing API behavior is preserved

- **WHEN** clients call health, an unknown route, an unsupported method, or OPTIONS for a session route
- **THEN** existing deterministic health/error behavior remains intact and session preflight supports every registered CRUD method

### Requirement: Generated and documented boundaries stay synchronized

Canonical OpenAPI and the generator-owned frontend client MUST be regenerated from the executable route registry and MUST pass existing drift checks without hand edits or handwritten frontend product integration. Relevant project documentation SHALL describe durable single-owner drafts, integer-minute ordered timing, and planned/manual Fahrenheit targets, and LikeC4 descriptions MUST stop labeling the shipped draft Session API and session storage as wholly planned without adding a new container boundary.

#### Scenario: Contract artifacts are regenerated

- **WHEN** the session registry and schemas are complete
- **THEN** OpenAPI and generated frontend transport artifacts expose the declared CRUD operations and models and generation drift verification passes

#### Scenario: Completion verification passes

- **WHEN** repository tests, route tests, generated artifacts, documentation, and architecture descriptions have been updated
- **THEN** `scripts/precommit-run` completes successfully with coverage for nested round trips, ordering/reordering, invalid dates/durations/temperatures, rollback, not-found behavior, and deletion
