# session-workflow-integration Specification

## Purpose
TBD - created by archiving change task-ec28d9c4-811a-426e-b51d-722bcae1ccae. Update Purpose after archive.
## Requirements
### Requirement: Session features use the generated contract through one domain layer
The frontend MUST consume regenerated planning and live-session operations and types through a Pinia Colada session-domain layer. Route and feature code MUST NOT issue session raw fetches, define duplicate transport DTOs, import generated transport modules directly, or mirror remote session state in Pinia. Implementation MUST stop and repair the owning prerequisite contract before wiring behavior whose operation, status, no-active response, note association, error semantics, or ID-bearing route is missing or ambiguous.

#### Scenario: Consume a complete merged contract
- **WHEN** Plan, Today, or Live Cook needs session server state
- **THEN** it obtains typed query or mutation state from the session-domain layer backed by regenerated operations and types

#### Scenario: Detect a prerequisite contract gap
- **WHEN** the contract inventory cannot identify an authoritative operation or semantic required by the durable browser journey
- **THEN** the gap is resolved in the owning prerequisite contract and artifacts are regenerated instead of adding a fixture bridge, duplicate DTO, raw fetch, or client-authored transition rule

### Requirement: Session cache keys and reconciliation are centralized
The frontend MUST define stable parameterized keys for session lists, session detail by ID, active session, and eligible drafts. Each draft save, activation, live transition, note creation, cancellation, and completion mutation MUST reconcile a complete authoritative response where available and MUST invalidate or refetch every affected list, detail, active, and eligible-draft key according to a centralized mutation matrix. A rejected mutation that may reflect changed server state MUST refetch affected authoritative queries.

#### Scenario: Identify session query state
- **WHEN** two callers request the same session query and parameters
- **THEN** the centralized key factory produces the same cache identity, while different IDs or parameters produce distinct identities

#### Scenario: Reconcile a successful mutation
- **WHEN** a session mutation succeeds
- **THEN** every query identified by the mutation matrix is updated from a complete authoritative response or invalidated and refetched

#### Scenario: Recover from a potentially stale rejection
- **WHEN** a transition or conflict rejection may mean backend state differs from the visible cache
- **THEN** the prior visible state is retained until affected authoritative queries refetch

### Requirement: Plan persists an explicit local ordered draft
Plan MUST keep nested draft fields, phases, steps, and reorder operations in local form state until an explicit create or update succeeds. It MUST submit the complete ordered draft, reconcile from the confirmed server representation, and reload the same server-assigned session with the same nested values and order. A failed save MUST preserve the local buffer, expose structured field issues or a clear actionable summary, and MUST NOT claim persistence.

#### Scenario: Create and reload a plan
- **WHEN** the owner creates a complete ordered draft, saves successfully, and reloads the browser
- **THEN** Plan loads the server-assigned session with the persisted values and nested order

#### Scenario: Edit and reorder a plan
- **WHEN** the owner adds, removes, edits, or reorders phases or steps before saving
- **THEN** the changes remain local until the complete ordered draft is confirmed by the backend

#### Scenario: Reject a plan save
- **WHEN** create or update returns a structured validation, conflict, or transport failure
- **THEN** all unsaved values and ordering remain editable and the route presents correction or retry guidance without showing a saved state

#### Scenario: Open Plan without a draft
- **WHEN** Plan resolves successfully with no existing draft
- **THEN** it shows a meaningful create state rather than fixture content

### Requirement: Today resolves active and eligible sessions without ambiguity
Today MUST prioritize the authoritative active session and MUST distinguish a true no-active result from query failure. When no active session exists, zero eligible drafts MUST produce a create or open-Plan action, while one or more eligible drafts MUST be presented for explicit selection and backend-confirmed activation. Today MUST NOT silently choose or activate a draft.

#### Scenario: Continue an active cook
- **WHEN** active lookup returns an active session
- **THEN** Today prioritizes that session and provides the route action to continue it

#### Scenario: Choose an eligible draft
- **WHEN** no session is active and one or more eligible drafts are returned
- **THEN** Today presents the drafts for explicit selection and activates only the selected draft after backend confirmation

#### Scenario: Handle no session and no draft
- **WHEN** active lookup is empty and no eligible draft exists
- **THEN** Today presents a clear action to create or open a plan

#### Scenario: Fail active lookup
- **WHEN** active or eligible-draft lookup fails
- **THEN** Today renders an actionable error and retry state rather than treating the failure as empty data

### Requirement: Activation and live actions are backend-confirmed
Activation, pause/resume, back, advance, note creation, cancellation, and completion MUST be pessimistic by default. The corresponding controls MUST reject duplicate submission while pending, MUST retain prior visible authoritative state on rejection, and MUST expose contextual guidance from structured errors with a safe fallback. Any optimistic cache change MUST have an exact prior snapshot, tested rollback, and authoritative refetch.

#### Scenario: Confirm a live transition
- **WHEN** the owner submits an allowed activation or live action
- **THEN** the visible authoritative status, progress, IDs, and timestamps settle from the backend response or affected-query refetch

#### Scenario: Reject a live transition
- **WHEN** the backend rejects an activation or live action
- **THEN** the control stops pending, prior visible server state remains, corrective guidance is shown, and affected queries refetch when the server may have changed

#### Scenario: Prevent duplicate live actions
- **WHEN** a live mutation is pending
- **THEN** its control cannot submit the same action again

### Requirement: Live Cook renders durable guidance and notes

Live Cook MUST render backend-derived current action, current and next step, targets, setup or vent guidance, timing, position within the cook, and status. It MUST additionally render the durable execution history the projection supplies, as ordered visits with their actual start times and durations, rather than reducing that history to its notes.

Position within the cook MUST be conveyed by the rendered timeline. Live Cook MUST NOT render a determinate progress bar or a session-completion percentage; `progress.percent` remains part of the projection and is not read by this view. Position and elapsed-against-planned time MUST remain available to assistive technology as text.

A non-empty note MUST be persisted using the association defined by the generated contract and MUST remain visible after reload, rendered beneath the visit that owns it. Invalid note submission MUST preserve entered text. At a 320px viewport, current action and key targets MUST remain available without horizontal overflow.

#### Scenario: Reload live guidance

- **WHEN** an active session detail is loaded or reloaded
- **THEN** Live Cook renders current and next guidance, targets, timing, timeline position, status, and ordered execution history from durable session state

#### Scenario: Persist a note

- **WHEN** the owner submits a valid non-empty note and reloads the session
- **THEN** the persisted note remains visible beneath the visit that owns it, using the session or step association defined by the API

#### Scenario: Reject a note

- **WHEN** note creation rejects empty or invalid content or fails at the backend
- **THEN** the entered note text remains available for correction or retry and no speculative note is shown as persisted

#### Scenario: Use Live Cook at narrow width

- **WHEN** Live Cook is displayed at 320px
- **THEN** current action and key targets are readable without horizontal overflow

#### Scenario: Convey position without a progress bar

- **WHEN** an active session is rendered
- **THEN** timeline position conveys progress, no determinate progress element or completion percentage is present, and step position and elapsed-against-planned time are available as text

### Requirement: Completion retains a reloadable terminal session

Completion MUST use the inherited confirmation, persist completed status and actual progress, remove the session from active lookup, retain its session ID, and render ID-addressable read-only detail. Reloading that detail MUST NOT depend on active lookup or require Logbook history UI.

The terminal detail MUST use the same rendered shape as the active session rather than a separate information layout, presenting full execution history with actual times, no remaining planned steps, no action composer, and a closing entry stating the terminal status.

#### Scenario: Complete and reload a cook

- **WHEN** the owner confirms completion and directly reloads the retained session route
- **THEN** the application renders the durable completed status, final progress, and persisted notes as read-only detail while active lookup is empty

#### Scenario: Cancel a cook

- **WHEN** the owner confirms cancellation and the backend accepts it
- **THEN** the session settles to the authoritative cancelled state and related active, detail, and list queries are reconciled

#### Scenario: Terminal detail reuses the live shape

- **WHEN** a terminal session route is loaded directly
- **THEN** it renders the same timeline shape as an active session, without remaining planned steps or an action composer, and with a closing entry stating the terminal status

### Requirement: Session routes expose distinct recoverable states
Plan, Today, and Live Cook MUST distinguish loading, true empty data, structured validation or conflict errors, and unknown transport failures. They MUST provide retry or corrective actions where recovery is possible and MUST preserve recoverable form or note input. Known backend codes MAY use contextual copy, but raw transport failure MUST NOT be the only user guidance.

#### Scenario: Load a session route
- **WHEN** required session data is pending
- **THEN** the route renders the shared loading treatment without fixture content or false empty state

#### Scenario: Render a true empty result
- **WHEN** a successful query returns no applicable session data
- **THEN** the route renders a meaningful empty action appropriate to Plan or Today

#### Scenario: Render a recoverable failure
- **WHEN** a route query or mutation returns a structured or unknown error
- **THEN** the route preserves recoverable input and presents safe retry or corrective guidance

### Requirement: Production session fixture paths are removed
Production Plan, Today, and Live Cook code MUST contain no fixture provider imports, fixture-selection route branches, environment switches, or runtime selectors. Typed fixture builders MAY remain only in tests or explicit test-support modules that cannot be selected by a production build.

#### Scenario: Build production frontend
- **WHEN** the production frontend is built or its imports are inspected
- **THEN** no Plan, Today, or Live Cook runtime path can select fixture session data

#### Scenario: Run isolated tests
- **WHEN** a test requires session fixture data
- **THEN** it may import typed builders from an explicit test-support path without exposing that path to production runtime code

### Requirement: The durable browser journey is verified end to end
The repository MUST provide composable integration tests for typed success and error behavior, key identity, mutation invalidation/refetch, and rollback for any optimistic update. A full-stack browser test MUST run against the real API and an isolated durable SQLite database with deterministic reset and cleanup, and MUST prove create, reload, activate, advance, add note, complete, and direct reload of final state plus at least one recoverable backend error. API generation and drift checks and `scripts/precommit-run` MUST pass.

#### Scenario: Complete the durable browser flow
- **WHEN** the full-stack browser test runs from an isolated database
- **THEN** a created plan survives reload, activation survives reload, progress and a note persist, completion clears active lookup, and the retained final detail survives direct reload

#### Scenario: Recover from a backend error
- **WHEN** the browser journey triggers a structured recoverable backend rejection
- **THEN** the UI retains relevant input or prior server state, explains a correction or retry action, and can continue after recovery

#### Scenario: Verify contract and repository alignment
- **WHEN** repository verification runs
- **THEN** generated OpenAPI and client artifacts match the executable contract, affected documentation and LikeC4 describe the current integration, and `scripts/precommit-run` succeeds

