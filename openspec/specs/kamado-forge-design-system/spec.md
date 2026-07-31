# kamado-forge-design-system Specification

## Purpose
TBD - created by archiving change task-abdb65be-05de-4c51-b160-bea0200337e7. Update Purpose after archive.
## Requirements
### Requirement: Forge palette and semantic Tailwind theme

The frontend SHALL implement the design foundation in `frontend/src/style.css` with valid Tailwind v4 CSS-first utility-facing tokens. It MUST preserve `background`, `foreground`, `card`, `muted-foreground`, and `border`, and provide semantic canvas, surface, text, and border aliases.

It MUST define warm `ember` `#e4511a` and `smoke` `#f1620f`; surface `char` `#101011`, `ash` `#1f1e1e`, and `stone` `#282727`; neutral `neutral-obsidian` `#0d0d0d`, `neutral-onyx` `#141414`, `neutral-slate` `#1f1f1f`, `neutral-pewter` `#2d2d2d`, `neutral-steel` `#3e3e3e`, `neutral-mist` `#a0a0a0`, `neutral-smoke` `#d1d1d1`, and `neutral-frost` `#f5f5f5`; and distinct `fire` `#f0311d`, `success` `#2ba558`, `warning` `#ecb016`, and `info` `#278cd0` status tokens. Ember/smoke are accents; status tokens are semantic signals, not extra brand colors.

`smoke` MUST identify only the warm accent. The light source swatch with the duplicate label MUST be `neutral-smoke` and MUST NOT overwrite or ambiguously alias warm `smoke`.

#### Scenario: Existing semantic utilities remain available

- **WHEN** the current frontend scaffold is built with the expanded theme
- **THEN** its background, foreground, card, muted-foreground, and border semantic utilities resolve

#### Scenario: Warm and neutral smoke are distinct

- **WHEN** a consumer selects the warm accent
- **THEN** `smoke` resolves to `#f1620f` and `neutral-smoke` separately resolves to `#d1d1d1`

### Requirement: Local fonts and explicit typography

The frontend SHALL load Anton, Bebas Neue, and Inter from installed local font packages rather than a hosted request. It MUST provide sensible fallback stacks and assign Anton to display text, Bebas Neue to condensed headings/compact labels, and Inter to body/UI copy.

Typography tokens MUST encode Anton display `96px / 1 / -0.02em` and `64px / 1 / -0.02em`; Bebas Neue `36px / 1.1 / 0.02em`, `24px / 1.2 / 0.02em`, and `18px / 1.2 / 0.04em`; and Inter `16px / 1.6 / 0`, `14px / 1.6 / 0`, `12px / 1.5 / 0`, and `11px / 1.4 / 0.02em` for body/caption roles.

#### Scenario: Local typography roles load

- **WHEN** the built frontend loads the global stylesheet
- **THEN** package-managed Anton, Bebas Neue, and Inter assets and their defined role tokens are available without a remote font dependency

### Requirement: Reusable layout, depth, and motion primitives

The stylesheet SHALL expose Tailwind v4-consumable spacing tokens for `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`, and `128px`. It MUST expose a compact-to-pill radius scale and elevated, inset, and outline depth recipes rather than page-specific values.

It MUST expose `cubic-bezier(0.4, 0, 0.2, 1)` and fast, normal, and slow durations of `150ms`, `300ms`, and `500ms` as reusable motion tokens.

#### Scenario: A surface uses foundation primitives

- **WHEN** future frontend UI needs spacing, corners, depth, or motion
- **THEN** it can select the defined theme tokens without a page-specific visual value

### Requirement: Accessible dark global defaults

Base styles SHALL establish a dark canvas/surface hierarchy and use Inter as the default body/UI face. Default light reading text on char, ash, and stone MUST meet WCAG AA normal-text contrast of at least 4.5:1; warm accent and status colors MUST NOT be the default normal-text pairing unless independently contrast-safe.

The stylesheet MUST provide a global offset `:focus-visible` treatment with adequate non-text contrast on every intended dark base and MUST NOT remove it through a broad outline reset. A `prefers-reduced-motion: reduce` rule MUST effectively minimize nonessential animation, transitions, and smooth scrolling while retaining focus usability.

#### Scenario: Reading text is safe on forge surfaces

- **WHEN** default reading text is shown on char, ash, or stone
- **THEN** its contrast ratio is at least 4.5:1

#### Scenario: Keyboard and motion preferences are honored

- **WHEN** an eligible element receives keyboard focus on an intended dark base
- **THEN** a clearly visible offset focus indicator remains present

- **WHEN** the user prefers reduced motion
- **THEN** nonessential animation, transitions, and smooth scrolling are effectively minimized

### Requirement: Frontend-only package boundary and verification

The implementation SHALL limit behavior changes to the frontend foundation and the internal component showcase. It MUST preserve the existing local font dependencies, design tokens, accessibility defaults, and matching root `bun.lock` entries; it MAY add the Vue Router dependency and router, root-view, and showcase source files under `frontend/src/`. The current scaffold MUST remain the normal application experience at `/`. Backend behavior, persistence, product feature pages, product navigation, architecture models, and project documentation MUST remain unchanged. The implementation MUST pass `scripts/precommit-run`, including the frozen-lockfile frontend build, and MUST verify direct navigation and refresh for `/showcase` in Vite development and built preview.

#### Scenario: Repository verification succeeds

- **WHEN** the implementation is complete
- **THEN** `scripts/precommit-run` completes with the frontend dependency manifest and root lockfile in sync

#### Scenario: Frontend-only scope is preserved

- **WHEN** the change is reviewed
- **THEN** all behavior changes are limited to frontend routing and the static showcase, with no backend, persistence, product-feature, architecture, or documentation changes

#### Scenario: Root and showcase routes are both verified

- **WHEN** the frontend is run in Vite development and built preview
- **THEN** `/` still renders the normal scaffold and `/showcase` renders successfully after direct navigation and refresh
