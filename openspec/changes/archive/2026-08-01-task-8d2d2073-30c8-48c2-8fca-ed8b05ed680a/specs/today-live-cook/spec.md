# Today and Live Cook Specification

## ADDED Requirements

### Requirement: Canonical product routes and deterministic fixtures

The frontend MUST resolve `/` and `/today` to Today, `/live` to Live, and `/showcase` to the preserved internal component showcase. The Today and Live routes MUST support direct navigation and refresh under the existing development and built-preview serving model.

The frontend MUST provide a documented, whitelisted local `fixture` query selector for `no-session`, `draft`, `active-running`, and `active-paused`. Every required Today state and Live running/paused variant MUST have a direct, repeatable fixture URL and MUST render without a backend or API request.

#### Scenario: Today is the application entry

- **WHEN** a user directly opens `/` or `/today` with a supported Today fixture
- **THEN** the corresponding Today state renders without first visiting another route or contacting a backend

#### Scenario: Live variants are directly exercisable

- **WHEN** a reviewer directly opens `/live` with the active-running or active-paused fixture
- **THEN** Live renders the selected fixture baseline repeatably without hidden prior interactions

#### Scenario: Showcase remains available

- **WHEN** a user directly opens or refreshes `/showcase`
- **THEN** the internal component showcase renders rather than a Today or Live fixture

### Requirement: Fixtures remain coupled to the generated session boundary

Fixture durable fields MUST be statically checked against the authoritative generated session contract through the imported generated type or an explicitly contract-owner-approved generated-type-derived alias. Generated files MUST remain read-only, and the feature MUST NOT define an independent transport DTO, import an API client for session behavior, issue a network request, or persist fixture mutations.

Fixture seeds MUST remain immutable and MUST be cloned into mounted in-memory state. Reloading or recreating the application MUST restore the selected fixture baseline.

#### Scenario: A fixture is authored

- **WHEN** a developer adds or changes a session fixture
- **THEN** static checking validates its durable fields against the approved generated session boundary without editing generated output

#### Scenario: A mounted fixture changes

- **WHEN** a user pauses, changes steps, or edits a note and then reloads the application
- **THEN** the selected fixture returns to its baseline with no network or persistence behavior

### Requirement: Today communicates the session lifecycle

Today MUST render distinct no-session, draft, and active states from the selected local fixture. The no-session state MUST provide a clear empty state and primary plan/start intent without implementing a Plan page. The draft state MUST show the planned cook summary and a Start cook action. The active state MUST show current progress and a Continue cook action, or a Resume cook action when paused.

Starting a draft MUST activate the mounted local session and enter Live. Continuing or resuming an active fixture MUST enter Live using the same in-memory controller state.

#### Scenario: No session is selected

- **WHEN** Today loads the no-session fixture
- **THEN** it shows a clear empty state and primary plan/start intent without presenting stale cook progress

#### Scenario: A draft is ready

- **WHEN** Today loads the draft fixture and the user activates Start cook
- **THEN** the mounted session becomes active and Live displays its first step

#### Scenario: An active cook can be continued

- **WHEN** Today loads an active-running or active-paused fixture
- **THEN** it shows current progress and a Continue cook or Resume cook action that opens Live

### Requirement: Live prioritizes glanceable planned guidance

Live MUST present the complete current-action instruction and clearly label both dome and food values as planned targets with units. At a 320-by-568 CSS-pixel viewport, the complete action and both planned target readouts MUST be visible without vertical scrolling, and the page MUST have no page-level horizontal overflow.

Live MUST present setup guidance and vent guidance as distinct readable instructions. It MUST also show elapsed time alongside planned duration, determinate step or session progress, and the next step. The view MUST NOT describe fixture targets as measured readings or imply probe connectivity.

#### Scenario: A cook checks the first viewport outdoors

- **WHEN** the active-running Live fixture is viewed at 320 by 568 CSS pixels without scrolling
- **THEN** the complete current action and labeled planned dome and food target values and units are visible within the viewport with no page-level horizontal overflow

#### Scenario: Supporting guidance is inspected

- **WHEN** a user reads the active Live view
- **THEN** setup guidance, vent guidance, elapsed and planned timing, determinate progress, and next-step content are distinct and understandable without sensor telemetry

### Requirement: One local controller owns mounted session interactions

One in-memory session-flow controller MUST own draft activation, pause/resume, elapsed calculation, ordered step navigation, note retention, and terminal transitions for Today and Live. Elapsed time MUST advance only while the mounted active session is running, MUST freeze while paused, MUST resume after Resume, and MUST stop when the view/controller is unmounted.

Back MUST be disabled at the first step. Advance MUST be disabled at the final step, where completion remains a separate Finish cook action. Back and Advance MUST update the current action, targets, setup guidance, vent guidance, timing/progress, and next-step content consistently. A labeled session-scoped note control MUST accept keyboard and touch input, retain its local value across step navigation, and perform no network write.

#### Scenario: A running cook is paused and resumed

- **WHEN** a user activates Pause and later Resume during the mounted active fixture
- **THEN** the visible status/action changes appropriately, elapsed advancement freezes while paused, and advancement resumes only after Resume

#### Scenario: Step boundaries are enforced

- **WHEN** a user reaches the first or final ordered fixture step
- **THEN** Back is disabled at the first step, Advance is disabled at the final step, and Finish cook remains a separate action

#### Scenario: Step content changes atomically

- **WHEN** a user activates an enabled Back or Advance action
- **THEN** action, planned targets, guidance, timing/progress, and next-step content all reflect the resulting step

#### Scenario: A note survives step navigation

- **WHEN** a user enters a note and navigates backward or forward within the mounted fixture
- **THEN** the same session-scoped note remains available until the fixture baseline is restored

### Requirement: Terminal actions require accessible confirmation

Finish cook and Cancel cook MUST each open a separately named confirmation dialog that describes the consequence and provides explicit confirm and cancel actions. Canceling or pressing Escape MUST close the dialog, leave the session unchanged, and restore focus to its trigger. Only explicit confirmation MUST perform the terminal transition. Confirmed Finish cook and confirmed Cancel cook MUST leave Live and render Today's no-session state.

#### Scenario: A terminal action is dismissed

- **WHEN** a user opens either terminal dialog and cancels it or presses Escape
- **THEN** the session remains unchanged and keyboard focus returns to the action that opened the dialog

#### Scenario: A terminal action is confirmed

- **WHEN** a user explicitly confirms Finish cook or Cancel cook
- **THEN** Live closes and Today renders its no-session state

### Requirement: Outdoor controls and verification are accessible

All Today and Live interactive controls MUST have accessible names, be operable by keyboard, and expose visible focus. Primary outdoor controls and confirmation actions MUST expose at least 44-by-44 CSS-pixel touch areas and MUST NOT overlap at 320px width. Existing generic Forge primitives MUST be reused where their contracts fit; feature-specific sizing MUST NOT broaden generic APIs without a shared need.

Automated frontend checks MUST cover every Today state, Live running and paused states, step boundaries, note entry and retention, both dialog dismissal and confirmation paths, keyboard focus restoration, 320-by-568 above-fold bounds, touch target geometry, absence of horizontal overflow, direct routes, and preserved showcase behavior. Frontend checks and `scripts/precommit-run` MUST complete successfully.

#### Scenario: Controls are used without a pointer

- **WHEN** a keyboard user traverses and activates Today or Live controls and dialogs
- **THEN** each control has an accessible name, visible focus, expected keyboard behavior, and focus restoration after dialog dismissal

#### Scenario: Controls fit a narrow outdoor layout

- **WHEN** the Live view is measured at 320 CSS pixels wide
- **THEN** primary and confirmation controls provide at least 44-by-44 CSS-pixel touch areas without overlap or page-level horizontal overflow

#### Scenario: The change is verified

- **WHEN** the implementation is prepared for completion
- **THEN** deterministic frontend and browser checks cover the required fixture states and interactions and `scripts/precommit-run` completes successfully
