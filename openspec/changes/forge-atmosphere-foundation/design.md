# Design: Atmosphere budget and forge surface effects

## Context

`frontend/src/style.css` holds a complete and accurate transcription of `designs/design-system.png` sections 1–3 and 10. Sections 8 (Surfaces & Effects: the `elevated`/`inset`/`outline`/`glass` styles and the charcoal/stone/smoke/ember texture swatches) and 9 (Imagery Style) have no implementation. Measured state of `frontend/src`:

- `0` image assets of any format, and no `public/` directory.
- `0` occurrences of `texture`, `noise`, `mix-blend`, or `mask-image`.
- `8` total occurrences of `radial-gradient` or `linear-gradient`.
- `--shadow-inset` — which already encodes the section 8 top-edge highlight as `inset 0 1px 0 rgb(245 245 245 / 0.08)` — is used 10 times, but every card surface still renders as a flat `#1f1e1e` fill.

The constraint that shapes this design is that the product's surfaces do not want equal amounts of mood. Live Cook is read at arm's length, outdoors, mid-cook, and the existing `today-live-cook` spec already requires glanceable guidance and outdoor-legible controls. An empty Today screen has no content to read at all, and is precisely where every reference in `designs/` deploys its heaviest treatment — the ember-glow quote block, the pro-tip card over glowing charcoal, the kamado photograph in the sidebar footer. A vocabulary of effects with no rule for their application will be applied uniformly, and uniform grain over a temperature readout is a regression.

This change therefore ships a policy and a vocabulary together, and applies neither to product routes.

## Goals / Non-Goals

**Goals:**

- Make effect intensity a property of a surface's reading context, resolved by inheritance, rather than a per-component decision made at each call site.
- Implement section 8's four surface styles as composable Tailwind v4 utilities that carry real layering — top-edge highlight and vertical gradient — instead of flat fills.
- Provide grain and ember-glow primitives that are tunable, asset-free, and incapable of silently violating the existing WCAG AA text-contrast floor.
- Make the whole vocabulary reviewable in one place at `/showcase` before any product surface consumes it.

**Non-Goals:**

- Applying the vocabulary to any product route. Plan, Today, Coach, Learn, Logbook, and Live Cook are untouched by this change.
- Radius correction and ember-as-structure — `forge-structural-accent-sweep`.
- Distressed display typography — `forge-distressed-display-type`.
- Photographic imagery, asset sourcing, licensing, or scrim conventions. Section 9 remains unimplemented after this change and needs its own proposal.
- Any change to data visualization (section 7): gauges, arcs, and charts are out of scope.

## Decisions

### Budget is a four-level scale inherited through CSS custom properties

A surface declares its level once; descendant effect primitives read the inherited value and scale themselves. The alternative — passing an intensity prop or variant to every card, panel, and state component — was rejected because it reintroduces the per-call-site judgement this change exists to eliminate, and because it cannot express "everything inside Live Cook is flat" without threading a prop through every intermediate component.

```
  LEVEL          HIGHLIGHT  GRADIENT  GRAIN  GLOW    READING CONTEXT
  ─────────────────────────────────────────────────────────────────────
  flat              ·          ·        ·      ·     data read at speed
  low               ✓          ✓        ·      ·     dense working UI
  mid               ✓          ✓        ✓      ·     browsing, focal cards
  high              ✓          ✓        ✓      ✓     nothing to read yet
```

Implemented as a `data-atmosphere` attribute on a container, which sets `--atmosphere-grain-opacity`, `--atmosphere-glow-alpha`, and `--atmosphere-glow-radius`. Effect utilities consume those variables and never hardcode intensity. An unset ancestor resolves to `flat`, so the failure mode of forgetting to declare a budget is *no effect*, not *maximum effect*. This matches the repository's fail-loud posture better than a permissive default would: a missing budget produces a visibly plain surface that a reviewer catches, rather than grain leaking onto a readout.

Level names are deliberately non-metaphorical. Fire-metaphor names (`ash`/`smoke`/`ember`/`blaze`) were considered and rejected: `smoke` and `ember` are already color tokens, and the `kamado-forge-design-system` spec contains an explicit requirement that `smoke` identify only the warm accent and not be ambiguously aliased. Reusing those words for intensity levels would re-create the exact ambiguity that requirement was written to prevent.

**Confidence: high.** This is a well-worn CSS inheritance pattern and the failure modes are cheap to inspect.

### Budget assignment is declared in the spec, not chosen at implementation time

The per-surface assignment table lives in the `forge-atmosphere-system` spec as a requirement, not in a code comment. This is the entire point of separating B from A: the assignment is a product decision that outlives any particular stylesheet, and a downstream change that wants to raise Live Cook above `flat` should have to amend a requirement to do it.

### Grain is inline SVG turbulence on a tiled pseudo-element, not a raster asset

Three options were weighed:

| Approach | Asset | Tunable | Rasterization cost | Look on dark surfaces |
|---|---|---|---|---|
| SVG `feTurbulence` data URI | none | yes, via CSS | once per tile, then cached | good, slightly digital |
| Raster PNG noise tile | one file | opacity only | trivial | best |
| Layered CSS gradients | none | awkward | low | visible banding |

Chosen: SVG `feTurbulence` as a data URI, emitted at a fixed tile size (~180×180) and repeated via `background-repeat`. This keeps the change free of the asset-sourcing question that section 9 will have to answer anyway, and keeps intensity tunable from a custom property. The tile is small and fixed-size, so the browser rasterizes the filter once and tiles the result rather than filtering the full surface area — this is the mitigation for `feTurbulence`'s reputation as a performance hazard, which applies to full-bleed unbounded filters, not small repeated tiles.

The raster tile remains the better-looking option and is the fallback if visual review rejects the SVG. Deferring it costs one task, not a redesign.

**Confidence: moderate.** The technique is sound; whether the result reads as "charcoal" or as "TV static" is an empirical question resolved at task 7's visual review.

### One pseudo-element carries all effect layers

Grain and glow are composited as two entries in a single `background-image` list on one `::after`, rather than one pseudo-element each. Reasons: it leaves `::before` free for the consuming component, it avoids a second stacking-context allocation per surface, and it means the blend and z-order are resolved once in the recipe instead of at each call site.

### Effect layers sit beneath content and never blend over text

The grain layer uses `mix-blend-mode` to read as texture rather than as a flat scrim. Blend modes composite against everything below them in the stacking context, so an unconstrained blended pseudo-element placed above content would alter text rendering and could push contrast below the 4.5:1 floor that `kamado-forge-design-system` already requires on char, ash, and stone.

The recipe therefore pins the surface to `isolation: isolate`, places the effect pseudo-element at `z-index: 0` with `pointer-events: none`, and requires content to establish `z-index: 1`. Contrast is then unaffected by construction, not by tuning — the text never has a blended layer above it. This is asserted as a spec scenario rather than left to review.

**Confidence: high** that the construction is correct; **moderate** that every existing consumer will establish the content layer correctly without a lint, which is why the showcase includes a deliberate misuse case.

### Ember glow is a positioned radial gradient, not a box-shadow

`box-shadow` spread cannot express the off-center, elliptical bloom used behind the gauge and along card edges in `designs/fire-management.png`, and it clips at the border box. A radial gradient in the same `background-image` list can be positioned and sized freely from custom properties, and composites with the grain layer for free.

## Risks / Trade-offs

- **Grain reads as digital static rather than charcoal** → The tile size, turbulence frequency, octave count, and blend mode are all tunable from the recipe; task 7 gates on side-by-side review against the section 8 swatches at both 1× and 2× DPR. If tuning fails, swap to a raster tile — a contained change to one primitive.
- **A consuming component forgets `z-index: 1` on content and gets blended text** → The showcase renders this exact misuse next to the correct usage so the symptom is recognizable, and the spec states the content-layer obligation as a requirement. This remains the most likely defect this change introduces; it is not fully preventable without a lint rule, which is out of scope.
- **The budget table is wrong** → It is a requirement in a spec, so correcting it is an amendment with a visible diff rather than a silent retune. Being wrong in public is the intended property.
- **Effects at 2× DPR on large surfaces cost paint time** → Fixed-size tiling bounds the filter cost; the glow is a plain gradient. Verification on a temporarily effect-bearing 1152×563 CSS-pixel product surface at 2× measured steady forced-raster medians of 23.1ms without effects and 59.8ms at `high`. This is a static initial-paint cost, not recurring animation work, and reinforces the assignment rule that dense wide product surfaces stay `low`; downstream consumers must not escalate them locally.
- **This change ships no visible product improvement** → Correct, and deliberate. `/today` looks identical after it merges. The visible payoff arrives with `forge-structural-accent-sweep`. Anyone measuring this change by screenshotting a product route will conclude it did nothing.

## Migration Plan

Additive throughout. New theme tokens, new utilities, new showcase sections; no existing token is renamed or removed, and no product route markup changes. The pre-existing `radial-gradient` usages in `TodayView.vue` and elsewhere are left in place — converting them is `forge-structural-accent-sweep`'s job, and doing it here would violate the surgical-change rule.

Rollback is deletion of the added `@theme` entries, the added `@utility` blocks, and the showcase sections. Nothing depends on them until the two downstream changes land.

## Open Questions

- **Resolved:** grain uses a 180×180 stitched tile, `baseFrequency='.08'`, two octaves, and `soft-light`. Review at 1× and 2× rejected `.58` as digital static and `.035` as visibly tiled color blotches; `.08` reads as subdued charcoal without a raster fallback.
- **Resolved:** `low` stays grain-free. Side-by-side review showed enough separation from `flat` through highlight and gradient alone, while adding grain would weaken its dense-working-UI role.
- **Resolved:** `glass` remains a general recipe and includes its own `backdrop-filter: blur(16px)`. It can replace the shell header's `backdrop-blur` utility without losing blur, but the two classes must not be composed on the same element because both write the same property and CSS resolves one declaration rather than combining them. Nested glass surfaces remain valid, though the showcase uses the recipe over the canvas rather than changing product shell markup.
