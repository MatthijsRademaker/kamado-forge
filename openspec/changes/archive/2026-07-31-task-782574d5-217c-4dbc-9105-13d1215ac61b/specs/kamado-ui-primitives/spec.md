## MODIFIED Requirements

### Requirement: Direct responsive primitive showcase

The application MUST make `/showcase` directly reachable through Vue Router history mode as a standalone route outside the product shell. The root path MUST redirect with replacement to `/today` rather than render the showcase. The showcase MUST live outside `components/ui`, own its illustrative sample data and interaction state, demonstrate the public variants and interactive states of every named primitive and custom composition, and MUST NOT introduce a session, coach, learn, or logbook feature page. It MUST NOT appear in desktop or mobile product navigation.

#### Scenario: A visitor opens the showcase URL

- **WHEN** a visitor directly loads or refreshes `/showcase` in Vite development or built preview
- **THEN** the responsive primitive gallery renders without product shell chrome or a server-side 404

#### Scenario: A visitor uses a narrow viewport

- **WHEN** the showcase is viewed at a narrow mobile width
- **THEN** controls, forms, tabs, dialogs, and sheets remain readable and operable without clipped controls or page-level horizontal overflow, while sections use multiple columns only where space permits

#### Scenario: A visitor opens the application root

- **WHEN** a visitor loads `/`
- **THEN** the router replaces the URL with `/today` and renders the product shell rather than the primitive showcase
