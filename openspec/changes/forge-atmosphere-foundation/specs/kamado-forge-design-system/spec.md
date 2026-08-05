# kamado-forge-design-system Specification

## MODIFIED Requirements

### Requirement: Reusable layout, depth, and motion primitives

The stylesheet SHALL expose Tailwind v4-consumable spacing tokens for `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`, and `128px`. It MUST expose a compact-to-pill radius scale and elevated, inset, outline, and glass depth recipes rather than page-specific values.

Depth recipes MUST be composable surface treatments, not flat single-value fills. The `elevated`, `inset`, and `outline` recipes MUST each render a top-edge highlight and a vertical gradient that distinguishes the top of the surface from its base, consuming the existing `--shadow-inset` highlight rather than redefining it. The `glass` recipe MUST render a translucent surface that remains legible over the dark canvas.

It MUST expose `cubic-bezier(0.4, 0, 0.2, 1)` and fast, normal, and slow durations of `150ms`, `300ms`, and `500ms` as reusable motion tokens.

#### Scenario: A surface uses foundation primitives

- **WHEN** future frontend UI needs spacing, corners, depth, or motion
- **THEN** it can select the defined theme tokens without a page-specific visual value

#### Scenario: Depth recipes render as layered surfaces

- **WHEN** a surface applies the elevated, inset, or outline recipe
- **THEN** it renders a top-edge highlight and a vertical gradient rather than a flat single-value background fill

## ADDED Requirements

### Requirement: Grain and ember-glow effect primitives

The stylesheet SHALL provide a grain primitive implementing the charcoal and stone texture treatments of the design system, and an ember-glow primitive implementing the warm accent bloom. Both MUST be reusable theme primitives rather than page-specific values, and both MUST derive intensity from the inherited atmosphere budget.

The grain primitive MUST NOT depend on a raster image asset. Both primitives MUST composite onto a single pseudo-element per surface so that the consuming component retains a free pseudo-element.

The ember glow MUST derive its color from the existing warm accent token and MUST be positionable and sizable from custom properties rather than being constrained to a uniform border-box spread.

#### Scenario: Grain requires no image asset

- **WHEN** the frontend is built
- **THEN** the grain primitive renders without loading any raster image file

#### Scenario: Effects share one pseudo-element

- **WHEN** a surface renders both grain and ember glow
- **THEN** both composite onto the same pseudo-element and the surface's other pseudo-element remains available to the consuming component

#### Scenario: Glow follows the accent token

- **WHEN** the warm accent token value changes
- **THEN** the ember glow color changes with it rather than resolving to a duplicated literal color

### Requirement: Effect layers preserve text contrast and motion preferences

Effect layers SHALL be composited beneath surface content and MUST NOT blend over text. A surface applying grain or ember glow MUST establish an isolated stacking context, place the effect layer below content, and make the effect layer non-interactive.

Default light reading text on char, ash, and stone MUST continue to meet WCAG AA normal-text contrast of at least 4.5:1 with any effect layer applied at any atmosphere level. No grain or glow treatment may be the cause of text falling below that floor.

Any animated effect behavior MUST be minimized under `prefers-reduced-motion: reduce` in keeping with the existing reduced-motion rule.

#### Scenario: Text contrast survives the heaviest treatment

- **WHEN** default reading text renders on char, ash, or stone inside a region at atmosphere level `high`
- **THEN** its contrast ratio is at least 4.5:1

#### Scenario: Effect layers do not blend over content

- **WHEN** a surface renders a grain or ember-glow layer
- **THEN** the layer is beneath the surface's content in the stacking order and does not composite over text

#### Scenario: Effect layers do not capture input

- **WHEN** a user clicks or taps a control on a surface carrying an effect layer
- **THEN** the control receives the interaction and the effect layer does not intercept it

#### Scenario: Animated effects honor reduced motion

- **WHEN** the user prefers reduced motion and a surface carries an animated effect
- **THEN** that animation is effectively minimized while the surface remains legible
