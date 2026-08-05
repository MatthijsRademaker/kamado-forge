# Design: Radius scale conformance and structural accent

## Context

Measured state of `frontend/src`:

```
  RADIUS SELECTION                          count   scale?
  ──────────────────────────────────────────────────────────
  rounded-roomy    (12px)                     19    Forge
  rounded-pill                                10    Forge
  rounded-default  (8px)                      10    Forge
  rounded-md       ── stock Tailwind ──        8    no
  rounded-tight    (4px)                       5    Forge
  rounded-full     ── stock Tailwind ──        5    no
  rounded-xs       ── stock Tailwind ──        2    no
  rounded-lg       ── stock Tailwind ──        2    no
  rounded-xl       ── stock Tailwind ──        1    no
  rounded-compact  (2px)                       0    Forge, unused
```

Seventeen of the eighteen stock-Tailwind uses sit in `components/ui/` — the shadcn-vue registry primitives, which were installed and never mapped onto the Forge scale. `--radius-compact` has zero uses despite being the value nearest the references.

The accent collision is structural, not accidental. shadcn's theme contract gives `--accent` the meaning *subtle hover surface* and pairs it with `--accent-foreground`. `style.css` defines `--color-accent: #e4511a` and `--color-accent-foreground: #101011`, so four registry components inherit an idiom whose meaning has been replaced underneath them:

| Component | Class | Rendered result |
|---|---|---|
| `button/index.ts` variant `outline` | `hover:bg-accent hover:text-accent-foreground` | full ember flood on hover |
| `button/index.ts` variant `ghost` | `hover:bg-accent hover:text-accent-foreground` | full ember flood on hover |
| `badge/index.ts` variant `outline` | `[a&]:hover:bg-accent` | full ember flood on hover |
| `dialog/DialogContent.vue` close | `data-[state=open]:bg-accent` | ember background whenever open |

`kamado-ui-primitives` already requires that primitives "consume those semantic tokens rather than component-local raw feature color values." They do consume the semantic token. The token means the wrong thing. The requirement is satisfied and the result is still wrong, which is why this needs a spec change and not just a patch.

Some structural accent is already correct and this change must not disturb it: the navigation active rail (`ProductNavigation.vue:40`), the `Progress` fill via `bg-primary`, and the `TemperatureDisplay` fill.

## Goals / Non-Goals

**Goals:**

- Make radius derivable from what an element is, so the question "which radius?" has one answer per element class instead of a per-component judgement.
- Separate the brand accent from the interaction-surface role so neither can silently take the other's meaning.
- Give ember its structural roles from the references, and replace the hand-rolled per-page approximations of those roles with shared treatments.
- Make `forge-atmosphere-foundation` visible by applying its budget assignments to product routes.

**Non-Goals:**

- Distressed display typography — `forge-distressed-display-type`.
- Photography and section 9 of the design system.
- Data visualization: gauges, arcs, charts (section 7) remain unimplemented.
- Any content, copy, layout, spacing, or information-architecture change. If a screen's structure is wrong, that is a different proposal.
- Re-theming shadcn wholesale. Only the four colliding call sites move.

## Decisions

### A new neutral token, rather than redefining `accent`

Two ways to resolve the collision:

1. Redefine `--color-accent` to a neutral hover surface and introduce a separate `--color-ember-brand` for brand use.
2. Leave `--color-accent` as brand ember and introduce `--color-interaction-surface` for the hover role.

Chosen: **(2)**. Option 1 is the more orthodox reading of shadcn's contract, but `accent` is used with brand intent in roughly forty places across `ProductShell`, `ProductNavigation`, `ProductAreaView`, `KamadoShowcase`, `TemperatureDisplay`, and the views, and the `kamado-forge-design-system` spec already names ember and smoke as "accents" in that brand sense. Redefining the token would invert the meaning of every one of those call sites and contradict a shipped requirement. Option 2 touches four call sites and adds one token.

The cost is that this repository's `accent` permanently diverges from shadcn's convention, so future `shadcn-vue add` runs will pull in components carrying the same latent defect. That is a real ongoing tax and it is accepted here; the spec records the rule so the defect is recognizable on arrival rather than invisible.

**Confidence: high** on the choice, **moderate** that four call sites is the complete set — task 2.1 re-runs the inventory rather than trusting this table.

### Radius is selected by element class, not per component

```
  ELEMENT CLASS                          RADIUS
  ──────────────────────────────────────────────────
  hairline chrome, rails, dividers       compact  2px
  controls, inputs, buttons, tabs        tight    4px
  cards, panels, dialogs, sheets         default  8px
  chips, badges, meters, avatars         pill
  ──────────────────────────────────────────────────
  roomy 12px                             retired
```

`roomy` is not deleted from the scale — removing a defined token is a larger change than this one needs, and the existing spec requires a "compact-to-pill radius scale." It is retired from selection: nothing in the product should choose it, and the spec says so. If review finds a genuine home for 12px, the rule is amended.

The alternative — keeping per-component discretion and just correcting the current values — was rejected because it fixes the instances and not the cause. The 19 `roomy` uses did not arrive by decision; they arrived because no rule existed.

**Confidence: moderate.** The mapping is inferred from reading `designs/` at 1× rather than from stated design intent. Task 5.2 checks the result against the references and amends the table if the inference was wrong.

### Ember structural roles are shared treatments, not per-page markup

The references give ember four structural jobs. Two are already implemented correctly. The other two are currently hand-rolled:

- `TodayView.vue:75` builds a focal-card edge rail as an inline `<span class="absolute inset-y-0 left-0 w-1 bg-accent">`.
- `ProductAreaView.vue:25` builds a section hairline as `<div class="my-7 h-px w-20 bg-accent" />`.

Both become shared treatments so the second consumer does not re-derive them. The tab underline has no implementation at all: `TabsTrigger` renders shadcn's active pill (`data-[state=active]:bg-background` plus `shadow-sm`), where section 6 of the design system shows an ember underline with ember label text.

### Glow literals are replaced, not tuned

`ProductShell.vue:79` and `KamadoShowcase.vue:114` hardcode ember glows with different radii and different alpha encodings — one an inline `rgb()` literal, one a `var()`. Both are replaced by the ember-glow primitive from `forge-atmosphere-foundation`. This is the concrete reason the sweep depends on that change rather than merely preferring it.

### Budget application is the last step, not the first

Radius and accent corrections are mechanical and independently verifiable. Applying atmosphere budgets changes how surfaces *look* in ways that make radius regressions harder to spot. Tasks are ordered so the mechanical sweep lands and is reviewed before any budget is declared on a product route.

## Risks / Trade-offs

- **Removing the ember hover flood reads as a regression to anyone who thought it was intentional** → It is called out as **BREAKING** in the proposal, and the before/after is captured explicitly at task 2.4 so the change is reviewed as a deliberate removal.
- **Radius mapping is inferred, not specified by the designer** → Table lives in a spec requirement; task 5.2 gates on side-by-side comparison; being wrong produces a visible amendment rather than silent drift.
- **A `shadcn-vue add` after this change reintroduces the collision** → Unpreventable without a lint rule, which is out of scope. Mitigated by recording the rule as a requirement so a reviewer can recognize it.
- **Touching all nine registry primitives is a broad diff for a repository that values surgical changes** → The breadth is the point: the defect is that the primitives were never brought onto the scale. Each edit is a single token substitution, and no primitive's props, slots, variants, or behavior change.
- **Retiring `roomy` while leaving it defined invites its return** → Accepted. The spec forbids selecting it; deleting it is a cleanup for whenever the scale is next revisited.

## Migration Plan

Sequenced so each stage is independently reviewable: add the interaction-surface token, repoint the four colliding call sites, migrate registry radii, retire `roomy` in app components, add the structural accent treatments, replace the glow literals, and only then declare atmosphere budgets on product routes.

Rollback is per-stage; no stage depends on a later one. The interaction-surface token is additive and inert until something points at it.

## Open Questions

- **Resolved:** controls remain `tight` (4px). Side-by-side review at 1× and 2× DPR on real 44px targets showed `tight` as deliberate industrial shaping; `compact` (2px) read like a rendering artifact. The radius mapping remains unchanged.
- Whether the tab underline replaces shadcn's active pill entirely or sits alongside a retained surface change. The design shows underline only.
- **Resolved:** `EmptyState` declares `high` on its own surface; `LoadingState` and `ErrorState` inherit from the rendering route. Zero-data mood therefore survives inside Live Cook's otherwise `flat` context without adding texture to transient or corrective text.
