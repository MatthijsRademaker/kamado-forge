# internal-component-showcase Specification

## MODIFIED Requirements

### Requirement: Showcase exposes the Forge visual foundation

The `/showcase` view SHALL provide labeled visual specimens for the existing Forge design foundation: palette and semantic color tokens, typography roles and type scale, spacing tokens, and surface/effect primitives including surfaces, borders, radii, shadows, inset, outline, and glass treatments. It MUST additionally provide specimens for the atmosphere budget scale, the grain primitive, and the ember-glow primitive. Specimens MUST consume the CSS custom properties and font roles defined by `frontend/src/style.css` rather than introducing a competing palette, typography scale, or hard-coded visual source of truth.

Atmosphere specimens MUST render every level of the budget scale side by side so the levels are comparable without navigating product routes, and MUST label each specimen with its level name and the effect layers that level admits.

The showcase MUST include one deliberate misuse specimen showing a surface whose content fails to establish its content layer above the effect layer, labeled as incorrect, so the resulting symptom is recognizable to reviewers.

Every specimen MUST expose enough textual labeling to identify its role or token without relying on color alone. Showcase content MUST remain static and frontend-only; it MUST NOT fetch backend data or render product-domain content.

#### Scenario: Existing color and semantic tokens are inspectable

- **WHEN** a user opens the colors section
- **THEN** the page shows named visual swatches and token references for the existing Forge palette and semantic status colors

#### Scenario: Existing typography roles are inspectable

- **WHEN** a user opens the typography section
- **THEN** the page renders representative samples for the existing display, heading, label, body, UI, small, and caption roles with their role names and scale metadata

#### Scenario: Existing spacing and surface primitives are inspectable

- **WHEN** a user opens the spacing or surfaces section
- **THEN** the page shows the defined spacing scale and demonstrates the existing surface, border, radius, shadow, inset, outline, and glass primitives

#### Scenario: Atmosphere levels are comparable

- **WHEN** a user opens the atmosphere section
- **THEN** the page renders a specimen for each of `flat`, `low`, `mid`, and `high` side by side, each labeled with its level name and admitted effect layers

#### Scenario: The content-layer failure mode is demonstrated

- **WHEN** a user opens the atmosphere section
- **THEN** the page renders a specimen labeled as incorrect in which content sits beneath the effect layer, next to the correct equivalent
