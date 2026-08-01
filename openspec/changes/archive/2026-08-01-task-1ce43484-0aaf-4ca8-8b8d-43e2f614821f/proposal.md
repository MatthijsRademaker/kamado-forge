# Add Deterministic Live Cook Session State Transitions

## Why

The backend currently has only health routing and SQLite migration infrastructure; it cannot turn a saved cook plan into a resumable live cook. The single owner needs a durable, unambiguous record of what step is current, what comes next, what actually happened, and whether the cook is paused, completed, or cancelled. Command-driven state changes are required so invalid actions and competing activations cannot leave partial state behind.

## What Changes

- Add the smallest durable draft and ordered-step foundation needed to create a valid draft and activate it exactly once into an immutable session plan.
- Add an explicit live-session state machine, durable cursor, append-only transition/execution/note history, UTC command timestamps, and a SQLite-enforced invariant allowing only one `ACTIVE` or `PAUSED` session.
- Add contract-backed draft, activation, live-session query, step advance/return, pause/resume, complete, and cancel operations with deterministic success and error payloads.
- Regenerate committed OpenAPI and the typed fetch client from the executable route registry, and add transition, rollback, restart, and conflict coverage.

## Impact

- Affected areas are SQLite migrations and repositories, backend command/query dispatch, the executable API contract, committed OpenAPI, and `frontend/src/api/generated/`.
- The active-session projection exposes status, current step, optional next step, and preserved execution timing and notes; it does not add a frontend screen.
- No server timer, automatic progression, push notification, hardware/probe integration, LLM coaching, multi-user behavior, full planning editor, or historical logbook UI is introduced.
- The affected architecture/documentation source of truth must distinguish the implemented API-to-SQLite live-session flow from still-planned product behavior.
