# session-flow-blueprint Specification

## Purpose
TBD - created by archiving change task-8429f6e7-f88c-44b1-a35c-5ef7f9c7945c. Update Purpose after archive.
## Requirements
### Requirement: Self-contained six-layout session blueprint
The project SHALL add `designs/session-flow.md` as a self-contained, text-only Markdown UX contract with six legible ASCII layouts: desktop and mobile layouts for Today, Plan, and active Live Cook. Each layout SHALL name every visible region, its purpose, and its primary action. In both form factors, the fixed primary navigation SHALL use exactly `Today`, `Plan`, `Coach`, `Learn`, and `Logbook`; Live Cook SHALL be an entered session state rather than a sixth primary destination.

#### Scenario: A worker inspects all required view blueprints
- **WHEN** a worker reads the Today, Plan, and Live Cook portions of the document for either desktop or mobile
- **THEN** the worker finds a distinct ASCII layout with its visible regions and primary action named, plus the five required primary navigation labels

#### Scenario: An active cook is reached without changing primary navigation
- **WHEN** a user starts a planned session or continues an active session from Today
- **THEN** the blueprint identifies Live Cook as the active session state while retaining the five-item primary navigation model

### Requirement: Today and Plan state coverage
The blueprint SHALL define Today variants for no active session, resumable active session, loading, and error, each with a named primary action and applicable safe recovery path. It SHALL define Plan empty/new-plan, loading, error, and editable draft states. An editable draft SHALL show an ordered cooking-day timeline with durations and named transition points, planned/manual target dome and food temperatures, kamado setup including fuel, deflector or heat-zone arrangement and prep, vent/fire guidance, and a primary `Start Live Cook` action whose incomplete-plan behavior is described.

#### Scenario: A user creates and starts a draft plan
- **WHEN** Today has no active session and the user chooses to plan a cook
- **THEN** the blueprint directs the user to a new Plan draft where timeline, targets, setup, vent guidance, and transitions can be edited before `Start Live Cook` becomes available according to the documented incomplete-plan behavior

#### Scenario: A Plan request cannot be completed
- **WHEN** Plan is loading or enters an error state
- **THEN** the blueprint names the available retry or safe-return action and does not imply creation of a duplicate active session

### Requirement: Actionable active Live Cook guidance

The active Live Cook layouts SHALL keep the current step and immediate action visually primary and unobstructed. They SHALL expose the next step, timeline position or progress, applicable transition prompt, planned/manual target dome temperature, planned/manual target food temperature, current kamado vent and setup guidance, pause and finish controls, and a Coach handoff. Every temperature surface SHALL distinguish planned/manual guidance from unsupported hardware probe or controller readings.

The active Live Cook layouts SHALL describe a single continuous timeline in which completed execution history precedes the current step and remaining planned steps follow it, with the current step marked as the boundary between them. They SHALL name the pinned action region carrying the primary step-advance action, and the pinned context region that presents status, position, elapsed-against-planned time, and both planned/manual targets when the current step is scrolled out of view.

Timeline position SHALL be conveyed by the described timeline itself. The layouts SHALL NOT depict a determinate progress bar or a session-completion percentage as the progress indicator.

The layouts SHALL depict a cook that has moved backward through its steps, so the blueprint documents a non-linear cook rather than only a forward walkthrough.

#### Scenario: A user follows an active step outdoors

- **WHEN** a user opens active Live Cook during a cooking session
- **THEN** the blueprint presents the immediate action, both planned/manual temperature targets, and current vent/setup guidance before or without obscuring access to secondary information, and identifies the next step and Coach handoff

#### Scenario: The blueprint describes the timeline shape

- **WHEN** a worker reads the active Live Cook layouts
- **THEN** the layouts show completed history above the current step, remaining planned steps below it, the pinned action region carrying step-advance, and the pinned context region, without depicting a determinate progress bar as the progress indicator

#### Scenario: The blueprint describes a non-linear cook

- **WHEN** a worker reads the active Live Cook layouts
- **THEN** at least one layout depicts a step revisited after moving backward, distinguishable from its earlier visit

### Requirement: Explicit session transitions and recovery
The blueprint SHALL provide one state matrix and transition table covering Today empty, resumable, loading, and error; Plan empty/new, editable draft, loading, and error; and Live Cook active, paused, transition-pending or overdue, finished handoff, loading, and error. It SHALL specify Today-to-Plan, draft-Plan-to-Live-Cook, phase-to-phase, pause/resume, missed-transition recovery, and finish-to-Logbook transitions. Pausing SHALL freeze planned action and timeline progression and visibly mark the session paused; resume SHALL report wall-clock delay without silently advancing. An overdue transition SHALL be visibly labeled, SHALL not auto-advance, and SHALL offer acknowledge/mark-transition-done-and-continue plus Coach handoff. Finish SHALL require confirmation, capture planned-versus-actual timing and notes/results for a reviewable Logbook context, and allow canceling finish without losing active-session state. Loading and error paths SHALL preserve a safe retry or return path without creating a duplicate session.

#### Scenario: A user resumes a paused cook
- **WHEN** a user pauses and later resumes an active Live Cook
- **THEN** the blueprint keeps planned progression frozen while paused, labels the paused state, reports elapsed wall-clock delay on resume, and does not silently advance the timeline

#### Scenario: A transition is overdue
- **WHEN** the planned time for a live phase transition has passed without completion
- **THEN** the blueprint shows an overdue or delayed state, offers acknowledge/mark-transition-done-and-continue and Coach handoff, and does not auto-advance the session

#### Scenario: A user finishes a cook
- **WHEN** a user selects finish from active Live Cook
- **THEN** the blueprint defines a confirmation flow that captures planned-versus-actual timing and notes/results before returning to reviewable Logbook context, while cancel returns to the cook without loss of state

### Requirement: Intentional responsive and outdoor behavior

The blueprint SHALL define responsive behavior rather than merely stacking desktop content. Desktop SHALL describe persistent primary navigation and multi-column or panel-based information density. Mobile SHALL retain the five fixed navigation labels in a persistent bottom bar, keep current action and both planned/manual targets immediately visible, move secondary setup and vent details into labeled collapsible sections or action sheets, and define overlays for Coach, pause, and finish flows. Outdoor-glanceability rules SHALL prescribe high contrast on charcoal surfaces, readable type size, large touch targets, short action-oriented copy, labels or icons in addition to color for status, and an unobstructed current-action/temperature region. Visual-language notes MAY use charcoal surfaces, ember-orange emphasis, outlined cards, restrained line icons, and smoke/fire texture, but SHALL NOT restore obsolete `Chat`, `Progress`, or `Memory` primary navigation.

For active Live Cook, the timeline SHALL NOT be treated as secondary content moved behind a collapsible section on mobile; it is the primary structure. Mobile SHALL keep the primary step-advance action reachable without scrolling the page, and SHALL describe how the pinned action region coexists with the persistent bottom navigation.

#### Scenario: A user views Live Cook on mobile outdoors

- **WHEN** a user opens active Live Cook on a mobile device
- **THEN** the blueprint keeps the current action and both planned/manual targets immediately visible, keeps the step-advance action reachable without page scrolling, makes secondary setup and vent content explicitly collapsible or action-sheet based, preserves the five-item navigation, and applies the stated outdoor-glanceability rules

#### Scenario: Pinned regions coexist with fixed navigation

- **WHEN** a worker reads the mobile active Live Cook layout
- **THEN** the layout shows how the pinned action region and the persistent bottom navigation occupy the same edge without obscuring one another

### Requirement: Documentation-only boundary and verification
This change SHALL remain limited to the session-flow design documentation. It SHALL NOT introduce Vue routes, components, styling implementation, backend schema or API contracts, persistence, probe/controller behavior, telemetry, or architecture changes. The completed change SHALL be manually reviewed for the specified layouts, regions, actions, states, transitions, responsive behavior, and outdoor rules, and `scripts/precommit-run` SHALL complete successfully.

#### Scenario: The blueprint change is verified
- **WHEN** the session-flow document is complete
- **THEN** the implementation review confirms the required text-only UX coverage and `scripts/precommit-run` succeeds without requiring product implementation changes

