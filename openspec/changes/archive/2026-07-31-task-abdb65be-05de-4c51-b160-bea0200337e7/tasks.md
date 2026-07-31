# Implementation Tasks

## 1. Package local fonts

- [x] 1.1 Add `@fontsource/anton`, `@fontsource/bebas-neue`, and `@fontsource/inter` to `frontend/package.json`; use only required local weights and no remote font request.
- [x] 1.2 Regenerate root `bun.lock` with the manifest change.

## 2. Define the CSS-first theme

- [x] 2.1 Import the package font CSS in `frontend/src/style.css` and add role-specific font-family tokens with sensible fallbacks.
- [x] 2.2 Add valid Tailwind v4 palette, neutral-ladder, semantic surface/text/border, typography, spacing, radius, depth, easing, and duration tokens; preserve the existing five semantic names and resolve `smoke` versus `neutral-smoke`.
- [x] 2.3 Encode the specified display, heading/label, and body/caption type scales and the 4–128px spacing progression.

## 3. Add constrained global defaults

- [x] 3.1 Establish dark canvas/surface and readable Inter body defaults with a light normal-text pairing that meets WCAG AA on char, ash, and stone.
- [x] 3.2 Add offset global `:focus-visible` and `prefers-reduced-motion: reduce` behavior without a broad outline reset.
- [x] 3.3 Leave `App.vue`, feature UI, backend behavior, and documentation unchanged.

## 4. Verify

- [x] 4.1 Review semantic utility compatibility, palette naming, reading/focus contrast, and reduced-motion behavior.
- [ ] 4.2 Run `scripts/precommit-run` and resolve package, lockfile, build, typecheck, or hook failures.
