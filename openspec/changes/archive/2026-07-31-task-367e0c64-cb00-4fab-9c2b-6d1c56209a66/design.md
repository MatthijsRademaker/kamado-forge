# Design: Reusable Kamado UI Primitives

## Context

The frontend is a direct Vue mount with no router dependency. `frontend/components.json` already establishes the shadcn-vue/Reka aliases and Lucide icon foundation, while `cn()` is available for class composition. This change establishes a frontend-only component contract and a directly reachable gallery before product pages exist.

## Goals/Non-Goals

### Goals

- Express the Kamado Forge dark charcoal, ember-orange, restrained-outline, and semantic-feedback visual hierarchy through reusable semantic tokens and component variants.
- Provide independently usable Button, Card, Badge, Input, Textarea, Progress, Tabs, Dialog, and Sheet primitives.
- Provide prop- and slot-driven empty, loading, error, temperature, and status compositions without embedded feature data.
- Demonstrate the resulting APIs and focus-sensitive behavior in a responsive `/showcase`.
- Preserve keyboard and assistive-technology operation by composing Reka behavior for tabs and overlays.

### Non-Goals

- Add session, coach, learn, or logbook pages, workflows, persistence, APIs, or authentication.
- Add a router dependency, broader routing architecture, or navigation system.
- Create custom replacements for accessibility behavior already provided by shadcn-vue/Reka.
- Embed product user, lesson, session, or telemetry data in reusable components.

## Decisions

### Component boundaries

Registry-derived shadcn-vue/Reka wrappers belong in `frontend/src/components/ui`. Kamado-specific state and telemetry compositions, plus the showcase composition, belong outside `ui`. Dependencies flow from custom compositions to generic primitives, never in reverse.

Each primitive exposes generic typed props, slots, and attributes for its public content, labels, values, and variants. Components use `cn()` and existing variant conventions; showcase sample values and local interaction state stay in the showcase composition. Icons use `lucide-vue-next`.

### Accessible interaction contracts

Tabs, Dialog, and Sheet are thin Reka/shadcn-vue compositions rather than hand-written interaction implementations. Tabs preserve keyboard navigation. Dialog and Sheet expose accessible names and preserve focus trapping, Escape dismissal, and return of focus to their triggers. Input and Textarea retain associated labels and applicable description or invalid-state relationships; native controls retain their semantic behavior. Progress exposes its determinate range/value or an accessible indeterminate state.

Empty, loading, and error compositions accept configurable content and action content through props or slots. Temperature and status displays accept caller-supplied label, value, unit, and semantic status. The temperature display does not fetch data or convert units: callers provide an already-converted value and unit. Where a gauge is rendered, its bounds are configurable, its visual fill is bounded to those limits, and a human-readable value remains available.

### Theme and responsive behavior

`frontend/src/style.css` preserves and extends the semantic token layer for core, surface, text, border, accent, and feedback roles. Components consume semantic utilities rather than scattered raw feature color values, and focus-visible treatment remains visible on the dark surface hierarchy. The showcase uses responsive grouping, wrapping, and bounded overlay dimensions so controls remain readable and operable without horizontal page overflow at narrow widths.

### Route-thin showcase

The existing mount handles `/showcase` directly without a router. As the explicit scaffold default, `/` renders the same showcase; no behavior for additional feature routes is introduced. The gallery owns illustrative local sample data and demonstrates all public variants and interactive states without becoming a product page.

## Conflict Resolution

The refinement evidence left root-path behavior and temperature policy open. The least-complexity resolution is to render the same gallery at `/` and `/showcase` through explicit path handling, avoiding a router dependency. Temperature conversion remains outside the display primitive: callers provide the value and unit, while the generic display formats its readout and bounded gauge semantics.

## Risks

- Hand-rolled tabs or overlays could regress roving navigation, focus trapping, Escape handling, or focus restoration. Mitigation: retain Reka/shadcn-vue as the behavior boundary and exercise those interactions in the showcase.
- A pathname-only gallery could fail direct serving. Mitigation: smoke-test a direct `/showcase` visit in the served frontend.
- Component-local colors could fragment the visual contract or weaken contrast. Mitigation: use semantic tokens and verify visible focus on dark surfaces.
- Dense demo sections can overflow on mobile. Mitigation: perform a narrow viewport check for controls, tabs, dialogs, and sheets.
- Illustrative values could leak into reusable APIs. Mitigation: keep samples and demo state local to the showcase and require caller-supplied component content and values.

## Traceability

- `task:367e0c64-cb00-4fab-9c2b-6d1c56209a66`
- `decision:1-swarm-reviewer-recommendation`
- `decision:1-swarm-architect-recommendation`
- `decision:1-swarm-lead-dev-recommendation`
- `round:1:agent:swarm-reviewer`
- `round:1:agent:swarm-architect`
- `round:1:agent:swarm-lead-dev`
