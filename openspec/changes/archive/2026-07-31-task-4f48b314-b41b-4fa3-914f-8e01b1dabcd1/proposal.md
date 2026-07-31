## Why

The frontend foundation now has a defined Forge palette, typography scale, spacing system, and surface primitives, but there is no local visual reference for inspecting or developing against them. A dedicated `/showcase` route will make those decisions visible in the browser without introducing Storybook or mixing design-system work with product pages. Establishing Vue Router at the same time creates the application-shell boundary needed for future routes while preserving the existing application root.

## What Changes

- Add Vue Router with a normal application root at `/` that preserves the current scaffold experience.
- Add an internal `/showcase` route for visual development, with clearly non-product labeling and a link back to the application root.
- Render the existing design foundation as visual specimens for:
  - color and semantic design tokens;
  - typography roles and type scale;
  - spacing tokens;
  - surfaces, borders, radii, shadows, and related effects;
  - the Tailwind CSS responsive breakpoint contract and responsive layout examples.
- Keep showcase content static and frontend-only; do not add product pages, backend calls, domain data, authentication, or product navigation.
- Make the route and its sections usable with keyboard navigation and at mobile and desktop widths.
- Verify direct navigation and refresh for `/showcase` in Vite development and in a built frontend preview, alongside the repository verification command.

## Capabilities

### New Capabilities

- `internal-component-showcase`: Provides a routed, frontend-only visual reference for the Forge design foundation and responsive behavior.

### Modified Capabilities

- `kamado-forge-design-system`: Update the frontend boundary and verification contract to permit the router and internal showcase view while preserving the existing token, accessibility, and local-font requirements and leaving backend, product feature, and architecture behavior unchanged.

## Impact

- `frontend/package.json` and the root `bun.lock` gain the Vue Router dependency.
- `frontend/src/main.ts` and the application root gain router integration; the existing root scaffold is retained as the `/` route.
- New frontend router/view/showcase source files will be added under `frontend/src/`.
- The existing `frontend/src/style.css` tokens remain the visual source of truth; the showcase consumes them rather than introducing a second palette or typography system.
- No backend API, persistence, architecture model, or product feature behavior changes.
- Verification continues through `scripts/precommit-run`, with a direct-route/refresh smoke check for development and built preview behavior.
