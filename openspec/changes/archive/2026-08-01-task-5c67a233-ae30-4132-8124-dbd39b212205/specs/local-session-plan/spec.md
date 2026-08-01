# Local Session Plan Specification

## ADDED Requirements

### Requirement: Canonical generated session-plan boundary

The change MUST establish a contract-owned session-plan schema and generated frontend type before implementing Plan fixtures. The schema MUST cover the editable title, date, ordered phases and steps, canonical timing values, technique, planned dome and food targets with units, setup, vent/fire guidance, transition guidance, and prep notes. The contract/readiness matrix MUST settle representations, units, ranges, duration authority, field requiredness, stable identity needs, and the typed empty-draft representation. Every data-bearing fixture MUST be statically checked against the generated type with `satisfies` or equivalent, frontend feature code MUST NOT declare duplicate session, phase, or step DTOs, and generated files MUST NOT be manually edited. This contract addition MUST NOT add a session network endpoint.

#### Scenario: A developer defines a Plan fixture

- **WHEN** complete, incomplete, or empty draft payload data is added to the fixture registry
- **THEN** the payload is compile-time checked against the regenerated canonical session-plan type and no parallel frontend domain DTO is introduced.

#### Scenario: The contract is regenerated

- **WHEN** the repository API generation and drift checks run after the schema is added
- **THEN** the OpenAPI and frontend generated artifacts reproduce the canonical session-plan type without exposing a session endpoint or requiring manual generated-file changes.

### Requirement: Route-thin Plan shell

The application MUST directly render `/plan` on navigation and refresh through the existing pathname-based mount without Vue Router, MUST preserve existing root and direct `/showcase` behavior, and MUST present Today, Plan, Coach, Learn, and Logbook in that order with Plan visibly and programmatically current. Unsupported navigation destinations MUST NOT introduce out-of-scope product flows.

#### Scenario: A visitor directly opens Plan

- **WHEN** the visitor loads or refreshes `/plan`
- **THEN** the Plan experience renders with Plan marked current in the five-item navigation and no router or server navigation is required.

#### Scenario: A visitor opens the primitive showcase

- **WHEN** the visitor directly loads `/showcase`
- **THEN** the existing showcase remains reachable and is not replaced by the Plan feature.

### Requirement: Deterministic local fixture lifecycle

The Plan feature MUST support `complete`, `incomplete`, `empty`, `loading`, and `error` states through the documented local `fixture` query parameter. Data-bearing fixture definitions MUST remain immutable and contract typed; entering or reselecting a data-bearing state MUST deep-clone its payload into local reactive state. Loading and error MUST be explicit non-data states rather than malformed session plans. Refresh or fixture reselection MUST discard edits, and every create, retry, reset, or return action MUST be deterministic and local, with no fetch, API client, durable storage, backend session creation, or persistence claim.

#### Scenario: A reviewer selects each fixture state

- **WHEN** `/plan` is opened with any supported `fixture` query value
- **THEN** the corresponding complete, incomplete, empty, loading, or error composition is shown without a network request.

#### Scenario: A user edits and refreshes a fixture draft

- **WHEN** the user changes a cloned draft and then refreshes or reselects its fixture
- **THEN** the local edits are discarded and the selected immutable fixture definition is cloned again without saved-state messaging.

#### Scenario: A user invokes a state action

- **WHEN** the user creates from empty or invokes retry, reset, or return in a fixture state
- **THEN** only a documented local state transition occurs and no session is fetched, persisted, duplicated, or started.

### Requirement: Complete local Plan editing

A data-bearing Plan state MUST allow the user to edit the draft title, calendar date, ordered phases and nested steps, duration/timing, technique, planned dome and food targets, setup, vent/fire guidance, transition guidance, and prep notes entirely in memory. The editor MUST allow phases and steps to be added and removed and MUST retain at least the contract-valid editable representation after each operation.

#### Scenario: A user builds a draft from the empty state

- **WHEN** the user chooses the local create-draft action and supplies the contract-defined Plan fields
- **THEN** the page contains an editable in-memory cooking-day draft without making a request or writing durable storage.

#### Scenario: A user changes nested Plan content

- **WHEN** the user edits any scoped draft field or adds or removes a phase or step
- **THEN** the cloned local draft updates reactively while the fixture definition and generated contract artifacts remain unchanged.

### Requirement: Derived ordered timeline

Phase and step arrays MUST be the source of visible timeline order. The Plan model MUST derive displayed offsets and total timing through pure functions using explicit array order and the canonical duration authority; it MUST NOT persist derived offsets or totals in fixture payloads. Named move-up and move-down controls MUST update source array order consistently, and unavailable first/last moves MUST be disabled or omitted safely.

#### Scenario: A user reorders a phase or step

- **WHEN** the user activates an available move-up or move-down control
- **THEN** the visible order, derived offsets, and total timing update consistently from the new array order.

#### Scenario: An item is at an ordering boundary

- **WHEN** a phase or step is first or last in its containing array
- **THEN** the impossible move is unavailable and activating reorder controls cannot move the item outside its array.

### Requirement: Reactive readiness validation

Readiness validation MUST be a pure derivation from the local draft and the accepted canonical readiness matrix. It MUST react to edits, return a missing-or-invalid summary plus field paths and messages, associate each visible field error with its control, and keep completion unavailable while required data is missing or invalid. Invoking `Complete plan` on an invalid draft MUST name the missing requirements and focus the first invalid control. A valid draft MUST display a neutral local complete/ready state without saving the plan or offering a functional Live Cook transition.

#### Scenario: A draft is incomplete

- **WHEN** one or more contract-required values are missing or invalid
- **THEN** the readiness summary names the requirements, in-context messages are programmatically related to their controls, and the Plan is not shown as ready.

#### Scenario: A user requests completion of an invalid draft

- **WHEN** the user activates `Complete plan` while validation errors exist
- **THEN** the summary is exposed and keyboard focus moves to the first invalid control.

#### Scenario: A draft becomes valid

- **WHEN** the user corrects all errors defined by the readiness matrix
- **THEN** the page shows a non-persistence local Plan complete/ready state and does not start a cook.

### Requirement: Planned target semantics

Dome and food temperatures MUST always be presented as planned/manual targets using the canonical contract unit and MUST NOT be described or exposed as current readings, live values, probe data, controller state, or telemetry. Any reused temperature composition MUST provide a human-readable accessible target label and MUST avoid reading-oriented semantics for these fields.

#### Scenario: A target temperature is displayed or edited

- **WHEN** the Plan renders a dome or food temperature value
- **THEN** visible and accessible text identifies it as a planned/manual target in the canonical unit and does not imply live measurement.

### Requirement: Accessible nested Plan controls

Every Plan form control MUST have an accessible name and applicable description or error relationship. Add, remove, move-up, move-down, completion, fixture-state, disclosure, and navigation controls MUST be keyboard operable with visible focus, and move controls MUST have item-specific accessible names. Status MUST NOT rely on color alone, and interactive touch targets MUST be at least 44 by 44 CSS pixels.

#### Scenario: A keyboard user edits and reorders the Plan

- **WHEN** the user traverses the editor and invokes edit or mutation controls without a pointer
- **THEN** each action is named, visibly focused, operable, and leaves the draft in a valid deterministic local state.

#### Scenario: A user encounters an error or readiness status

- **WHEN** validation or fixture status is rendered
- **THEN** text and programmatic relationships communicate the state without requiring color perception.

### Requirement: Outdoor-readable responsive Plan composition

At desktop widths, the Plan MUST provide a clear ordered timeline composed with readiness, planned targets, setup, and vent guidance. At narrow widths, readiness and planned targets MUST precede labeled collapsible timeline and setup/vent sections, the five-item navigation MUST remain usable as a persistent bottom bar, content MUST reserve enough bottom and safe-area space to remain reachable, and the page MUST have no page-level horizontal overflow at 320px.

#### Scenario: A user views Plan at desktop width

- **WHEN** the available viewport supports the desktop composition
- **THEN** timeline, readiness, planned targets, setup, and vent guidance are visibly organized for scanning and editing.

#### Scenario: A user views Plan at 320px width

- **WHEN** the Plan is rendered in a 320px-wide viewport
- **THEN** readiness and planned targets appear before the collapsible detail sections, all controls and final content remain reachable above persistent navigation, and no page-level horizontal scrolling is required.

### Requirement: Plan behavior verification

Automated frontend tests MUST cover local draft creation and editing, nested add/remove/reorder including ordering boundaries, derived timing, reactive validation and first-invalid focus, every fixture state, refresh/reset behavior, direct `/plan` and `/showcase` navigation, keyboard operation, planned-target semantics, and the 320px layout. The sanctioned frontend checks and `scripts/precommit-run` MUST complete successfully before the change is considered complete.

#### Scenario: The Plan change is prepared for completion

- **WHEN** implementation and behavior checks are complete
- **THEN** the required unit and browser cases pass, the frontend checks pass, and `scripts/precommit-run` completes successfully.
