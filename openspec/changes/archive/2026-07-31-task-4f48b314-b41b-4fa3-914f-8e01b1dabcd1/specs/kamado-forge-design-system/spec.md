# kamado-forge-design-system Specification Delta

## MODIFIED Requirements

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
