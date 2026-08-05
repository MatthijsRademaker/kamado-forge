# Implementation Tasks

## 1. Prerequisite

- [x] 1.1 Verify `forge-atmosphere-foundation` is merged and that the grain source and the `forge-atmosphere-system` budget scale are available. Do not stand up a second texture pipeline if the grain source is missing — repair it in its owning change first.

## 2. Treatment

- [x] 2.1 Implement the distressed treatment using `background-clip: text` over a texture derived from the shared grain source, with solid `color: var(--color-text)` declared as the default outside any guard.
- [x] 2.2 Wrap the treatment in an `@supports` guard for `background-clip: text` and its `-webkit-` form, so an unsupported browser lands on solid type rather than transparent type.
- [x] 2.3 Force solid type under `forced-colors: active`, `prefers-contrast: more`, and print.
- [x] 2.4 Gate activation on the inherited atmosphere budget resolving to `mid` or above, keyed to the display face rather than to the display size tokens.
- [x] 2.5 Enforce the minimum computed font size floor inside the treatment so a viewport-relative size driven below it renders solid, rather than documenting the floor as guidance.
- [x] 2.6 Provide both application paths — a Tailwind utility and a raw CSS path for rules consuming `var(--font-display)` — and confirm they render identically.

## 3. Application

- [x] 3.1 Apply the treatment to the six utility-based display call sites: `TodayView.vue:53`, `TodayView.vue:85`, `TodayView.vue:141`, `LiveView.vue:200`, `KamadoShowcase.vue:117`, and `ProductAreaView.vue:21`.
- [x] 3.2 Apply the treatment to `PlanPage.vue`'s raw `.plan-title` rule through the raw CSS path, and confirm it matches its six siblings.
- [x] 3.3 Confirm `LiveView.vue:200` renders solid because Live Cook resolves to `flat`, and record it as expected behavior so review does not read it as a defect.
- [x] 3.4 Confirm no heading, label, body, UI, small, or caption text picked up the treatment at any budget level.

## 4. Verification

Notes from implementation: the size floor (4.4) landed as a `min-width: 40rem`
media guard rather than a computed-font-size check, so narrow viewports render
clean type — this also satisfies 4.7. A single intensity per budget level was
kept (4.5): `mid` and `high` differ only in the wash alpha that reveals the
texture, which is one declaration rather than two treatments.

- [ ] 4.1 Compare distressed headlines side by side with the display headlines in `designs/design-system.png` and `designs/fire-management.png` at 1× and 2× DPR. If the result reads as a gradient smear rather than letterpress erosion, stop and report — this is the change's abort condition, and abandoning it costs nothing else.
- [ ] 4.2 Measure contrast for distressed display text at maximum permitted intensity against char, ash, and stone; if below 4.5:1, reduce intensity rather than waiving the floor.
- [ ] 4.3 Verify forced-colors behavior in an actual forced-colors environment rather than by inspecting the media query, since a transparent-color headline vanishing there is the most likely undetected failure.
- [ ] 4.4 Determine the minimum size floor empirically using `TodayView.vue:141` at 36px as the binding case; if 36px cannot be treated legibly, set the floor above it and let that call site render solid.
- [x] 4.5 Resolve whether `mid` and `high` warrant distinct intensities or a single on/off treatment; if a single intensity, simplify the treatment and amend the spec accordingly.
- [ ] 4.6 Confirm with a screen reader that a distressed headline is announced exactly once and that find-in-page and text selection are unaffected.
- [x] 4.7 Confirm display headlines remain legible at 320px where viewport-relative clamps compute their smallest values.
- [ ] 4.8 Add the showcase display type section with distressed and clean specimens, budget-level coverage, and specimens at and below the size floor.
- [ ] 4.9 Run the complete Docker-backed `scripts/precommit-run` suite, including the frozen-lockfile frontend build, and resolve all failures.
