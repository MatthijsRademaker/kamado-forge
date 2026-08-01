# kamado-ui-primitives Specification

## Purpose
TBD - created by archiving change task-367e0c64-cb00-4fab-9c2b-6d1c56209a66. Update Purpose after archive.
## Requirements
### Requirement: Semantic Kamado visual foundation

The frontend MUST provide semantic Tailwind/CSS tokens for core, surface, text, border, accent, and feedback roles that express dark charcoal layered surfaces, ember-orange emphasis, restrained outlines, and semantic status colors. Primitive and composition classes MUST consume those semantic tokens rather than component-local raw feature color values, and visible focus treatment MUST remain perceptible on intended dark surfaces.

#### Scenario: A primitive renders a themed state

- **WHEN** a Button, Card, Badge, form control, progress display, or status display renders a surface, text, border, accent, feedback, or focus state
- **THEN** it uses the semantic token layer and preserves the Kamado dark charcoal-and-ember visual hierarchy without embedding one-off feature color values.

### Requirement: Registry primitive boundary and reusable API

The frontend MUST place registry-derived Button, Card, Badge, Input, Textarea, Progress, Tabs, Dialog, and Sheet primitives under `frontend/src/components/ui`. Each named primitive MUST expose an independently usable generic prop, slot, attribute, and variant contract as applicable, use `cn()` for class composition, and avoid embedded session, coach, learn, logbook, user, or telemetry feature data.

#### Scenario: A future composition consumes a primitive

- **WHEN** a composition supplies a primitive's content, label, value, or variant
- **THEN** it can do so through the primitive's public props, slots, or forwarded attributes without changing the primitive source or relying on showcase sample data.

#### Scenario: A primitive source file is placed in the frontend

- **WHEN** the named registry-derived primitive is added
- **THEN** its source is under `frontend/src/components/ui` and custom Kamado composition code does not become a dependency of that primitive.

### Requirement: Accessible form, tab, and overlay interactions

Input and Textarea MUST support associated labels and applicable invalid or description relationships while retaining native control semantics and visible keyboard focus. Tabs, Dialog, and Sheet MUST compose shadcn-vue/Reka behavior rather than reimplementing focus-sensitive interaction logic. Tabs MUST support keyboard navigation; Dialog and Sheet MUST have accessible names, trap focus while open, close on Escape, and restore focus to their triggers when closed.

#### Scenario: A keyboard user operates tabs

- **WHEN** focus enters a Tabs control and the user uses its keyboard navigation
- **THEN** the active tab and associated panel follow the Reka tab interaction contract and focus remains visibly indicated.

#### Scenario: A keyboard user opens and closes an overlay

- **WHEN** a user opens a Dialog or Sheet from its trigger, navigates with the keyboard, and presses Escape
- **THEN** the named overlay contains focus while open, closes on Escape, and returns focus to its trigger.

#### Scenario: A user reaches a form field

- **WHEN** an Input or Textarea is rendered with a label and applicable help or invalid state
- **THEN** the control exposes the corresponding label and relationships to assistive technology and remains visibly focusable by keyboard.

### Requirement: Generic state, progress, temperature, and status compositions

Custom empty, loading, and error compositions MUST live outside `frontend/src/components/ui` and accept configurable content and action content through props or slots. Temperature and status displays MUST also live outside `frontend/src/components/ui` and accept caller-supplied labels, values, units, and semantic statuses rather than embedding product data. Temperature conversion MUST remain with the caller; a display MAY format the supplied value and unit and MUST expose a human-readable readout. When a temperature gauge or Progress is determinate, it MUST expose value and bounds semantics; when indeterminate, it MUST expose an accessible indeterminate state.

#### Scenario: A feature supplies state content

- **WHEN** a future composition renders an empty, loading, or error state
- **THEN** it can supply its own content and action content through the state composition's public props or slots without inheriting feature-specific copy or actions.

#### Scenario: A feature supplies a temperature or status

- **WHEN** a future composition passes a numeric temperature, unit, label, bounds, or semantic status
- **THEN** the display renders a human-readable, domain-neutral readout and bounded gauge/status semantics without fetching data or converting units.

### Requirement: Direct responsive primitive showcase

The application MUST make `/showcase` directly reachable through the application shell while `/` and `/today` render Today and `/live` renders Live. The showcase MUST live outside `components/ui`, own its illustrative sample data and interaction state, demonstrate the public variants and interactive states of every named primitive and custom composition, and MUST NOT own session-flow state or fetch product data.

#### Scenario: A visitor opens the showcase URL

- **WHEN** a visitor directly loads `/showcase` in the served frontend
- **THEN** a responsive primitive gallery renders instead of Today or Live content

#### Scenario: A visitor uses a narrow viewport

- **WHEN** the showcase is viewed at a narrow mobile width
- **THEN** controls, forms, tabs, dialogs, and sheets remain readable and operable without clipped controls or page-level horizontal overflow, while sections use multiple columns only where space permits

#### Scenario: A visitor opens a product route

- **WHEN** a visitor directly loads `/`, `/today`, or `/live`
- **THEN** the corresponding product view renders without moving session-flow behavior into generic UI primitives

### Requirement: Verification of the component contract

The implementation MUST exercise the showcase's public variants and keyboard-sensitive interactions, verify a direct served `/showcase` visit and a narrow viewport, and complete `scripts/precommit-run` successfully.

#### Scenario: The change is prepared for completion

- **WHEN** implementation and interaction smoke checks are complete
- **THEN** `scripts/precommit-run` completes successfully and the checks cover visible focus, keyboard tabs, form labels, Dialog and Sheet focus behavior, direct `/showcase` reachability, and narrow-width operability.
