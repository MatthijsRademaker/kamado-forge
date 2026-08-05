# Implementation Tasks

## 1. Prerequisite

- [x] 1.1 Verify `forge-atmosphere-foundation` is merged and that the ember-glow primitive, the surface recipes, and the `forge-atmosphere-system` budget scale are available. Do not substitute a local glow or a local budget default if any is missing — repair it in its owning change first.

## 2. Interaction surface token

- [x] 2.1 Re-run the collision inventory across `frontend/src/components/ui/` for `bg-accent`, `text-accent-foreground`, and any other use of the accent token in a hover, open, or highlighted-row sense; treat the four known call sites as a starting point, not a complete list.
- [x] 2.2 Add the neutral interaction-surface token and its paired foreground to `@theme` in `frontend/src/style.css`, drawn from the existing neutral ramp.
- [x] 2.3 Repoint every call site found in 2.1 — including `button/index.ts` variants `outline` and `ghost`, `badge/index.ts` variant `outline`, and the `DialogContent` close control — at the interaction-surface token.
- [x] 2.4 Capture before/after of the hover and open states so the removal of the ember flood is reviewed as a deliberate breaking change rather than mistaken for a regression.
- [x] 2.5 Measure contrast for the interaction-surface state against its paired foreground and confirm at least 4.5:1.

## 3. Radius conformance

- [x] 3.1 Migrate all stock-Tailwind radii in `components/ui/` — Button, Card, Badge, Input, Textarea, Progress, Tabs, Dialog, Sheet — onto the Forge scale per the element-class mapping.
- [x] 3.2 Retire `rounded-roomy` across `KamadoShowcase`, `LiveView`, `TodayView`, `PlanPage`, `ProductAreaView`, `LoadingState`, `ErrorState`, and `EmptyState`, reassigning each by element class.
- [x] 3.3 Confirm by inspection that no product surface or registry primitive selects a stock framework radius default or the `roomy` step.
- [x] 3.4 Confirm no primitive's props, slots, forwarded attributes, variants, or behavior changed — these edits are token substitutions only.

## 4. Structural accent

- [x] 4.1 Replace the `TabsTrigger` active pill (`data-[state=active]:bg-background` plus `shadow-sm`) with a warm-accent underline and accent label text.
- [x] 4.2 Extract the focal-card edge rail from its inline implementation in `TodayView.vue` into a shared treatment, and confirm at most one card per view carries it.
- [x] 4.3 Extract the section hairline rule from its inline implementation in `ProductAreaView.vue` into a shared treatment.
- [x] 4.4 Replace the hardcoded glow literals in `ProductShell.vue` and `KamadoShowcase.vue` with the ember-glow primitive, and confirm no glow radius, color literal, or alpha remains at any call site.
- [x] 4.5 Leave the navigation active rail, the `Progress` fill, and the `TemperatureDisplay` fill unchanged; verify they still render correctly after the token and radius work.

## 5. Budget application

- [x] 5.1 Declare atmosphere budgets on product routes per the `forge-atmosphere-system` assignment table: `flat` on Live Cook's active-cook region and every readout, `low` on shell chrome and dense working UI, `mid` on populated Today and focal cards, `high` on empty states.
- [x] 5.2 Resolve whether `EmptyState`, `LoadingState`, and `ErrorState` declare their own budget or inherit from the rendering route; if an empty state inside a `flat` region should not stay flat, amend the assignment table in this change.
- [x] 5.3 Confirm no readout, timer, or temperature value renders grain or glow at any viewport.

## 6. Verification

- [x] 6.1 Compare `/today`, `/plan`, `/live`, `/coach`, `/learn`, and `/logbook` side by side against `designs/fire-management.png` and `designs/design-system.png` at 1× and 2× DPR; if the radius mapping reads wrong against the references, amend the mapping requirement in this change rather than deviating per component.
- [x] 6.2 Resolve the open question of `tight` versus `compact` for controls against a real 44px touch target, and record the outcome in the mapping.
- [x] 6.3 Confirm the offset `:focus-visible` treatment remains visible on every retuned control and on textured surfaces.
- [x] 6.4 Verify key targets remain usable at 320px without horizontal overflow, as the existing shell and Live Cook requirements demand.
- [x] 6.5 Confirm no content, copy, layout, spacing, routing, or information-architecture change entered this diff.
- [x] 6.6 Run the complete Docker-backed `scripts/precommit-run` suite, including the frozen-lockfile frontend build, and resolve all failures.
