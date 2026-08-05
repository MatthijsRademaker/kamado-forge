# session-flow-blueprint Specification

## MODIFIED Requirements

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

### Requirement: Intentional responsive and outdoor behavior

The blueprint SHALL define responsive behavior rather than merely stacking desktop content. Desktop SHALL describe persistent primary navigation and multi-column or panel-based information density. Mobile SHALL retain the five fixed navigation labels in a persistent bottom bar, keep current action and both planned/manual targets immediately visible, move secondary setup and vent details into labeled collapsible sections or action sheets, and define overlays for Coach, pause, and finish flows. Outdoor-glanceability rules SHALL prescribe high contrast on charcoal surfaces, readable type size, large touch targets, short action-oriented copy, labels or icons in addition to color for status, and an unobstructed current-action/temperature region. Visual-language notes MAY use charcoal surfaces, ember-orange emphasis, outlined cards, restrained line icons, and smoke/fire texture, but SHALL NOT restore obsolete `Chat`, `Progress`, or `Memory` primary navigation.

For active Live Cook, the timeline SHALL NOT be treated as secondary content moved behind a collapsible section on mobile; it is the primary structure. Mobile SHALL keep the primary step-advance action reachable without scrolling the page, and SHALL describe how the pinned action region coexists with the persistent bottom navigation.

#### Scenario: A user views Live Cook on mobile outdoors

- **WHEN** a user opens active Live Cook on a mobile device
- **THEN** the blueprint keeps the current action and both planned/manual targets immediately visible, keeps the step-advance action reachable without page scrolling, makes secondary setup and vent content explicitly collapsible or action-sheet based, preserves the five-item navigation, and applies the stated outdoor-glanceability rules

#### Scenario: Pinned regions coexist with fixed navigation

- **WHEN** a worker reads the mobile active Live Cook layout
- **THEN** the layout shows how the pinned action region and the persistent bottom navigation occupy the same edge without obscuring one another
