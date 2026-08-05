# session-workflow-integration Specification

## MODIFIED Requirements

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
