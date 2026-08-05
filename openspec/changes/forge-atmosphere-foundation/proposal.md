## Why

`frontend/src/style.css` faithfully ports sections 1, 2, 3, and 10 of `designs/design-system.png` — colors, typography, spacing, and motion — but sections 8 (Surfaces & Effects) and 9 (Imagery Style) were never implemented. The repository contains zero image assets and no grain, texture, glow, or layered-surface treatment; `radial-gradient` and `linear-gradient` appear eight times total across the entire frontend source. The result is a correct dark palette rendered as flat single-value fills, which reads as generic dark-mode SaaS rather than the charcoal-and-ember character every reference in `designs/` establishes.

The missing half of the system is exactly the half that carries mood, and it cannot be added surface-by-surface without a rule for where mood belongs. Live Cook is read at arm's length mid-cook and needs legibility, not grain; an empty Today screen has nothing to read and is where the references deploy their heaviest atmosphere. Building the effect vocabulary without that rule invites uniform noise across every screen, which is the common failure mode of this aesthetic.

## What Changes

- Define an **atmosphere budget**: a named, ordered scale that assigns every product surface an allowed atmosphere level, so texture and glow intensity is a property of the surface's reading context rather than a per-component judgement.
- Implement design-system section 8 **surface recipes** as composable theme primitives — `elevated`, `inset`, `outline`, and `glass` — replacing flat `bg-surface` fills with layered treatments that carry a top-edge highlight and vertical gradient. The `--shadow-inset` token already encodes the highlight and is currently unused for this purpose.
- Add a **grain layer** primitive implementing the charcoal/stone texture swatches as a tunable CSS overlay, with intensity bound to the atmosphere budget and no raster asset dependency.
- Add an **ember glow** primitive implementing the accent bloom used behind gauges, card edges, and active states in `designs/fire-management.png`, likewise budget-bound.
- Extend the internal showcase at `/showcase` to render every surface recipe, grain intensity, and glow level side by side, so the vocabulary is reviewable without navigating product routes.
- Constrain all primitives to honor the existing `prefers-reduced-motion` rule and preserve the WCAG AA normal-text contrast floor already required on char, ash, and stone. A grain or glow treatment MUST NOT be the reason text drops below 4.5:1.

Explicitly **not** in this change: applying the vocabulary to Plan, Today, Coach, Learn, Logbook, or Live Cook; correcting radius drift; ember-as-structure; distressed display type; photographic imagery. Those are separate changes that consume this foundation.

## Capabilities

### New Capabilities
- `forge-atmosphere-system`: The atmosphere budget scale, its per-surface assignments, and the rule that effect intensity derives from budget level rather than local choice.

### Modified Capabilities
- `kamado-forge-design-system`: Adds surface recipe, grain, and ember glow primitives to the theme foundation, and constrains them against the existing accessibility and reduced-motion requirements.
- `internal-component-showcase`: The showcase must expose the new surface, grain, and glow vocabulary alongside the existing visual foundation.

## Impact

Affects `frontend/src/style.css` (theme tokens and effect primitives), the showcase route and its supporting components, and the `kamado-forge-design-system` and `internal-component-showcase` specs. No product route markup, backend behavior, persistence, API contract, or generated client changes. No new runtime dependencies and no image assets are introduced.

Downstream, this change is a prerequisite for `forge-structural-accent-sweep` and `forge-distressed-display-type`, both of which consume the budget scale to decide how far to push a given surface.
