# forge-atmosphere-system Specification

## ADDED Requirements

### Requirement: Atmosphere budget scale

The frontend SHALL define an ordered four-level atmosphere budget — `flat`, `low`, `mid`, `high` — that determines how much surface texture and accent bloom a region is permitted to render. Each level MUST admit exactly the effect layers permitted by every lower level, plus its own:

| Level | Top-edge highlight | Vertical gradient | Grain | Ember glow |
|---|---|---|---|---|
| `flat` | no | no | no | no |
| `low` | yes | yes | no | no |
| `mid` | yes | yes | yes | no |
| `high` | yes | yes | yes | yes |

Level names MUST NOT reuse the warm accent token names `ember` or `smoke`, so that intensity vocabulary and color vocabulary remain unambiguous.

The scale MUST be declared on a container and inherited by descendants through CSS custom properties. Effect primitives MUST derive their intensity from the inherited budget and MUST NOT hardcode a texture opacity, glow alpha, or glow radius at a call site.

#### Scenario: A level admits only its permitted layers

- **WHEN** a container declares atmosphere level `mid`
- **THEN** descendant surfaces render the top-edge highlight, vertical gradient, and grain, and render no ember glow

#### Scenario: Budget inherits to nested surfaces

- **WHEN** a surface is nested inside a container that declares an atmosphere level and declares no level of its own
- **THEN** it resolves the ancestor's level rather than a per-component default

#### Scenario: Intensity is not chosen at the call site

- **WHEN** a component applies a grain or ember-glow primitive
- **THEN** the rendered intensity is determined by the inherited budget custom properties, and the component supplies no literal opacity, alpha, or radius value

### Requirement: Absent budget resolves to flat

A region with no atmosphere level declared on itself or any ancestor SHALL resolve to `flat`. An unresolved or invalid level MUST NOT resolve to a textured or glowing level.

#### Scenario: Undeclared region renders plain

- **WHEN** a surface renders with no atmosphere level on itself or any ancestor
- **THEN** it renders with no grain and no ember glow

#### Scenario: Invalid level does not escalate

- **WHEN** a container declares an atmosphere level outside the defined scale
- **THEN** descendant surfaces resolve to `flat` rather than to any textured level

### Requirement: Per-surface atmosphere assignment

The product's surfaces SHALL be assigned atmosphere levels according to their reading context, and the assignment SHALL be this specification rather than an implementation choice:

| Surface | Level | Rationale |
|---|---|---|
| Live Cook active-cook region | `flat` | read at distance, outdoors, mid-cook |
| Any numeric readout, timer, or temperature value | `flat` | legibility at speed outranks mood |
| Plan editor, Logbook lists, dense working UI | `low` | depth without noise over dense text |
| Product shell chrome and navigation | `low` | persistent, must not compete with content |
| Populated Today, focal cards, browsable content | `mid` | texture supports scanning |
| Empty states, onboarding, zero-data regions | `high` | nothing to read; mood is the content |

Raising a surface above its assigned level MUST require amending this requirement rather than changing a call site.

#### Scenario: Operational surfaces stay legible

- **WHEN** Live Cook renders its active-cook region or any temperature or timer readout
- **THEN** the region resolves to `flat` and renders no grain and no ember glow

#### Scenario: Empty states carry the heaviest treatment

- **WHEN** a product route renders a zero-data or empty state
- **THEN** the region resolves to `high` and renders grain and ember glow

#### Scenario: Escalation is a specification change

- **WHEN** a later change requires a surface to render above its assigned level
- **THEN** the assignment table is amended as part of that change rather than the level being overridden locally
