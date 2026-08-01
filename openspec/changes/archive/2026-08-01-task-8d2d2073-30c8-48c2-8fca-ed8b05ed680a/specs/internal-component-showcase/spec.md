# Internal Component Showcase Specification

## MODIFIED Requirements

### Requirement: Routed showcase preserves the normal application root

The frontend SHALL use an application shell with Today as the normal application route at `/` and `/today`, Live at `/live`, and a named visual-development route at `/showcase`. The showcase MUST NOT replace Today at the root. The `/showcase` route MUST remain directly navigable and refreshable when served by the Vite development server and by the built frontend preview.

The route source MUST identify `/showcase` as an internal design-system surface and MUST provide a clear way back to `/`. This designation is informational and MUST NOT be treated as authentication or authorization.

#### Scenario: Today owns the normal root

- **WHEN** a user navigates to `/` or `/today`
- **THEN** the Today application view renders rather than the showcase

#### Scenario: Showcase is reachable by direct URL

- **WHEN** a browser requests `/showcase` directly or refreshes the page at that URL in Vite development or built preview
- **THEN** the SPA loads the showcase view without a server-side 404

#### Scenario: Showcase intent is visible

- **WHEN** a user views the showcase route
- **THEN** the page visibly identifies itself as an internal design-system/component showcase and exposes a link to the normal application root
