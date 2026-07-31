## ADDED Requirements

### Requirement: Canonical product routing and isolated layouts

The frontend SHALL use Vue Router history mode with named routes for `/today`, `/plan`, `/coach`, `/learn`, and `/logbook`. The `/` route MUST redirect with replacement to `/today`. Each product route MUST render through the shared product shell and provide a unique route heading. The `/showcase` route MUST render the existing component gallery directly outside the product shell, MUST remain directly navigable and refreshable, and MUST NOT appear in product navigation. The change MUST NOT add a catch-all route.

#### Scenario: Root resolves canonically to Today

- **WHEN** a user visits `/`
- **THEN** the router replaces the root URL with `/today`, renders the Today placeholder, and exposes Today as the current product destination

#### Scenario: Product route survives direct load and refresh

- **WHEN** a user directly loads or refreshes any of `/today`, `/plan`, `/coach`, `/learn`, or `/logbook` in Vite development or built preview
- **THEN** the SPA loads without a server-side 404 and renders the unique heading for that route inside the product shell

#### Scenario: Showcase remains isolated

- **WHEN** a user directly loads or refreshes `/showcase`
- **THEN** the primitive gallery renders without the product sidebar, product mobile menu, or active-cook continuation affordance

### Requirement: Authoritative responsive product navigation

The product shell MUST generate desktop and mobile navigation from one authoritative ordered configuration containing exactly Today, Plan, Coach, Learn, and Logbook. At the `lg` breakpoint and wider, it SHALL expose a persistent sidebar and contextual header. Below `lg`, it SHALL replace the persistent sidebar with a compact header and clearly named menu trigger. Only the navigation presentation active at the current breakpoint MUST be exposed to assistive technology or keyboard navigation.

On every product route, exactly one exposed destination MUST carry `aria-current="page"`. Its visible active treatment MUST include a cue that does not rely on color alone. Product chrome and content MUST remain operable from 320px upward without page-level horizontal overflow.

#### Scenario: Desktop exposes the authoritative destinations

- **WHEN** a product route is viewed at or above `lg`
- **THEN** the persistent sidebar shows exactly Today, Plan, Coach, Learn, and Logbook with a contextual header and no Showcase or out-of-scope destination

#### Scenario: Mobile replaces persistent navigation

- **WHEN** a product route is viewed below `lg`
- **THEN** the persistent sidebar is not exposed or keyboard reachable and the compact header provides a named menu trigger for the same five destinations

#### Scenario: Current route is unambiguous

- **WHEN** any product route is active
- **THEN** exactly one exposed product link has `aria-current="page"` and a visible non-color current-state cue

#### Scenario: Minimum-width layout remains operable

- **WHEN** the shell and mobile menu are used at a 320px viewport
- **THEN** navigation and route content remain readable and keyboard operable without page-level horizontal scrolling

### Requirement: Accessible shell and mobile menu behavior

On every product route, the first keyboard-reachable control MUST be a skip link targeting the unique current-route main-content region. Activating the skip link MUST move focus to that main region. The shell SHALL use semantic header, navigation, and main landmarks with accessible labels where needed, and all navigation and menu controls MUST retain visible keyboard focus and reduced-motion behavior.

The mobile menu SHALL compose the existing Reka-backed Sheet. Its trigger MUST expose open state and the controlled panel to assistive technology, and the panel MUST have an accessible name. While open, menu destinations MUST be keyboard operable. The menu MUST close on Escape and route selection, and Escape dismissal MUST restore focus to the trigger. Closed or breakpoint-inactive navigation MUST NOT leave hidden keyboard targets.

#### Scenario: Keyboard user skips repeated chrome

- **WHEN** a keyboard user activates the first-focus skip link on a product route
- **THEN** focus moves to the unique main-content region for that route and bypasses repeated shell navigation

#### Scenario: Assistive technology can identify menu state

- **WHEN** a user opens the mobile menu
- **THEN** the trigger exposes its expanded state and controlled panel and the open panel exposes an accessible menu name

#### Scenario: Escape dismisses and restores focus

- **WHEN** a keyboard user opens the mobile menu and presses Escape
- **THEN** the menu closes and focus returns to its trigger

#### Scenario: Route selection dismisses the menu

- **WHEN** a user activates a product destination in the open mobile menu
- **THEN** the route changes and the menu closes

### Requirement: Session-centered continuation without session state

The product shell SHALL provide a prominent link labeled `Continue active cook` that routes to `/today` throughout the five product routes. The affordance MUST remain static and frontend-only and MUST NOT fetch, persist, fabricate, or imply active-session data.

#### Scenario: User returns to Today from product chrome

- **WHEN** a user activates `Continue active cook` from any product route
- **THEN** the router navigates to `/today` without invoking a session API or requiring persisted session state

### Requirement: Scope-safe product placeholders

Each product route SHALL render a distinct heading and concise orientation copy for its authoritative area. Placeholders MUST NOT include planner, live-cook, coach, learning, or logbook feature controls and MUST NOT request backend data.

#### Scenario: Product placeholder identifies its area

- **WHEN** a user visits one of the five product routes
- **THEN** the main region identifies that area with its unique heading and orientation copy without presenting unfinished feature actions

### Requirement: Application shell verification

The implementation MUST preserve existing showcase and design-system coverage except for replacing the obsolete assertion that `/` renders the showcase. Automated verification MUST cover root redirection, direct navigation and refresh for all five product paths and `/showcase` in Vite development and built preview, current-route semantics, shell/showcase isolation, skip-link focus transfer, mobile-menu keyboard behavior, route-selection dismissal, Escape focus restoration, breakpoint presentation, and 320px overflow. The implementation MUST complete `scripts/precommit-run` with frontend dependency metadata and the root lockfile synchronized.

#### Scenario: Routing and shell checks complete

- **WHEN** the change is prepared for completion
- **THEN** the development and built-preview route checks pass for all six named routes and `scripts/precommit-run` completes successfully
