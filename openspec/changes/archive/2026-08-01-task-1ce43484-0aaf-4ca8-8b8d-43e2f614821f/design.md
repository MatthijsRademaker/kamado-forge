# Design: Deterministic Live Cook Sessions

## Context

The current application is a single-owner Bun API with SQLite persistence, an executable Zod route registry, and generated OpenAPI/fetch-client artifacts, but no draft-plan, session, or step domain. This change establishes the smallest durable planning input necessary to activate one cook and models live cooking as transactional commands plus a deterministic read projection. Time is recorded when a command runs; no server process measures elapsed time between commands.

## Goals

- Persist a non-empty ordered draft and activate it into one immutable session plan.
- Expose the sole live session with a deterministic current and next step projection.
- Enforce a complete status and step-order transition policy with no partial writes on rejection.
- Preserve repeated step visits, actual UTC timestamps, and notes across returns and database restart.
- Enforce the single-live-session rule at the SQLite boundary and expose all operations through the contract registry and generated client.

## Non-Goals

- A frontend live-cook screen, navigation, or other frontend feature work.
- Process timers, background jobs, automatic advancement, notifications, probe/hardware integration, or LLM coaching.
- Multi-user identity, authorization, synchronization, social features, generic recipe behavior, or a full planning editor.
- Editing terminal historical records, retrospective analytics, or lesson extraction.

## Decisions

### Minimal draft and immutable activated plan

This change owns a minimal contract-backed draft-creation path rather than depending on an absent planning feature. A draft request contains a non-empty sequence of uniquely ordered planned steps; no planning editor or draft-cancellation operation is added. A draft is eligible for activation once. Activation atomically snapshots its ordered steps into a session so later draft changes cannot alter the live cook or its planned-versus-actual record.

`DRAFT` below denotes an unactivated draft, not a live-session row. Successful activation creates an `ACTIVE` session, sets its cursor to the first snapshot step, starts that step's first execution visit, and records one UTC command timestamp.

### Status and step transition table

All unlisted source/action pairs are invalid. `PAUSED` deliberately cannot complete; it must resume first. A draft cannot be cancelled by this change. `COMPLETED` and `CANCELLED` have no state-changing outgoing command.

| Source | Command and condition | Result | Durable effect |
| --- | --- | --- | --- |
| `DRAFT` | activate; draft has ordered steps and no live session exists | `ACTIVE` | Create session snapshot, cursor at first step, activation transition, and first execution visit with `actualStartedAt`. |
| `ACTIVE` | pause | `PAUSED` | Append pause transition only; retain cursor and open execution visit. |
| `ACTIVE` | advance; current step has a successor | `ACTIVE` | Finish the current visit and start a new visit for the immediate successor. |
| `ACTIVE` | return; current step is not first | `ACTIVE` | Finish the current visit and start a new visit for the immediately preceding step. Repeat return to move farther back. |
| `ACTIVE` | complete; current step is the final planned step | `COMPLETED` | Finish the final visit and append completion transition. |
| `ACTIVE` | cancel | `CANCELLED` | Append cancellation transition and explicitly cancel the open visit without inventing an actual finish time. |
| `PAUSED` | resume | `ACTIVE` | Append resume transition only; retain cursor and open execution visit. |
| `PAUSED` | cancel | `CANCELLED` | Append cancellation transition and explicitly cancel the open visit without inventing an actual finish time. |
| `COMPLETED` or `CANCELLED` | any state-changing command | invalid | Write nothing. |

Advance at the final step, return at the first step, completion before the final current step, repeated pause, paused completion, and every terminal command are invalid transitions.

### Execution history, notes, and time ownership

The command layer owns a testable UTC clock and captures one timestamp for each accepted command. Entering a step creates a new append-only execution visit. Activation starts the first visit; advance and return close the outgoing visit and start the target visit with the same command timestamp; completion closes the final visit. Returning never reopens or overwrites an earlier visit.

Activation, advance, return, complete, and cancel may carry an optional step note. Each accepted note is an append-only record associated with the relevant execution visit; a later command cannot replace or erase an earlier note. Pause and resume neither change the cursor nor fabricate a start or finish time. Read projections order visits and notes deterministically.

### Transactional persistence and sole-live-session invariant

A forward-only SQLite migration adds the minimal draft, ordered-step, immutable session-step snapshot, session cursor/status, transition history, execution-visit, and note persistence with foreign keys. Every state-changing command validates its draft/status/step-order preconditions, writes its status/cursor/history/timing/note effects, and builds its resulting projection in one repository transaction.

SQLite, not process memory, enforces at most one session in `ACTIVE` or `PAUSED`, using a partial uniqueness constraint or equivalent database constraint. A constraint conflict is translated inside the transaction to the documented conflict response. Any validation failure, transition failure, missing entity, or uniqueness conflict leaves the session, cursor, timestamps, notes, and history unchanged.

### API projection, errors, and generated contract

The executable route registry defines strict request, success, and error schemas for minimal draft creation, activation, active-session query, advance, return, pause, resume, complete, and cancel. The dispatcher validates request and declared response payloads. Successful live-session operations return a projection containing session status, current step and its active execution data, nullable next step, and deterministically ordered execution history. At the final live step `nextStep` is `null`. Terminal command responses retain durable history but expose no actionable current or next step; the active-session query returns only `ACTIVE` or `PAUSED` sessions and returns `404 NOT_FOUND` after completion or cancellation.

The shared error envelope remains `{ "error": { "code", "message", "issues" } }`. Invalid request shapes, including an empty draft request, return `400 VALIDATION_ERROR`; a missing draft or absent live session returns `404 NOT_FOUND`; every unlisted status/step-order transition returns `409 INVALID_TRANSITION`; an invalid persisted draft at activation returns `409 INVALID_DRAFT`; and a competing activation returns `409 ACTIVE_SESSION_CONFLICT`. Domain errors have deterministic payloads and no mutation. Existing health and CORS behavior remain intact.

OpenAPI and `frontend/src/api/generated/` are generated from this registry, not hand-authored. The existing drift check remains the verification boundary.

### Verification and documentation

Focused persistence, state-machine, and dispatcher tests use the existing isolated on-disk SQLite fixture pattern. They cover every allowed and forbidden table row, before/after no-write snapshots, repeated returns, active and paused restart recovery, terminal immutability, and competing activation. The architecture/documentation source of truth is updated narrowly to show the implemented API-to-transactional-repository-to-SQLite flow and the `ACTIVE`/`PAUSED` invariant without adding frontend behavior.

## Risks

- A mutable per-step timing row would erase prior work when returning to a step. Append-only visits and notes preserve each attempt.
- A process-local active-session check can race. The SQLite partial uniqueness constraint is the final authority and its conflict is mapped without partial writes.
- Handler-local timestamps can make tests nondeterministic. A command-owned testable UTC clock provides one timestamp per transition without creating a timer.
- Hand-editing generated artifacts could drift from runtime schemas. The route registry, generator, and drift check remain the only contract pipeline.
- Adding a full plan editor would broaden the change beyond the activation prerequisite. The draft surface stays limited to ordered non-empty step input.

## Traceability

- `task:1ce43484-0aaf-4ca8-8b8d-43e2f614821f`
- `decision:1-swarm-lead-dev-recommendation`
- `decision:1-swarm-reviewer-recommendation`
- `decision:1-swarm-architect-recommendation`
- `round:1:agent:swarm-lead-dev`
- `round:1:agent:swarm-reviewer`
- `round:1:agent:swarm-architect`
