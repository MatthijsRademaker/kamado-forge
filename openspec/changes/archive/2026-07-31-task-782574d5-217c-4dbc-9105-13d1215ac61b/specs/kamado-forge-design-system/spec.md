## MODIFIED Requirements

### Requirement: Frontend-only package boundary and verification

The implementation SHALL limit product behavior changes to frontend routing, the responsive product shell, route placeholders, and the internal component showcase. It MUST preserve the existing local font dependencies, design tokens, accessibility defaults, and matching root `bun.lock` entries; it MAY add the Vue Router dependency and router, product-shell, navigation, route-view, and showcase source files under `frontend/src/`. Backend behavior, APIs, persistence, authentication, and implemented product feature behavior MUST remain unchanged. Matching OpenSpec deltas, LikeC4 shell/navigation descriptions, and targeted project route or directory documentation MAY change to describe the shipped frontend contract.

The implementation MUST pass `scripts/precommit-run`, including the frozen-lockfile frontend build, and MUST verify direct navigation and refresh for `/today`, `/plan`, `/coach`, `/learn`, `/logbook`, and `/showcase` in Vite development and built preview.

#### Scenario: Repository verification succeeds

- **WHEN** the implementation is complete
- **THEN** `scripts/precommit-run` completes with the frontend dependency manifest and root lockfile in sync

#### Scenario: Frontend and backend boundaries are preserved

- **WHEN** the change is reviewed
- **THEN** behavior changes are limited to frontend routing, shell navigation, static route placeholders, and the showcase, with no backend, persistence, authentication, or product-feature implementation changes

#### Scenario: Product and showcase routes are verified

- **WHEN** the frontend is run in Vite development and built preview
- **THEN** `/` redirects with replacement to `/today`, all five product routes render their placeholders after direct navigation and refresh, and `/showcase` renders standalone after direct navigation and refresh

#### Scenario: Documentation reflects the shipped route contract

- **WHEN** router or frontend directory contracts change for the product shell
- **THEN** the affected OpenSpec, LikeC4, and targeted project route documentation describes the new frontend contract without changing backend boundaries
