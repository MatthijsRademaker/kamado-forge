# Design: Distressed display typography

## Context

Anton display headlines in the references carry a letterpress erosion. The frontend renders them as flat `#f5f5f5`. Measured state: no `mask-image`, no `background-clip`, no text-level texture anywhere in `frontend/src`.

Seven call sites apply the display face:

```
  TodayView.vue:53        font-display  text-heading-xl → sm:text-display-title
  TodayView.vue:85        font-display  text-heading-xl → sm:text-display-title
  TodayView.vue:141       font-display  text-heading-xl
  LiveView.vue:200        font-display  text-[2.45rem]  → sm:text-display-title
  KamadoShowcase.vue:117  font-display  text-[clamp(3.5rem,12vw,8rem)]
  ProductAreaView.vue:21  font-display  text-[clamp(3.5rem,12vw,7.5rem)]
  PlanPage.vue:236        .plan-title   raw CSS, var(--font-display), clamp(2.5rem,10vw,5.5rem)
```

Two facts about this list shape the design. First, four of seven hand-roll their size with arbitrary values rather than selecting `display-hero` or `display-title`, so the treatment cannot be keyed to the size tokens — it must key to the *face*. Second, `PlanPage` reaches the face through a raw CSS rule rather than a Tailwind utility, so a `@utility`-only approach misses it.

Note the smallest size in the list: `TodayView.vue:141` renders display type at `heading-xl`, 36px, with no responsive step up. Whatever legibility floor this design sets has to answer for that call site.

## Goals / Non-Goals

**Goals:**

- Reproduce the reference erosion on display glyphs at display sizes.
- Make the treatment impossible to apply at body sizes, and impossible to leave headlines invisible when it fails.
- Preserve headings as real text for assistive technology, find-in-page, and selection.
- Reuse the grain source from `forge-atmosphere-foundation` rather than standing up a second texture pipeline.

**Non-Goals:**

- Correcting the arbitrary-size drift in the four hand-rolled call sites. Noted, not fixed here.
- Distressing anything other than the display role.
- Photography, surface effects, radius, or accent semantics.
- Animating the erosion. It is static.

## Decisions

### `background-clip: text`, not SVG filters or duplicated pseudo-elements

| Approach | Real text preserved | Failure mode | Quality at 36–96px |
|---|---|---|---|
| `background-clip: text` + textured background | yes | invisible text if unguarded | good |
| SVG `feDisplacementMap` on text | yes | blur, broken subpixel AA | poor below ~64px |
| Duplicated pseudo-element with blended texture | no — content duplicated to AT | double-read by screen readers | good |
| Pre-rendered image headline | no | no selection, no find-in-page | best |

Chosen: `background-clip: text`. It is the only option that keeps the glyphs as real text *and* holds up at 36px. The displacement-map approach was the more faithful reproduction of letterpress bite and was rejected on the legibility floor — `TodayView.vue:141` renders at 36px and displacement blurs it into mush.

`background-clip: text` requires `color: transparent`, which is the whole risk: if the background fails to paint, the headline disappears. That risk is managed by the guard below rather than accepted.

**Confidence: high** on the technique, **moderate** on whether the result reads as letterpress rather than as a gradient overlay — resolved at task 4.1.

### Failure degrades to solid, never to invisible

The treatment is applied only inside `@supports (background-clip: text) or (-webkit-background-clip: text)`, with solid `color: var(--color-text)` declared outside the guard. Three additional contexts force the solid path:

- `forced-colors: active` — Windows High Contrast overrides `color` but not `background-image`, so a transparent-color headline vanishes. This is the most common real-world way this technique breaks and it is invisible in normal testing.
- `prefers-contrast: more` — a user asking for more contrast should not receive eroded glyphs.
- Print — texture over glyphs prints badly and wastes ink.

The default is clean type and the distress is additive, so every unhandled context lands on legible output. This mirrors the budget's fail-to-`flat` posture in `forge-atmosphere-foundation`: forgetting something yields plain, not broken.

**Confidence: high.** These are known failure modes with known guards.

### Keyed to the face and the budget, not the size token

The treatment activates on the display face within a region at atmosphere `mid` or above. Keying to the face rather than the size tokens is forced by the four hand-rolled call sites. Keying additionally to the budget means `flat` regions render clean display type for free.

The consequence is worth stating plainly rather than discovering later: **Live Cook's `<h1>` will not be distressed.** It is the largest, most prominent heading in the product, and Live Cook is assigned `flat` because it is read outdoors mid-cook. If a reviewer expects the most prominent headline to carry the most character, this will read as a bug. It is the budget working correctly, and the alternative — exempting Live Cook's headline from its own region's budget — would be the first crack in a policy that exists to prevent exactly that kind of local exception.

### A hard legibility floor, enforced rather than advised

The treatment is inert below a declared minimum computed font size. Below that floor it renders solid, silently and unconditionally. A guideline saying "do not use this small" is not enforceable across four call sites that already hand-roll their sizes with viewport-relative clamps — a narrow viewport can drive `clamp(2.5rem, 10vw, 5.5rem)` down to 40px without anyone choosing that.

The floor's exact value is empirical. `TodayView.vue:141` at 36px is the binding constraint: either the treatment survives 36px or that call site renders clean.

### Both application paths, or the treatment is inconsistent

A Tailwind `@utility` covers six call sites. `PlanPage`'s raw `.plan-title` rule needs the same treatment through a plain CSS class or custom-property contract. Shipping only the utility would leave one headline in the product visibly different from its six siblings — worse than not shipping at all, because it reads as a bug rather than as a choice.

## Risks / Trade-offs

- **Erosion reads as a gradient smear rather than letterpress** → Task 4.1 gates on side-by-side comparison with the reference headlines at 1× and 2× DPR. This is the likeliest reason to abandon the change, and abandoning it costs nothing else.
- **Invisible headlines in forced-colors mode** → Explicitly guarded, and verified in an actual forced-colors environment at task 4.3 rather than by reading the media query back.
- **36px is below the practical floor** → Then `TodayView.vue:141` renders clean and the floor is recorded in the spec. A treatment that only applies above ~48px is still worth having; a treatment that mangles a 36px heading is not.
- **Contrast loss from erosion** → The texture removes ink from glyphs, which lowers effective contrast against the surface. Measured at task 4.2 against the 4.5:1 floor; if `high`-budget intensity fails, intensity is capped rather than the floor waived.
- **Reviewers read Live Cook's clean `<h1>` as a defect** → Named in the proposal, the design, and the spec so it is encountered as a decision three times before it is encountered as a surprise.
- **Reuse of the grain source couples this to `forge-atmosphere-foundation`'s tuning** → Accepted. If that change swaps SVG turbulence for a raster tile, this treatment inherits the swap, which is the point of not building a second pipeline.

## Migration Plan

Additive. Default rendering is unchanged solid type; distress activates only where the face, the budget, and the size floor all agree. Rollback is deleting the treatment block and the showcase section.

Land after `forge-atmosphere-foundation`. Order relative to `forge-structural-accent-sweep` does not matter.

## Open Questions

- The minimum computed font size floor. Empirical; `TodayView.vue:141` at 36px is the test case.
- Whether distress should differ between budget `mid` and `high`, or be a single intensity that is simply on or off. On/off is simpler and probably sufficient; two intensities may be indistinguishable in practice.
- Whether `PlanPage`'s raw-CSS path should instead be converted to a utility as part of this change. That is arguably out of scope under the surgical-change rule, but leaving two application paths in the codebase invites the next headline to pick the uncovered one.
