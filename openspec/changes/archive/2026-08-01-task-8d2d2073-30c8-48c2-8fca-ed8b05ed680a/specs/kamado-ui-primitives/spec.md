# Kamado UI Primitives Specification

## MODIFIED Requirements

### Requirement: Direct responsive primitive showcase

The application MUST make `/showcase` directly reachable through the application shell while `/` and `/today` render Today and `/live` renders Live. The showcase MUST live outside `components/ui`, own its illustrative sample data and interaction state, demonstrate the public variants and interactive states of every named primitive and custom composition, and MUST NOT own session-flow state or fetch product data.

#### Scenario: A visitor opens the showcase URL

- **WHEN** a visitor directly loads `/showcase` in the served frontend
- **THEN** a responsive primitive gallery renders instead of Today or Live content

#### Scenario: A visitor uses a narrow viewport

- **WHEN** the showcase is viewed at a narrow mobile width
- **THEN** controls, forms, tabs, dialogs, and sheets remain readable and operable without clipped controls or page-level horizontal overflow, while sections use multiple columns only where space permits

#### Scenario: A visitor opens a product route

- **WHEN** a visitor directly loads `/`, `/today`, or `/live`
- **THEN** the corresponding product view renders without moving session-flow behavior into generic UI primitives
