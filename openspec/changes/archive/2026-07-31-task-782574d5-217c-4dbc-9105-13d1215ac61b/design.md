## Context

The Vue 3/Vite frontend currently inspects `window.location.pathname`, installs no router, and renders `KamadoShowcase` for both `/` and `/showcase`. The established Forge stylesheet already supplies the dark visual language, a 320px minimum, visible focus treatment, and reduced-motion behavior. The existing Reka-backed Sheet is the approved focus-sensitive primitive for mobile navigation. The product vocabulary and hierarchy are authoritative—Today, Plan, Coach, Learn, and Logbook—while the design images are visual references only.

This change is frontend-local in behavior, but introducing a router and product layout changes documented route and directory contracts. The associated OpenSpec, LikeC4, and targeted project documentation updates are therefore part of the same change.

## Goals / Non-Goals

**Goals:**

- Provide history-mode routes for all five product areas, with `/` resolving canonically to Today.
- Use one route-aware product layout and one shared navigation model for desktop and mobile presentations.
- Preserve `/showcase` as an isolated internal development surface.
- Make the shell usable from 320px upward and operable by keyboard and assistive technology.
- Keep an active-cook continuation path prominent without inventing session state.
- Prove direct-route refresh behavior in both Vite development and built preview.

**Non-Goals:**

- Implement planner, live-cook, coach, learning, or logbook feature behavior beyond placeholders.
- Add backend calls, session APIs, persistence, generated API operations, LLM behavior, authentication, profile/community, equipment, settings, hardware integration, or telemetry.
- Redesign Forge tokens, typography, spacing, primitives, or motion foundations.
- Add a custom not-found experience, catch-all routing policy, or production-host rewrite configuration.
- Expose `/showcase` in product navigation.

## Decisions

### Use Vue Router history mode and canonical route records

Install Vue Router, register it in frontend bootstrap, and define named routes for `/today`, `/plan`, `/coach`, `/learn`, `/logbook`, and `/showcase`. `/` redirects with replacement to `/today`, keeping Today as the canonical session entry and making active-route semantics unambiguous. Do not add a catch-all route in this increment. Vite development and preview are the serving targets for direct-load and refresh verification; deployment-specific rewrites remain outside the task.

### Separate product and showcase layout boundaries

The five product routes render through `ProductShell`. `/showcase` renders `KamadoShowcase` directly, without the product sidebar, mobile menu, contextual product header, or active-cook affordance. This prevents the internal surface from becoming an advertised product destination.

### Generate both responsive navigation presentations from one model

Create one authoritative route metadata source ordered Today, Plan, Coach, Learn, and Logbook. Use it for the persistent desktop sidebar at `lg` and the mobile Sheet below `lg`. The inactive responsive presentation must be removed from the accessibility tree and keyboard order so only one current destination is exposed. Router state determines `aria-current="page"`; the visual current state also includes a non-color cue.

### Keep the shell session-centered without creating data contracts

Expose a prominent, static `Continue active cook` link to `/today` throughout the product shell. It is a presentational continuation affordance only: it does not load, persist, fabricate, or imply active-session data. Each product route supplies only a unique heading and concise orientation copy.

### Compose existing accessibility primitives

Make the skip link the first keyboard-reachable control and target one unique, focusable main-content region. Use semantic header, navigation, and main landmarks with accessible names where needed. Compose the existing Reka-backed Sheet instead of recreating overlay focus logic; expose trigger expanded/controlled state, provide an accessible menu name, close on Escape and route selection, and restore trigger focus after Escape dismissal. Preserve global visible-focus and reduced-motion behavior.

### Verify responsive routing at the actual serving boundaries

Extend Playwright coverage rather than relying only on route declarations. Exercise direct visits and refreshes for all five product routes and `/showcase` against Vite development and built preview. Cover the replacement root redirect, unique headings, one exposed current destination, shell/showcase isolation, skip-link focus transfer, Sheet keyboard behavior, route-selection dismissal, Escape focus restoration, and no page-level horizontal overflow at 320px and around the `lg` boundary. Preserve existing showcase/design-system coverage except for replacing the obsolete assertion that `/` renders the showcase.

### Reconcile only affected contracts and documentation

Provide deltas that supersede the no-router/root-showcase primitive requirement and the design-system prohibition on product navigation and documentation changes. Update the LikeC4 shell/navigation descriptions and only project documentation statements made stale by the new router or route/directory layout. Preserve design-system guarantees and all backend boundaries.

## Risks

- **History routes can work client-side but fail on refresh.** Verify the full route matrix in both Vite development and built preview.
- **Two responsive navigation renderings can create duplicate current links or hidden tabbables.** Use one model, breakpoint-safe exposure, and assertions against the visible/accessibility-tree navigation.
- **Custom Sheet state can regress focus behavior.** Keep Reka behavior intact and test Escape restoration and route-selection dismissal.
- **Fixed chrome or long labels can overflow at 320px.** Constrain drawer/header sizing, allow content to shrink, and test actual page width rather than masking overflow.
- **The continuation link can imply live data.** Keep its copy generic, route it to Today, and add no store or API contract.
- **Partial contract updates can leave canonical sources contradictory.** Land the OpenSpec deltas, LikeC4 updates, and targeted route documentation with the implementation.
- **Dependency drift can break reproducible verification.** Update the frontend manifest and root lockfile together.

## Traceability

- `task:782574d5-217c-4dbc-9105-13d1215ac61b`
- `round:1:agent:swarm-architect`
- `round:1:agent:swarm-reviewer`
- `round:1:agent:swarm-lead-dev`
- `decision:1-swarm-architect-recommendation`
- `decision:1-swarm-reviewer-recommendation`
- `decision:1-swarm-lead-dev-recommendation`
