# Live Cook Session Specification

## ADDED Requirements

### Requirement: Minimal persisted draft activation

The backend SHALL own the minimal durable draft input needed for live cooking through a contract-backed creation operation. A draft MUST contain a non-empty, uniquely ordered sequence of planned steps, MUST be activatable at most once, and MUST NOT receive a cancellation operation in this change. Activation MUST atomically validate the draft, snapshot its steps into an immutable session plan, create an `ACTIVE` session whose cursor is the first snapshot step, and create that step's first execution visit with its UTC actual-start timestamp.

#### Scenario: A valid ordered draft becomes the first live cook

- **WHEN** the owner creates a non-empty ordered draft and activates it while no `ACTIVE` or `PAUSED` session exists
- **THEN** one `ACTIVE` session is durable with an immutable step snapshot, its first step is current, its successor is next when one exists, and the first execution visit has the activation timestamp

#### Scenario: An empty draft input is rejected without persistence

- **WHEN** a draft-creation request contains no planned steps
- **THEN** the API returns `400 VALIDATION_ERROR` and persists neither a draft nor session state

### Requirement: Explicit live-session transition policy

The live-session domain SHALL implement only the following state changes: `DRAFT` activation to `ACTIVE`; `ACTIVE` pause to `PAUSED`, advance to a successor while remaining `ACTIVE`, return to the immediate predecessor while remaining `ACTIVE`, completion to `COMPLETED` only at the final current step, and cancellation to `CANCELLED`; and `PAUSED` resume to `ACTIVE` or cancellation to `CANCELLED`. `DRAFT` in this policy denotes an unactivated draft, not a live-session row. The domain MUST reject every unlisted source/action pair, including paused completion, advance at the final step, return at the first step, completion before the final current step, and all state-changing commands after `COMPLETED` or `CANCELLED`.

#### Scenario: A live cook pauses, resumes, and completes at its final step

- **WHEN** an `ACTIVE` session is paused, resumed, advanced through its ordered steps, and completed while its final step is current
- **THEN** each listed transition succeeds, the resulting statuses are `PAUSED`, `ACTIVE`, and `COMPLETED` respectively, and the final execution visit is finished at completion

#### Scenario: An unlisted transition changes nothing

- **WHEN** a caller attempts paused completion, final-step advance, first-step return, early completion, or any command against a terminal session
- **THEN** the API returns `409 INVALID_TRANSITION` and the stored status, cursor, execution visits, timestamps, notes, and transition history remain unchanged

### Requirement: History-preserving step execution and notes

The backend SHALL preserve actual step history in append-only execution visits and append-only notes rather than mutable planned-step timing fields. Entering a step MUST create a new visit; advance and return MUST finish the outgoing visit and start a new visit for the target step at the same command timestamp; and completion MUST finish only the final current visit. Return MUST target only the immediately preceding planned step, with repeated return commands required to move farther back. Activation, advance, return, complete, and cancel MAY accept an optional note, and each accepted note MUST be recorded against its relevant visit without replacing prior notes. Pause and resume MUST retain the cursor and open visit without fabricating a start or finish time; cancellation MUST record cancellation without fabricating an actual finish time.

#### Scenario: Returning preserves an earlier execution attempt

- **WHEN** an owner advances from a step, returns to it, and later advances again with notes on the commands
- **THEN** each entry is a separately ordered durable execution visit, prior start/finish values and notes remain intact, and the current/next projection reflects the new cursor deterministically

#### Scenario: Pausing does not alter step timing

- **WHEN** an `ACTIVE` session with an open current visit is paused and then resumed
- **THEN** its cursor and visit start remain unchanged and no finish time is created by either status command

### Requirement: Atomic persistence and one-live-session invariant

Every state-changing live-session command SHALL validate its preconditions and perform its status, cursor, execution-visit, timestamp, note, and transition-history effects in one SQLite transaction. The persistence schema MUST use foreign keys and MUST enforce at most one session in `ACTIVE` or `PAUSED` at the SQLite boundary. Rejected validation, missing-entity, transition, or uniqueness-conflict outcomes MUST roll back all command effects. Live session state, cursor, execution history, timestamps, and notes MUST remain durable across reopening the same SQLite database.

#### Scenario: A competing activation cannot create a second live session

- **WHEN** activation is attempted while another session is `ACTIVE` or `PAUSED`
- **THEN** the API returns `409 ACTIVE_SESSION_CONFLICT`, the existing live session remains unchanged, and no contender session, cursor, visit, note, or transition row is persisted

#### Scenario: Live state survives a database restart

- **WHEN** an active or paused session with execution visits and notes is closed and the same SQLite database is reopened
- **THEN** the active-session query returns the same status, cursor, current/next projection, timestamps, notes, and deterministic execution history

### Requirement: Contract-backed live-session API and generated client

The executable route registry SHALL define strict request, success, and error schemas for minimal draft creation, activation, active-session query, advance, return, pause, resume, complete, and cancel; the dispatcher MUST validate both input and declared output. The active-session projection MUST expose status, current step and its active execution data, nullable `nextStep`, and deterministically ordered execution history. At the final live step `nextStep` MUST be `null`. Terminal command responses MUST expose no actionable current or next step, and the active-session query MUST return `404 NOT_FOUND` when no `ACTIVE` or `PAUSED` session exists. The shared error envelope MUST map malformed requests to `400 VALIDATION_ERROR`, missing drafts or live sessions to `404 NOT_FOUND`, invalid persisted drafts to `409 INVALID_DRAFT`, unlisted transitions to `409 INVALID_TRANSITION`, and competing activation to `409 ACTIVE_SESSION_CONFLICT`.

#### Scenario: A current and next step are exposed through the registered contract

- **WHEN** a client queries an active session before its final step
- **THEN** the runtime-validated response exposes its `ACTIVE` or `PAUSED` status, current step/current execution data, and the immediate successor as `nextStep`

#### Scenario: Terminal sessions leave the active query

- **WHEN** a session completes or is cancelled
- **THEN** its terminal command response has no actionable current or next step and a later active-session query returns `404 NOT_FOUND` without mutating durable history

### Requirement: Generated contract artifacts and verification coverage

The repository SHALL generate and commit OpenAPI and the typed fetch client from the executable live-session route registry; these artifacts MUST NOT be hand-edited and the existing API drift check MUST pass. Focused backend tests MUST cover every permitted and prohibited transition, no-write failures, repeated-return history, restart persistence, and the `ACTIVE`/`PAUSED` competing-activation conflict. The affected architecture/documentation source of truth MUST describe the implemented live-session API-to-transactional-SQLite boundary without adding frontend behavior, and `scripts/precommit-run` MUST pass.

#### Scenario: Generated artifacts and verification are current

- **WHEN** the live-session contract and implementation are complete
- **THEN** generated OpenAPI and client artifacts match the executable registry, focused backend coverage passes, the applicable architecture/documentation source is current, and `scripts/precommit-run` succeeds
