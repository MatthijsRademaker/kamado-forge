# forge-atmosphere-system Specification

## MODIFIED Requirements

### Requirement: Per-surface atmosphere assignment

The product's surfaces SHALL be assigned atmosphere levels according to their reading context, and the assignment SHALL be this specification rather than an implementation choice:

| Surface | Level | Rationale |
| --- | --- | --- |
| Live Cook active-cook region | `flat` | read at distance, outdoors, mid-cook |
| Any numeric readout, timer, or temperature value | `flat` | legibility at speed outranks mood |
| Plan editor, Logbook lists, dense working UI | `low` | depth without noise over dense text |
| Product shell chrome and navigation | `low` | persistent, must not compete with content |
| Populated Today, focal cards, browsable content | `mid` | texture supports scanning |
| Empty states, onboarding, zero-data regions | `high` | nothing to read; mood is the content |

`EmptyState` SHALL declare `high` on its own surface so a zero-data region rendered inside a `flat` route does not remain flat. `LoadingState` and `ErrorState` SHALL declare no budget of their own and SHALL inherit from the rendering route because transient work and corrective text retain that route's reading context.

Raising a surface above its assigned level MUST require amending this requirement rather than changing a call site.

#### Scenario: Operational surfaces stay legible

- **WHEN** Live Cook renders its active-cook region or any temperature or timer readout
- **THEN** the region resolves to `flat` and renders no grain and no ember glow

#### Scenario: Empty states carry the heaviest treatment

- **WHEN** a product route renders a zero-data or empty state
- **THEN** the `EmptyState` surface resolves to `high` even when its rendering route is `flat`, and renders grain and ember glow

#### Scenario: Loading and error states retain route context

- **WHEN** a product route renders a loading or error state
- **THEN** that state inherits the route's atmosphere budget rather than escalating itself

#### Scenario: Escalation is a specification change

- **WHEN** a later change requires a surface to render above its assigned level
- **THEN** the assignment table is amended as part of that change rather than the level being overridden locally
