# internal-component-showcase Specification

## Purpose
TBD - created by archiving change task-4f48b314-b41b-4fa3-914f-8e01b1dabcd1. Update Purpose after archive.
## Requirements
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

### Requirement: Showcase exposes the Forge visual foundation

The `/showcase` view SHALL provide labeled visual specimens for the existing Forge design foundation: palette and semantic color tokens, typography roles and type scale, spacing tokens, and surface/effect primitives including surfaces, borders, radii, shadows, inset, and outline treatments. Specimens MUST consume the CSS custom properties and font roles defined by `frontend/src/style.css` rather than introducing a competing palette, typography scale, or hard-coded visual source of truth.

Every specimen MUST expose enough textual labeling to identify its role or token without relying on color alone. Showcase content MUST remain static and frontend-only; it MUST NOT fetch backend data or render product-domain content.

#### Scenario: Existing color and semantic tokens are inspectable

- **WHEN** a user opens the colors section
- **THEN** the page shows named visual swatches and token references for the existing Forge palette and semantic status colors

#### Scenario: Existing typography roles are inspectable

- **WHEN** a user opens the typography section
- **THEN** the page renders representative samples for the existing display, heading, label, body, UI, small, and caption roles with their role names and scale metadata

#### Scenario: Existing spacing and surface primitives are inspectable

- **WHEN** a user opens the spacing or surfaces section
- **THEN** the page shows the defined spacing scale and demonstrates the existing surface, border, radius, shadow, inset, and outline primitives

### Requirement: Responsive breakpoints and showcase layout are usable

The showcase SHALL document and exercise the current Tailwind CSS responsive breakpoint contract: base, `sm` at 640px, `md` at 768px, `lg` at 1024px, `xl` at 1280px, and `2xl` at 1536px. Its layout MUST reflow from a single-column mobile presentation to a multi-column desktop presentation without requiring backend state or a separate viewport service.

The page MUST remain usable at the frontend minimum width of 320px and at desktop widths. It MUST NOT introduce page-wide horizontal overflow for normal content, and token labels, section navigation, and specimens MUST remain readable at both ends of that range.

#### Scenario: Breakpoint contract is visible

- **WHEN** a user opens the responsive breakpoint section
- **THEN** the page lists the breakpoint names and thresholds and includes a specimen whose layout demonstrates responsive reflow

#### Scenario: Mobile layout remains usable

- **WHEN** the showcase is viewed at a 320px-to-small-mobile viewport
- **THEN** sections stack or wrap within the viewport, section navigation remains usable, and normal content does not require horizontal scrolling

#### Scenario: Desktop layout uses available space

- **WHEN** the showcase is viewed at a desktop viewport
- **THEN** the page uses a readable multi-column layout for its index and specimens without losing labels or focus targets

### Requirement: Showcase interaction is accessible and product scope is isolated

The showcase SHALL use semantic landmarks and headings, keyboard-accessible section and route links, visible focus indicators, and readable text labels. It MUST preserve the global reduced-motion behavior and MUST NOT add product navigation, product-page routes, backend calls, persistence, authentication, or architecture-model changes.

#### Scenario: Keyboard navigation exposes the page structure

- **WHEN** a keyboard user tabs through the showcase
- **THEN** the section links and root link receive visible focus and can be activated without pointer input

#### Scenario: Showcase has no product or backend coupling

- **WHEN** the showcase is built and loaded without the backend running
- **THEN** all required specimens render from frontend source and design tokens without API requests or product-domain data

#### Scenario: Reduced motion remains honored

- **WHEN** a user has enabled `prefers-reduced-motion: reduce`
- **THEN** nonessential showcase transitions or animations are minimized by the existing global motion rules while content and focus usability remain intact
