# Implementation Tasks

## 1. Budget scale

- [x] 1.1 Add the four-level atmosphere budget to `@theme` in `frontend/src/style.css` as custom properties for grain opacity, glow alpha, and glow radius, with `flat` resolving all three to zero.
- [x] 1.2 Add the `data-atmosphere` selector rules that set the budget custom properties for `low`, `mid`, and `high`, and confirm the values inherit to arbitrarily nested descendants.
- [x] 1.3 Verify that a surface with no declared level and no ancestor level resolves to `flat`, and that an out-of-scale level value also resolves to `flat` rather than escalating.

## 2. Surface recipes

- [x] 2.1 Add `@utility` blocks for the `elevated`, `inset`, and `outline` depth recipes, each rendering a top-edge highlight and a vertical gradient, consuming the existing `--shadow-inset` highlight rather than redefining it.
- [x] 2.2 Add the `glass` recipe as a translucent surface legible over the dark canvas; determine whether it can coexist with the shell's existing `backdrop-blur` headers and record the outcome against the design's open question.
- [x] 2.3 Confirm no existing token was renamed or removed and that every current consumer of `bg-surface`, `shadow-inset`, `shadow-elevated`, and `shadow-outline` renders unchanged.

## 3. Effect primitives

- [x] 3.1 Implement the grain primitive as an inline SVG `feTurbulence` data URI emitted at a fixed tile size and repeated, with opacity bound to the inherited budget and no raster asset.
- [x] 3.2 Implement the ember-glow primitive as a positioned radial gradient deriving its color from the warm accent token, with alpha, position, and radius bound to custom properties.
- [x] 3.3 Composite grain and glow as two entries in a single `background-image` list on one pseudo-element, leaving the consuming component's other pseudo-element free.
- [x] 3.4 Pin effect-bearing surfaces to an isolated stacking context with the effect layer beneath content and non-interactive, and confirm a control on such a surface still receives clicks and taps.

## 4. Showcase

- [x] 4.1 Extend `/showcase` with an atmosphere section rendering `flat`, `low`, `mid`, and `high` side by side, each labeled with its level name and admitted effect layers.
- [x] 4.2 Extend the existing surfaces section to demonstrate the `glass` recipe alongside surface, border, radius, shadow, inset, and outline.
- [x] 4.3 Add the deliberate misuse specimen — content beneath the effect layer — labeled as incorrect and placed next to its correct equivalent.
- [x] 4.4 Confirm the showcase remains static and frontend-only, fetches no backend data, and renders no product-domain content.

## 5. Verification

- [x] 5.1 Measure contrast for default reading text on char, ash, and stone inside a `high` region and confirm at least 4.5:1; treat any failure as a defect in the effect construction, not a reason to retune text color.
- [x] 5.2 Review grain side by side against the section 8 charcoal and stone swatches in `designs/design-system.png` at both 1× and 2× DPR; tune tile size, turbulence frequency, octave count, and blend mode. If tuning cannot produce a charcoal reading, switch task 3.1 to a raster tile and record the swap.
- [x] 5.3 Decide whether `low` needs a trace of grain or stays grain-free; if the table changes, amend the `forge-atmosphere-system` assignment requirement in the same change.
- [x] 5.4 Check paint cost on the widest product surface at 2× DPR rather than relying on the tiling argument alone.
- [x] 5.5 Confirm every effect-bearing surface remains keyboard-focusable with the existing offset `:focus-visible` treatment still visible against the textured background.
- [x] 5.6 Confirm no product route markup changed and that `/today`, `/plan`, `/coach`, `/learn`, `/logbook`, and `/live` render identically before and after this change.
- [x] 5.7 Run the complete Docker-backed `scripts/precommit-run` suite, including the frozen-lockfile frontend build, and resolve all failures.
