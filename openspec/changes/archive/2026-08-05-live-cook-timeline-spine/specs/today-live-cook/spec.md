# today-live-cook Specification

## MODIFIED Requirements

### Requirement: Live prioritizes glanceable planned guidance

Live MUST present the complete current-action instruction and clearly label both dome and food values as planned targets with units. At a 320-by-568 CSS-pixel viewport, the complete action and both planned target readouts MUST be visible without vertical scrolling, and the page MUST have no page-level horizontal overflow.

This above-fold composition MUST be satisfied by the current-step region together with the pinned context and composer regions. Where the composition cannot fit all required content at 320 by 568, the pinned context region's planned-target row MUST collapse before the current-action text is truncated, because the requirement is the *complete* action.

Live MUST present setup guidance and vent guidance as distinct readable instructions; they MAY be presented in a labeled, reachable, subordinate region rather than at the same visual weight as the current step. Live MUST also show elapsed time alongside planned duration, the next step, and position within the cook. Position MUST be conveyed by the rendered timeline rather than by a determinate progress bar or completion percentage, and MUST remain available to assistive technology as text. The view MUST NOT describe targets as measured readings or imply probe connectivity.

#### Scenario: A cook checks the first viewport outdoors

- **WHEN** the Live view is displayed at 320 by 568 CSS pixels without scrolling
- **THEN** the complete current action and labeled planned dome and food target values and units are visible within the viewport with no page-level horizontal overflow

#### Scenario: Supporting guidance is inspected

- **WHEN** a user reads the active Live view
- **THEN** setup guidance, vent guidance, elapsed and planned timing, timeline position, and next-step content are distinct and understandable without sensor telemetry

#### Scenario: The above-fold composition is constrained

- **WHEN** the required above-fold content cannot all fit at 320 by 568 CSS pixels
- **THEN** the pinned context region's planned-target row collapses and the complete current-action text remains untruncated
