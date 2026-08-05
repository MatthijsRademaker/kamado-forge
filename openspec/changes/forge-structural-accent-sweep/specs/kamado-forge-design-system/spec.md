# kamado-forge-design-system Specification

## ADDED Requirements

### Requirement: Interaction surface is distinct from the warm accent

The stylesheet SHALL define a neutral interaction-surface token, and its paired foreground token, for hover, open, and highlighted-row states. That token MUST resolve to a neutral surface value drawn from the existing neutral ramp and MUST NOT resolve to the warm accent, to `ember`, or to `smoke`.

The warm accent MUST NOT be used as a hover surface, an open-state surface, or a highlighted-row surface for any control. Registry-derived components that inherit an upstream idiom in which the accent token means "subtle hover surface" MUST be repointed at the interaction-surface token.

Interaction-surface states MUST meet the same WCAG AA normal-text contrast floor of 4.5:1 for their paired foreground as the rest of the foundation.

#### Scenario: Hovering a low-emphasis control does not flood it with brand color

- **WHEN** a user hovers an outline or ghost button, or an outline badge rendered as a link
- **THEN** its background resolves to the neutral interaction surface and not to the warm accent

#### Scenario: An open overlay control does not adopt brand color

- **WHEN** a dialog is open and its close control renders its open state
- **THEN** its background resolves to the neutral interaction surface and not to the warm accent

#### Scenario: Interaction states stay readable

- **WHEN** a control renders its interaction-surface state with its paired foreground
- **THEN** the text contrast ratio is at least 4.5:1

### Requirement: Radius is selected by element class

Corner radius SHALL be derived from what an element is, according to this mapping, rather than chosen per component:

| Element class | Radius step |
|---|---|
| Hairline chrome, rails, dividers | `compact` |
| Controls, inputs, buttons, tabs | `tight` |
| Cards, panels, dialogs, sheets | `default` |
| Chips, badges, meters, avatars | `pill` |

Product and primitive code MUST select a Forge radius token and MUST NOT select a stock framework radius default.

The `roomy` step SHALL be retired from selection. It remains defined in the scale, and no product surface or registry primitive may select it. Introducing a new element class, or assigning an existing one a different step, MUST amend this mapping.

#### Scenario: An element selects its radius from its class

- **WHEN** a card, control, chip, or hairline element renders
- **THEN** its radius resolves to the step this mapping assigns to its element class

#### Scenario: Framework radius defaults are absent

- **WHEN** the frontend source is inspected
- **THEN** no product surface or registry primitive selects a stock framework radius default in place of a Forge radius token

#### Scenario: The retired step is unused

- **WHEN** the frontend source is inspected
- **THEN** no product surface or registry primitive selects the `roomy` step

### Requirement: Warm accent carries reserved structural roles

The warm accent SHALL carry these structural roles, and each MUST be a shared treatment consuming the semantic token rather than page-local markup re-derived per consumer:

- Active navigation rail on the selected product area.
- Active tab underline on the selected tab.
- Focal-card edge rail on the single authoritative card in a view.
- Section hairline rule separating labeled regions.
- Progress and meter fill.

Accent glow MUST be rendered by the shared ember-glow primitive. No surface may hardcode a glow radius, color literal, or alpha at a call site.

The focal-card edge rail MUST be applied to at most one card per view, so that "focal" remains meaningful.

#### Scenario: A structural role is reused rather than re-derived

- **WHEN** a second consumer needs a focal-card edge rail or a section hairline rule
- **THEN** it applies the shared treatment rather than re-declaring the positioning and accent markup locally

#### Scenario: The active tab is marked by an underline

- **WHEN** a tab is the selected tab in a tab bar
- **THEN** it renders a warm-accent underline rather than a raised background surface

#### Scenario: Glow is never a call-site literal

- **WHEN** the frontend source is inspected
- **THEN** no surface declares a glow radius, color literal, or alpha inline, and every accent glow resolves through the shared ember-glow primitive

#### Scenario: Focal emphasis stays singular

- **WHEN** a view renders its authoritative next action alongside other cards
- **THEN** exactly one card carries the focal edge rail
