## Context

The repository is a Bun workspace with a Vue 3/Vite SPA in `frontend/`. The frontend currently mounts `App.vue` directly from `main.ts`; there is no router, view directory, or product navigation yet. `frontend/src/style.css` is already the source of truth for the Forge visual foundation: local Anton, Bebas Neue, and Inter fonts; palette and semantic colors; typography roles; spacing; radii; shadows; and motion tokens. The design reference is a dark, industrial, ember-accented system rather than a generic light documentation page.

The change needs a small application-shell boundary now, without pretending that the internal showcase is a product destination. It must stay static and frontend-only, remain useful at a 320px mobile viewport and wide desktop widths, and prove that the existing tokens can be consumed without creating a second token registry.

## Goals / Non-Goals

**Goals:**

- Add a Vue Router history-mode shell with a named `/` route for the existing scaffold and a named `/showcase` route.
- Make direct navigation and refresh work through Vite development and built-preview SPA fallback behavior.
- Present the existing Forge foundation as inspectable visual specimens for colors, typography, spacing, surfaces/effects, and responsive breakpoints.
- Make the showcase unmistakably an internal design-system tool, with source-level route intent and a link back to the normal application root.
- Preserve keyboard focus behavior, semantic structure, reduced-motion behavior, and mobile/desktop usability already established by the global stylesheet.
- Keep the route free of backend requests, domain data, product navigation, and authentication changes.

**Non-Goals:**

- Building Storybook, a component registry, or a general-purpose design-system package.
- Adding product pages, product navigation, backend APIs, persistence, or LLM integration.
- Adding access control or claiming that the word “internal” provides security.
- Replacing or redesigning the existing Forge palette, typography, spacing, surface, or motion tokens.
- Introducing custom breakpoint values. The route will document and exercise the current Tailwind CSS v4 defaults: base, `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, and `2xl` 1536px.

## Decisions

### Use Vue Router history mode

Add `vue-router` as a frontend dependency and create a small router module using `createRouter` and `createWebHistory(import.meta.env.BASE_URL)`. History mode is required because the public contract is `/showcase`, not a hash URL. Vite's SPA fallback handles `/showcase` in development and `vite preview`; a separately deployed static host remains responsible for rewriting unknown paths to `index.html`.

**Alternative considered:** manually branching on `window.location.pathname` in `App.vue`. This avoids a dependency but creates a dead-end navigation abstraction and would have to be replaced when the application shell gains real routes. **Alternative rejected:** hash history, because it does not satisfy the requested `/showcase` URL.

### Keep `App.vue` as the router host and preserve `/`

`App.vue` will render the router view. The current scaffold content will become the component for the `/` route without changing its user-visible purpose. The showcase will be a separate view, so it cannot accidentally become the product root or require conditional pathname logic in the root component.

Route records should be named and include a concise internal-purpose comment or metadata entry for `/showcase`. This documents intent in executable source, as requested, without adding an architecture-model layer.

### Build a token atlas, not a second design system

The showcase view will define only presentation metadata such as token names, roles, and CSS custom-property references. Swatches, type samples, spacing bars, surface cards, shadows, and radii will consume `var(--...)` values from `frontend/src/style.css`; literal palette or typography values will not be duplicated as a competing source of truth. The page will use static utility classes or inline CSS-variable styles rather than dynamically constructed Tailwind class names that the scanner cannot see.

The five sections will be:

1. **Colors and semantic tokens** — named swatches with readable labels and token references.
2. **Typography** — display, heading, label, body, UI, small, and caption specimens with role metadata.
3. **Spacing** — the defined spacing scale shown as proportional bars and values.
4. **Surfaces and effects** — canvas/surface/raised/card treatments plus border, radius, shadow, and inset/outline examples.
5. **Responsive breakpoints** — the current Tailwind defaults and a responsive specimen that visibly reflows at the relevant thresholds.

The page will use an internal design-lab header and section index rather than product labels such as Chat, Learn, or Logbook. The index will become a keyboard-accessible anchor list and collapse to a wrapping or horizontally scrollable mobile treatment without forcing page-wide horizontal overflow.

### Prefer semantic HTML and CSS responsiveness

Use a single main landmark, a labeled section-navigation landmark, heading hierarchy, lists for token collections, visible labels for every swatch, and normal links for route/section navigation. Existing `:focus-visible` and reduced-motion rules remain the global accessibility baseline. Layout changes will use Tailwind responsive utilities and/or scoped CSS media queries; no backend state or resize service is needed for the required breakpoint reference.

### Verification through existing guardrails plus route smoke checks

Run `scripts/precommit-run` for the repository's Docker-backed format, lint, typecheck, dead-code, test, and build checks. Separately verify both `/` and `/showcase` by starting the Vite dev server and by building then serving the frontend with `vite preview`; request `/showcase` directly and refresh it in a browser-capable check. Exercise the showcase at a narrow mobile width and a desktop width, including keyboard focus on the section links and root link.

## Risks / Trade-offs

- **[History fallback depends on the serving layer]** → Validate Vite dev and preview explicitly. If a future production host does not rewrite `/showcase` to `index.html`, add that host configuration separately rather than hiding the route behind hash history.
- **[Showcase metadata can drift from the stylesheet]** → Keep actual values in CSS custom properties and have the view reference variable names; do not copy hex values or font declarations into a second theme file.
- **[Dynamic Tailwind utilities may be omitted from the build]** → Use statically discoverable classes and CSS-variable inline styles for data-driven specimens.
- **[Large display tokens can overflow narrow screens]** → Use short specimens, constrained containers, responsive sizing where presentation-only, and test at the repository's 320px minimum.
- **[An internal label could be mistaken for access control]** → Keep the route static and clearly labeled, but document that authentication and production gating are explicitly outside this change.
- **[Router integration could accidentally replace the scaffold]** → Preserve the current root content as the `/` view and verify `/` alongside `/showcase`.

## Migration Plan

No data migration or backend deployment is required. Add the frontend dependency and route/view files, then build the frontend normally. Rollback is a source revert: remove the router dependency and route/view additions and restore the direct `createApp(App).mount("#app")` bootstrap. Any static-host rewrite configuration is explicitly outside this change and therefore has no migration step here.

## Open Questions

None are blocking for implementation. The design intentionally treats “internal” as a visual/source-level designation rather than a security boundary and treats responsive breakpoints as the current Tailwind defaults rather than new custom theme tokens.
