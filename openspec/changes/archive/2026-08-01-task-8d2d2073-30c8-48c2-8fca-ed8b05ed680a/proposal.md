# Today and Live Cook Views with Local Fixtures

## Why

The current frontend is a component showcase, while the product's highest-value journey requires outdoor, glanceable guidance from Today into an active cook. A deterministic frontend-only slice can prove that journey before backend session wiring exists, provided fixture data stays coupled to the authoritative generated session contract and the internal showcase remains available.

The authoritative session-flow blueprint and generated session type are not present in this checkout. Contract identification or an explicitly approved generated-type-derived boundary is therefore a prerequisite to fixture implementation; generated files must not be edited and an independent transport DTO must not be invented.

## What Changes

- Make `/` and `/today` resolve the Today view, `/live` resolve the Live view, and preserve the internal component showcase at `/showcase`, including direct navigation and refresh under the existing serving model.
- Add documented, whitelisted local fixture identifiers for no-session, draft, active-running, and active-paused states so every required state is directly repeatable without a backend.
- Add immutable fixture seeds statically checked against the authoritative generated session type, plus one in-memory controller for draft start, running/paused elapsed behavior, bounded step navigation, session-scoped notes, and confirmed terminal transitions.
- Compose Today and Live views from existing Forge primitives. Today presents no-session, draft, and active states. Live prioritizes the complete current action and planned dome and food targets, then setup and vent guidance, elapsed/planned timing, progress, next step, notes, navigation, pause/resume, finish, and cancel.
- Require separately named confirmation dialogs for Finish cook and Cancel cook, accessible keyboard and touch operation, and measured 320-by-568 viewport behavior.
- Add deterministic frontend/browser coverage while preserving existing showcase coverage, and update architecture/docs if the implemented route or feature boundaries change their documented structure.

## Impact

The change is confined to the Vue frontend, local typed fixtures/controller, frontend tests, route resolution, and any directly affected architecture/docs source of truth. It adds no API request, persistence, backend route, database change, background execution, notification, probe integration, or chat behavior. Reloading restores the selected fixture baseline.

Implementation is blocked until the authoritative session-flow blueprint and generated session contract/type are supplied or a contract-owner-approved generated-type-derived adapter is explicitly identified.
