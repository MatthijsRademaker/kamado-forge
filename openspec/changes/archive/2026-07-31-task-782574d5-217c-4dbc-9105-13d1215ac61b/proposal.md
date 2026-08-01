## Why

The frontend currently renders a route-thin component showcase at both `/` and `/showcase`, so it does not provide durable product navigation or a session-centered application entry point. Kamado Forge needs a responsive shell that lets users deep-link to the five authoritative product areas, identify their current area, and return quickly to an active cook, while keeping the internal showcase isolated from product navigation.

## What Changes

- Add Vue Router in history mode with named routes for `/today`, `/plan`, `/coach`, `/learn`, and `/logbook`, plus a replace-style redirect from `/` to `/today`.
- Render the five product routes through a shared `ProductShell`; keep `/showcase` as a directly addressable standalone route outside product chrome.
- Drive desktop and mobile navigation from one authoritative route configuration containing exactly Today, Plan, Coach, Learn, and Logbook.
- Add a persistent `lg` desktop sidebar and contextual header, plus a compact header and accessible Sheet menu below `lg`.
- Add unique, orientation-only placeholders for the five product routes, active-route semantics, a first-focus skip link, labeled landmarks, and a prominent static `Continue active cook` link to Today.
- Add executable coverage for direct navigation and refresh in Vite development and built preview, root redirection, showcase isolation, active state, responsive behavior, skip-link focus, and mobile-menu keyboard behavior.
- Reconcile the obsolete root/no-router OpenSpec clauses and update the affected LikeC4 and project route documentation.

## Capabilities

### New Capabilities

- `responsive-application-shell`: Provides durable product routing, responsive shell navigation, active-route orientation, active-cook continuation, and shell accessibility behavior.

### Modified Capabilities

- `kamado-ui-primitives`: Replace the obsolete no-router/root-showcase contract while preserving the standalone responsive primitive gallery.
- `kamado-forge-design-system`: Permit the product router and shell plus matching architecture/documentation updates while preserving the Forge visual and accessibility foundation and backend boundaries.

## Impact

- Frontend dependency metadata and the root lockfile gain synchronized Vue Router entries.
- Frontend bootstrap, route definitions, product-shell components, route placeholders, and E2E coverage change.
- `/` becomes the canonical session entry and redirects to `/today`; `/showcase` remains refreshable but is not exposed in product navigation or wrapped in product chrome.
- Affected OpenSpec contracts, `.devagent/architecture` LikeC4 descriptions, and targeted project route/directory documentation are updated to match the shipped layout.
- Backend APIs, persistence, authentication, profile/community, equipment, settings, real session state, and feature-page implementations remain unchanged.

## Traceability

- `task:782574d5-217c-4dbc-9105-13d1215ac61b`
- `decision:1-swarm-architect-recommendation`
- `decision:1-swarm-reviewer-recommendation`
- `decision:1-swarm-lead-dev-recommendation`
