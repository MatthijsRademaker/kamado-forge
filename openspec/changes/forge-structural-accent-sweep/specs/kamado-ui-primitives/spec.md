# kamado-ui-primitives Specification

## MODIFIED Requirements

### Requirement: Semantic Kamado visual foundation

The frontend MUST provide semantic Tailwind/CSS tokens for core, surface, text, border, accent, interaction-surface, and feedback roles that express dark charcoal layered surfaces, ember-orange emphasis, restrained outlines, and semantic status colors. Primitive and composition classes MUST consume those semantic tokens rather than component-local raw feature color values, and visible focus treatment MUST remain perceptible on intended dark surfaces.

Primitives MUST distinguish the warm accent from the interaction surface. The warm accent is reserved for brand and structural emphasis; hover, open, and highlighted-row states MUST resolve to the neutral interaction-surface token. A primitive inherited from an upstream registry whose idiom treats the accent token as a subtle hover surface MUST be repointed at the interaction-surface token rather than left to inherit the warm accent.

Primitives MUST select corner radius from the Forge radius scale according to the design system's element-class mapping, and MUST NOT select a stock framework radius default.

#### Scenario: A primitive renders a themed state

- **WHEN** a Button, Card, Badge, form control, progress display, or status display renders a surface, text, border, accent, feedback, or focus state
- **THEN** it uses the semantic token layer and preserves the Kamado dark charcoal-and-ember visual hierarchy without embedding one-off feature color values.

#### Scenario: A primitive renders a hover or open state

- **WHEN** a Button, Badge, or overlay control renders a hover, open, or highlighted state
- **THEN** the state surface resolves to the neutral interaction-surface token and not to the warm accent

#### Scenario: A primitive renders a rounded corner

- **WHEN** any registry primitive renders a corner radius
- **THEN** the radius resolves to the Forge scale step assigned to that primitive's element class, and no stock framework radius default is used

### Requirement: Registry primitive boundary and reusable API

The frontend MUST place registry-derived Button, Card, Badge, Input, Textarea, Progress, Tabs, Dialog, and Sheet primitives under `frontend/src/components/ui`. Each named primitive MUST expose an independently usable generic prop, slot, attribute, and variant contract as applicable, use `cn()` for class composition, and avoid embedded session, coach, learn, logbook, user, or telemetry feature data.

Bringing a registry primitive onto the Forge token and radius foundation MUST NOT change its prop, slot, attribute, or variant contract, and MUST NOT change its behavior. Such conformance is a token substitution only.

#### Scenario: A future composition consumes a primitive

- **WHEN** a composition supplies a primitive's content, label, value, or variant
- **THEN** it can do so through the primitive's public props, slots, or forwarded attributes without changing the primitive source or relying on showcase sample data.

#### Scenario: A primitive source file is placed in the frontend

- **WHEN** the named registry-derived primitive is added
- **THEN** its source is under `frontend/src/components/ui` and custom Kamado composition code does not become a dependency of that primitive.

#### Scenario: Foundation conformance preserves the primitive contract

- **WHEN** a registry primitive is brought onto the Forge radius scale and interaction-surface token
- **THEN** its props, slots, forwarded attributes, variants, and behavior are unchanged and only its resolved token values differ
