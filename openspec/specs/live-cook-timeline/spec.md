# live-cook-timeline Specification

## Purpose
TBD - created by archiving change live-cook-timeline-spine. Update Purpose after archive.
## Requirements
### Requirement: Live Cook renders one continuous timeline spine

Live Cook SHALL render the live-cook projection as a single vertically scrollable timeline containing, in order: plan-level pre-cook guidance, then for each phase a phase divider followed by that phase's entries, with completed execution history preceding the current step and remaining planned steps following it.

Completed execution history, the current step, and remaining planned steps MUST occupy one scroll container. Remaining planned steps MUST NOT be placed behind a disclosure control or a separate panel.

Past entries, the current step, and future entries MUST be visually distinguishable from one another without relying on color alone. The current step MUST be the most visually prominent region on the page; no other region may compete with it for primacy.

#### Scenario: A cook opens an active session

- **WHEN** an active live-cook session is loaded
- **THEN** the page renders completed history above the current step, the current step as the single dominant region, and remaining planned steps below it, all within one scroll container

#### Scenario: The arc of the cook is visible

- **WHEN** a cook scrolls the timeline of a multi-phase session
- **THEN** each phase is introduced by a divider carrying its title, technique, and transition guidance, and every planned step of every phase is reachable by scrolling

### Requirement: Execution history renders as ordered visits with owned notes

The timeline SHALL render each entry of `executionHistory` as a distinct past-visit entry showing its step title, its actual start time, and its actual duration. Visits MUST render in the order the projection supplies and MUST NOT be merged, deduplicated by step, or reduced to a set of completed steps.

Notes MUST render nested beneath the visit that owns them. Notes MUST NOT be pooled into a single session-level list detached from their visits.

A step entered more than once MUST render one entry per visit, each labeled with its attempt so the repeated entries are not read as duplicates.

#### Scenario: A non-linear cook is rendered

- **WHEN** a session's execution history contains a step ordinal that decreases between consecutive visits
- **THEN** the timeline renders every visit in order, renders a return marker at the point the ordinal decreased, and labels the repeated step's later visit with its attempt

#### Scenario: A note is attributed to its visit

- **WHEN** a session has notes recorded against more than one visit
- **THEN** each note renders beneath the visit that owns it and no note appears detached from its visit

#### Scenario: Repeated returns each render

- **WHEN** a cook issues the return command more than once in succession
- **THEN** the timeline renders a separate return marker for each return and a separate visit entry for each entered step

### Requirement: The timeline is the progress indicator

Timeline position SHALL be the view's progress indicator. Live Cook MUST NOT render a determinate progress bar or a session-completion percentage.

Because no graphical progress element remains, the view MUST expose the cook's position as text available to assistive technology, stating the current step position within the total step count and elapsed time against the current step's planned duration.

Live values that update continuously MUST be announced from exactly one live region. Where the same elapsed or position value appears in more than one place, only one occurrence may be an assertive or polite live region.

#### Scenario: Position is available without a progress bar

- **WHEN** a screen reader user reaches the current step
- **THEN** the current step position within the total step count and the elapsed time against the planned duration are announced as text, and no determinate progress element or completion percentage is present

#### Scenario: Elapsed time is announced once

- **WHEN** elapsed time is displayed in both the current-step region and a pinned region
- **THEN** exactly one of them updates an assistive-technology live region and the elapsed value is not announced twice

### Requirement: Planned and actual time are both legible

The timeline SHALL present planned time and actual time as distinguishable quantities. Each past visit MUST show its actual duration against its planned duration and MUST indicate the direction and size of any difference. The remaining plan MUST show a projected finish time.

Projected finish MUST be presented as an approximation and MUST NOT be presented as a commitment or a deadline.

Planned and projected values MUST NOT be presented as measured readings, and no temperature surface may imply probe or controller connectivity.

#### Scenario: A cook checks whether they are behind

- **WHEN** a cook reads a completed visit whose actual duration differs from its planned duration
- **THEN** the entry states the actual duration, the planned duration, and the direction and size of the difference

#### Scenario: A cook checks when the cook ends

- **WHEN** an active session has remaining planned steps
- **THEN** the timeline presents an approximate projected finish time, marked as approximate

### Requirement: Derived timeline construction is pure and separately testable

Return markers, attempt counts, per-visit drift, phase membership of a flat step ordinal, and projected finish SHALL be derived in the frontend from the live-cook projection without a contract, projection, persistence, or generated-client change.

Derivation MUST live in a module that produces the ordered entry sequence as data and is testable without mounting a component. Feature components MUST consume that sequence rather than re-deriving position, ordinal mapping, or drift locally.

The same phase-membership mapping MUST NOT be implemented a second time; the existing flat-ordinal-to-phase mapping used by Coach MUST be shared rather than duplicated.

#### Scenario: The entry sequence is unit tested

- **WHEN** a live-cook projection containing multiple phases, repeated visits, returns, and notes is passed to the derivation module
- **THEN** it returns the ordered entry sequence including return markers, attempt counts, and drift, verifiable without rendering a component

#### Scenario: Derivation adds no contract surface

- **WHEN** the timeline is implemented
- **THEN** no request or response schema, generated OpenAPI document, or generated client module changes, and the API drift check passes

### Requirement: Pinned action composer and pinned now context

Live Cook SHALL pin an action composer to the viewport carrying the note input, the pause or resume control, and the step navigation controls. The primary step-advance action MUST be reachable in the composer without scrolling the page, at every supported viewport width.

Terminal actions MAY be placed behind an overflow control within the composer and MUST retain their existing named confirmation dialogs, consequence descriptions, explicit confirm and cancel actions, escape dismissal, and focus restoration.

When the current-step region is scrolled out of view, Live Cook SHALL pin a slim context region carrying session status, step position, elapsed time against planned duration, both labeled planned targets, and the primary step-advance action.

Pinned regions MUST NOT obscure the current-step region when it is in view, and the composer MUST remain usable while the on-screen keyboard is open.

#### Scenario: The primary action is reachable at narrow width

- **WHEN** Live Cook is displayed at 390 CSS pixels wide with an active session
- **THEN** the step-advance action is visible without scrolling the page

#### Scenario: Context survives scrolling into history

- **WHEN** a cook scrolls up far enough that the current-step region leaves the viewport
- **THEN** a pinned region presents session status, step position, elapsed against planned, both labeled planned targets, and the step-advance action

#### Scenario: A note is composed with the keyboard open

- **WHEN** a cook focuses the note input on a touch device and the on-screen keyboard opens
- **THEN** the note input and its submit action remain visible and operable

### Requirement: Scroll position follows the current step

On load, the timeline scroll position SHALL resolve to the current-step region rather than to the top or the bottom of the container.

When a step-advance or step-return command is confirmed, the scroll position SHALL animate to the resulting current-step region. Under `prefers-reduced-motion: reduce`, the position MUST change without animation.

The scroll container MUST NOT anchor to the end of its content, because the end of the content is the projected finish rather than the current step.

#### Scenario: A session is opened mid-cook

- **WHEN** a cook opens a session whose current step is preceded by completed history
- **THEN** the initial scroll position shows the current-step region without the cook scrolling

#### Scenario: A step change repositions the timeline

- **WHEN** a step-advance or step-return command is confirmed
- **THEN** the scroll position animates to the new current-step region, or repositions without animation when reduced motion is requested

### Requirement: Plan-level guidance occupies its chronological position

Setup guidance, vent guidance, deflector guidance, and heat-zone guidance SHALL render as one labeled entry at the head of the timeline, before the first phase divider, reflecting that they describe conditions established before the cook began.

The entry MUST remain reachable and clearly labeled at every viewport width. It MUST NOT render at the same visual weight as the current-step region.

#### Scenario: Setup guidance is consulted mid-cook

- **WHEN** a cook needs vent or setup guidance during an active step
- **THEN** the labeled plan-guidance entry is reachable from the timeline and presents setup, vent, deflector, and heat-zone guidance as distinct readable instructions

#### Scenario: Plan guidance does not compete with live state

- **WHEN** an active session is rendered
- **THEN** the plan-guidance entry is subordinate in visual weight to the current-step region

### Requirement: Terminal sessions render as the same closed timeline

A `COMPLETED` or `CANCELLED` session SHALL render through the same timeline as an active session, with the action composer absent, remaining planned steps absent, the final visit presented as the last entry, and a closing entry stating the terminal status.

The terminal rendering MUST remain reachable at its own session route without depending on active-session lookup, and MUST present persisted notes read-only.

#### Scenario: A completed cook is reviewed

- **WHEN** a completed session route is loaded directly
- **THEN** it renders the same timeline shape showing full execution history with actual times and drift, no composer, no future steps, and a closing entry stating the terminal status

#### Scenario: Past notes are not editable

- **WHEN** any session's past visits carry notes
- **THEN** those notes render read-only and no control offers to edit or reattach them

### Requirement: Timeline entries carry stable durable identity

Every timeline entry derived from durable state SHALL render against the durable identifier the projection supplies for it, so a later capability can address an individual entry without re-deriving its position.

This requirement adds no comment, annotation, or coach affordance to the timeline.

#### Scenario: An entry is addressable

- **WHEN** the timeline renders a visit, a note, or a planned step
- **THEN** that entry is associated with the durable identifier the projection supplies for it

### Requirement: Timeline behavior is verified

Automated checks SHALL cover the derived entry sequence for a projection containing multiple phases, repeated visits, at least one return, and notes on more than one visit; note attribution to the owning visit; absence of a determinate progress element; assistive-technology availability of step position and elapsed-against-planned; single-live-region announcement of elapsed time; reachability of the step-advance action without page scrolling at 390 CSS pixels; the above-fold composition at 320 by 568 CSS pixels; absence of page-level horizontal overflow; initial scroll resolution to the current step; reduced-motion repositioning; and the terminal rendering at its own route.

Frontend checks and `scripts/precommit-run` MUST complete successfully.

#### Scenario: The change is verified

- **WHEN** the implementation is prepared for completion
- **THEN** deterministic frontend and browser checks cover the listed timeline behaviors and `scripts/precommit-run` completes successfully

