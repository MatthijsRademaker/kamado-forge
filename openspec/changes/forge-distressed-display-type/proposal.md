## Why

The display headlines in `designs/design-system.png` ("DESIGN SYSTEM") and `designs/fire-management.png` ("FIRE MANAGEMENT") are not clean type. The Anton glyphs carry a letterpress erosion — ink breaking up across the face of each letter, edges bitten rather than crisp. The frontend renders the same headlines as flat `#f5f5f5` Anton. This is the most literal reading of "rough edges" available in the reference set, and it is entirely absent: `frontend/src` contains no `mask-image`, no `background-clip: text`, and no text-level texture of any kind.

The effect is small in surface area and disproportionate in character. It is also the riskiest treatment in the design system: applied at the wrong size it destroys legibility, applied without guards it can render headlines invisible, and applied uniformly it turns a deliberate accent into a gimmick. It is proposed separately from the surface and radius work precisely so it can be rejected on its own merits without taking anything else down with it.

## What Changes

- Add a **display-distress treatment** that composites an eroded texture onto Anton display glyphs via `background-clip: text`, reusing the grain source established by `forge-atmosphere-foundation` rather than introducing a second texture pipeline.
- Restrict the treatment to the **display typography role only**. Heading, label, body, UI, small, and caption roles are never distressed; erosion at those sizes removes strokes rather than texturing them.
- Gate distress intensity on the **atmosphere budget**, so display type renders clean in `flat` regions. A direct consequence: the largest heading in the product — Live Cook's current-step `<h1>` at `LiveView.vue:200` — will *not* be distressed, because Live Cook is assigned `flat`. This is the intended outcome, not an oversight.
- Guard the treatment so failure degrades to solid frost type rather than invisible type: an `@supports` guard for `background-clip: text`, and solid fallbacks under `forced-colors: active`, `prefers-contrast: more`, and print.
- Preserve the headline as **real selectable text**. The treatment must not convert headings to images, SVG `<text>`, or duplicated pseudo-element copies, so screen readers, find-in-page, and text selection are unaffected.
- Extend `/showcase` with distressed and clean display specimens at each budget level and at the smallest size the treatment is permitted, so the legibility floor is reviewable rather than assumed.

Out of scope: photographic imagery, surface effects, radius, accent semantics, and the pre-existing drift in which four call sites hand-roll display sizes with arbitrary `text-[clamp(...)]` values instead of the `display-hero` and `display-title` tokens. That drift is noted because it constrains the implementation approach, not because this change fixes it.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `kamado-forge-design-system`: Adds the display-distress treatment, its role and budget restrictions, and its degradation and accessibility guards.
- `internal-component-showcase`: Adds display-type treatment specimens so the distressed and clean renderings are comparable at each budget level.

## Impact

Affects `frontend/src/style.css` and the seven `font-display` call sites — `TodayView` (three), `LiveView`, `KamadoShowcase`, `ProductAreaView`, and `PlanPage`. `PlanPage.vue:236` applies the display face through a raw CSS `.plan-title` rule using `var(--font-display)` rather than a Tailwind utility, so a utility-only approach would silently miss it; the implementation must cover both paths.

Depends on `forge-atmosphere-foundation` for the grain source and the budget scale. Independent of `forge-structural-accent-sweep` — the two can land in either order.

No backend behavior, persistence, API contract, generated client, routing, content, or layout change. No new runtime dependencies and no image assets.
