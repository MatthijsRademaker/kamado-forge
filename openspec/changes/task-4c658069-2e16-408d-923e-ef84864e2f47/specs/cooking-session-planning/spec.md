# cooking-session-planning Specification

## ADDED Requirements

### Requirement: Complete draft cooking-session aggregate

The backend MUST model a cooking session as a draft-only aggregate with a server-owned opaque UUID, non-empty title, calendar-valid local `cookingDate` in `YYYY-MM-DD` form, literal `draft` status, UTC `createdAt` and `updatedAt`, and at least one ordered phase. Every phase MUST have a server-owned opaque UUID, non-empty title, and at least one ordered step. Every step MUST have a server-owned opaque UUID, non-empty title, local `plannedStartTime`, `durationMinutes`, non-empty free-text technique, dome target range, optional scalar food target, and optional step-level setup, deflector, heat-zone, vent, and prep guidance. Optional values MUST be omitted rather than returned as `null`.

#### Scenario: Complete nested draft round trip

- **WHEN** the owner creates a draft with two phases, multiple steps, every planning field, one omitted food target, and one present food target
- **THEN** the API returns server identifiers, literal draft status, audit timestamps, all submitted values, and the same phase and step order, and a subsequent resource GET returns the same aggregate

#### Scenario: Structurally incomplete draft

- **WHEN** a request has no phases or has a phase with no steps
- **THEN** the API returns HTTP 400 with field-specific structured issues and does not mutate persistence

### Requirement: Explicit planning time and duration

The contract MUST treat `cookingDate` as a local calendar date with no timezone conversion, each `plannedStartTime` as a local 24-hour `HH:mm` value, and `durationMinutes` as an integer from 1 through 1440 inclusive. Validation MUST reject lexical dates that are not real calendar dates, malformed or impossible clock values, and zero, negative, fractional, non-finite, or over-limit durations.

#### Scenario: Valid local plan timing

- **WHEN** a draft contains a real `YYYY-MM-DD` cooking date, an `HH:mm` step start, and an integer duration within 1 through 1440
- **THEN** create or replacement persists and returns those local values unchanged

#### Scenario: Invalid local plan timing

- **WHEN** a draft contains an impossible calendar date, malformed or impossible time, or invalid duration
- **THEN** the API returns HTTP 400 with an issue identifying each offending field and leaves the durable aggregate unchanged

### Requirement: Unit-unambiguous temperature targets

Every step MUST carry a dome target `{min, max, unit}` whose unit is `F` or `C`, whose values are finite, and whose minimum does not exceed its maximum. Dome values MUST be within 100 through 1200 for `F` or 38 through 650 for `C`. An optional food target MUST be a scalar `{value, unit}` with a finite value within 32 through 212 for `F` or 0 through 100 for `C`. Each target MUST carry its own unit, and no unit may be inferred from guidance text.

#### Scenario: Valid dome range and optional food target

- **WHEN** a step supplies an in-range dome minimum and maximum in one declared unit and an in-range scalar food target in its declared unit
- **THEN** the values and units persist and round-trip unchanged

#### Scenario: Invalid temperature target

- **WHEN** a target is non-finite, uses an unsupported unit, falls outside its unit-specific range, or has a dome minimum greater than its maximum
- **THEN** the API returns HTTP 400 with a structured issue for the offending target field and does not mutate persistence

### Requirement: Draft CRUD contract

The runtime route registry SHALL define `POST /api/sessions`, `GET /api/sessions`, `GET /api/sessions/{id}`, `PUT /api/sessions/{id}`, and `DELETE /api/sessions/{id}` as the sole draft lifecycle operations. Create MUST return HTTP 201 with `{data: session}`; list MUST return HTTP 200 with `{data: {sessions: summaries[]}}`; resource get and replacement MUST return HTTP 200 with `{data: session}`; and successful delete MUST return HTTP 204 with no response body. Create SHALL default an omitted status to `draft` and reject a supplied non-draft status; PUT SHALL require literal `draft`. The registry MUST supply strict request, response, and error schemas for runtime validation and generation.

#### Scenario: Draft lifecycle responses

- **WHEN** the owner creates, lists, gets, replaces, and deletes an existing draft through the registered routes
- **THEN** every operation returns its declared status and response shape, and no active or completed state is created

#### Scenario: Unsupported lifecycle status

- **WHEN** create or replacement supplies a status other than `draft`
- **THEN** the API returns HTTP 400 with a status-field issue and persistence is unchanged

### Requirement: Stable nested identity and authoritative ordering

Phase and step order MUST be derived solely from request array order and persisted as unique non-negative sibling positions; clients MUST NOT supply position values. Create MUST generate every child UUID. PUT MUST preserve a supplied existing child UUID, generate a UUID for a child whose ID is omitted, remove children omitted from the replacement, and reject duplicate, unknown, foreign-session, or mis-parented phase and step IDs with structured HTTP 400 issues.

#### Scenario: Replace and reorder a hierarchy

- **WHEN** PUT reorders retained phases and steps, changes values, adds children without IDs, and omits removed children
- **THEN** the next GET contains exactly the replacement hierarchy in request-array order, retained IDs remain stable, new children have server IDs, and omitted children are absent

#### Scenario: Invalid retained child identity

- **WHEN** PUT duplicates a child ID or supplies an ID that is unknown, owned by another session, or associated with a different phase
- **THEN** the API returns HTTP 400 with a child-ID issue and the existing hierarchy remains unchanged

### Requirement: Transactional SQLite aggregate persistence

SQLite MUST store sessions, phases, and steps in structured tables with foreign keys enabled, `ON DELETE CASCADE` child relationships, unique sibling positions, a draft-only status constraint, and checks for basic duration and temperature invariants. Repository reads MUST explicitly order phases and steps by position. Complete create, PUT replacement, and delete MUST run through the shared repository transaction boundary so no root or nested partial state becomes durable.

#### Scenario: Persisted ordering and cascading deletion

- **WHEN** an ordered aggregate is saved and its session root is later deleted
- **THEN** ordered repository reads match request order before deletion and no associated phase or step row remains afterward

#### Scenario: Nested write failure rolls back

- **WHEN** a controlled repository failure occurs after nested mutation has begun during create or replacement
- **THEN** no part of a new aggregate is durable, or the existing aggregate remains domain-equivalent to its complete prior hierarchy including audit values

### Requirement: Server-owned audit behavior

The repository MUST generate UTC audit timestamps and opaque UUIDs rather than trusting client values. Create MUST initialize `createdAt` and `updatedAt`. A successful update MUST preserve `createdAt` and advance `updatedAt` strictly. Failed request validation and rolled-back repository work MUST NOT advance or otherwise alter durable audit values.

#### Scenario: Successful update advances only updated time

- **WHEN** a valid complete replacement commits
- **THEN** the returned and durable aggregate retains its original `createdAt` and has an `updatedAt` strictly later than before

#### Scenario: Failed mutation preserves audit values

- **WHEN** replacement fails validation or rolls back after a nested write failure
- **THEN** the durable aggregate and both prior audit timestamps remain unchanged

### Requirement: Deterministic discovery, errors, and CORS

The unpaginated single-owner list MUST return summaries containing id, title, cooking date, draft status, audit timestamps, phase count, and step count, ordered by cooking date ascending, updated time descending, then id ascending. A syntactically valid unknown session UUID MUST return the shared structured HTTP 404 resource error for get, update, and delete; unknown DELETE MUST NOT return 204. An invalid path UUID, malformed JSON, unknown request field, or invalid body MUST return the shared HTTP 400 envelope with deterministic field paths, including nested array indexes. CORS MUST advertise `GET`, `POST`, `PUT`, `DELETE`, and `OPTIONS` while preserving existing health and configured origin/header behavior.

#### Scenario: Deterministic summary discovery

- **WHEN** multiple drafts have differing or tied cooking dates and update times
- **THEN** list returns the documented summary fields in cooking-date, updated-time, and id order without requiring authentication or a user filter

#### Scenario: Unknown and malformed resource requests

- **WHEN** a request uses a malformed UUID, malformed JSON, invalid body, or a valid UUID for a session that does not exist
- **THEN** it receives the documented structured 400 or 404 response, including 404 for unknown DELETE, and persistence is unchanged

#### Scenario: CRUD preflight and health regression

- **WHEN** a browser performs API preflight or a client calls the existing health route after session routes are registered
- **THEN** preflight advertises all registered CRUD methods and health retains its declared behavior

### Requirement: Coupled generated artifacts, tests, and current documentation

OpenAPI and the generated frontend fetch client MUST be regenerated from the runtime route registry and expose all five draft operations with strict aggregate and summary types. Repository tests MUST cover migration constraints and cascades, nested round trips and persisted ordering, complete replacement and reordering, child identity validation, rollback after nested mutation for create and replacement, deletion, and audit behavior. Route tests MUST cover every CRUD method and status, malformed and invalid requests, not-found behavior, summary ordering, deletion, health, and CORS. Current product, technical, Session API, and LikeC4 documentation MUST mark the draft-session API and storage boundary as implemented without claiming active cooking or another non-goal. Generated-artifact drift checks and `scripts/precommit-run` MUST pass.

#### Scenario: Generated and documented contract remains synchronized

- **WHEN** the completed route registry, generated artifacts, current documentation, and verification suite are checked
- **THEN** OpenAPI and frontend transport match runtime behavior, documentation describes only the implemented draft boundary, and normal precommit verification passes
