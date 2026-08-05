# kamado-forge-design-system Specification

## ADDED Requirements

### Requirement: Display type carries a distressed treatment

The stylesheet SHALL provide a distressed treatment that composites an eroded texture onto display-role glyphs, reproducing the letterpress character of the display headlines in the design references. The treatment MUST derive its texture from the shared grain source rather than introducing a second texture pipeline, and MUST NOT depend on a raster image asset.

The treatment SHALL apply only to the display typography role. Heading, label, body, UI, small, and caption roles MUST NOT be distressed.

The treatment MUST be available to display text applied through a utility class and to display text applied through a raw CSS rule consuming the display font custom property, so that every display headline in the product renders consistently.

#### Scenario: Display headlines are distressed

- **WHEN** a display-role headline renders in a region that permits the treatment
- **THEN** its glyphs carry the eroded texture rather than a flat fill

#### Scenario: Non-display roles are never distressed

- **WHEN** heading, label, body, UI, small, or caption text renders at any atmosphere level
- **THEN** it renders with a flat fill and no eroded texture

#### Scenario: Both application paths render alike

- **WHEN** one display headline applies the display face through a utility class and another applies it through a raw CSS rule using the display font custom property
- **THEN** both render the same treatment

### Requirement: Distress is gated by atmosphere budget and a size floor

The distressed treatment SHALL activate only in a region resolving to atmosphere level `mid` or above. Display text in a `flat` or `low` region MUST render solid.

The treatment SHALL be inert below a declared minimum computed font size, rendering solid without warning or partial application. The floor MUST be enforced by the treatment rather than stated as guidance, so that a viewport-relative size driven below the floor cannot produce distressed text.

#### Scenario: Operational regions render clean display type

- **WHEN** a display-role headline renders inside a region resolving to atmosphere `flat`
- **THEN** it renders solid, including the largest headline in that region

#### Scenario: Small display text renders solid

- **WHEN** a display-role headline computes to a font size below the declared floor, including when a viewport-relative size drives it there
- **THEN** it renders solid rather than distressed or partially distressed

### Requirement: Distress degrades to solid and preserves real text

The distressed treatment MUST NOT render a headline invisible under any condition. Solid display type SHALL be the default, with the treatment applied additively behind a feature-support guard, so that any unsupported or unhandled context resolves to legible solid type.

The treatment MUST resolve to solid type under forced-colors mode, under a user preference for increased contrast, and when printing.

Distressed headlines MUST remain real text. The treatment MUST NOT replace headings with images or vector text elements, and MUST NOT duplicate heading content into a pseudo-element or a second node. Assistive-technology output, find-in-page, and text selection MUST be unaffected.

Distressed display text MUST continue to meet WCAG AA normal-text contrast of at least 4.5:1 against its surface. Where the treatment's intensity would breach that floor, the intensity MUST be reduced rather than the floor waived.

#### Scenario: Unsupported rendering stays legible

- **WHEN** the browser does not support clipping a background to text
- **THEN** the headline renders as solid display type and is never invisible

#### Scenario: Accessibility and print contexts force solid type

- **WHEN** forced-colors mode is active, the user prefers increased contrast, or the page is printed
- **THEN** display headlines render solid

#### Scenario: Headings remain real text

- **WHEN** a distressed headline is read by a screen reader, searched with find-in-page, or selected
- **THEN** it behaves as ordinary text, is announced exactly once, and its content is not duplicated

#### Scenario: Distressed text meets the contrast floor

- **WHEN** a distressed headline renders at its maximum permitted intensity
- **THEN** its contrast ratio against its surface is at least 4.5:1
