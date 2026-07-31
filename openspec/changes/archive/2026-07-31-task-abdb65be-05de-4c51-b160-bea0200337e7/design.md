# Design: Kamado Forge Design System

## Context

`main.ts` globally imports `style.css`; Tailwind v4 is already enabled through Vite; and the placeholder scaffold consumes the existing semantic color utilities. The correct seam is therefore a CSS-first frontend token layer, not a feature screen.

## Goals / Non-Goals

Goals: provide reusable forge palette, semantic aliases, local typography, spatial/depth/motion primitives, accessible dark defaults, and a frozen-lockfile buildable foundation.

Non-goals: feature UI or an `App.vue` showcase; navigation, cards, inputs, charts, assets, texture recreation, a light theme, a new Tailwind config, backend/persistence/API behavior, documentation, or architecture changes.

## Decisions

- Use valid Tailwind v4 `@theme` namespaces in `frontend/src/style.css`; retain the five scaffold semantic names and add intent-based surface/text/border aliases.
- Load only package-managed Anton, Bebas Neue, and Inter assets from the frontend manifest; update root `bun.lock` atomically.
- Use dark char/ash/stone hierarchy, restrained ember/smoke accents, and distinct fire/success/warning/info semantics. `neutral-frost` supplies the default light reading foreground.
- Expose the supplied type scale, 8-point spacing progression, compact-to-pill radii, elevated/inset/outline depth, and specified easing/timings as reusable tokens rather than page values.
- Limit global rules to dark base surfaces, Inter body default, focus visibility, and reduced motion.

## Risks

- Invalid Tailwind namespaces or renamed aliases can break scaffold utilities; preserve the names and build the current scaffold.
- Font import/lockfile drift can fail frozen installation; use the three maintained packages and verify the locked build.
- Decorative colors can create low-contrast dark-surface text; keep light foreground as the normal reading default and check focus pairings.
- Broad global selectors can become an unintended redesign; do not add component selectors or alter `App.vue`.

## Conflict Resolution

The source labels both a warm accent and a light neutral “Smoke.” The task acceptance assigns warm `smoke` to `#f1620f`; reserve that name for the accent and expose the light neutral as `neutral-smoke` (`#d1d1d1`).

## Traceability

- `task:abdb65be-05de-4c51-b160-bea0200337e7`
- `dossier:`
- `decision:1-swarm-architect-recommendation`
- `decision:1-swarm-lead-dev-recommendation`
- `decision:1-swarm-reviewer-recommendation`
- `round:1:agent:swarm-architect`
- `round:1:agent:swarm-lead-dev`
- `round:1:agent:swarm-reviewer`
