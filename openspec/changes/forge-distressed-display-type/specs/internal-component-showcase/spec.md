# internal-component-showcase Specification

## ADDED Requirements

### Requirement: Showcase exposes display type treatments

The `/showcase` view SHALL provide labeled specimens for the distressed display treatment alongside its clean equivalent, so the two renderings are directly comparable without navigating product routes.

Specimens MUST cover each atmosphere level at which display type is rendered, demonstrating that `flat` and `low` regions render solid and that `mid` and above render distressed. Specimens MUST include display text at the smallest size the treatment permits and at a size below the floor, so the legibility floor is reviewable rather than assumed.

Specimens MUST be labeled with the atmosphere level, the computed size, and whether the treatment is active. Showcase content MUST remain static and frontend-only; it MUST NOT fetch backend data or render product-domain content.

#### Scenario: Distressed and clean display type are comparable

- **WHEN** a user opens the display type section
- **THEN** the page renders a distressed specimen and its clean equivalent side by side, each labeled with its atmosphere level and whether the treatment is active

#### Scenario: The size floor is demonstrated

- **WHEN** a user opens the display type section
- **THEN** the page renders display text at the smallest permitted size and at a size below the floor, and the specimen below the floor renders solid

#### Scenario: Budget gating is demonstrated

- **WHEN** a user opens the display type section
- **THEN** display specimens in `flat` and `low` regions render solid and specimens at `mid` and above render distressed
