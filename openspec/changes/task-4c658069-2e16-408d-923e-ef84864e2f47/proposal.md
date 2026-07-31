# Add the cooking-session draft planning API

## Why

The single-owner kamado coach cannot yet persist the complete ordered cooking-day plan that anchors its Plan experience. A durable draft aggregate is needed so session metadata, phase and step sequence, planned timing, temperature targets, and kamado-specific guidance round-trip together and can later serve as the source for live coaching without implementing live-session behavior now.

## What Changes

- Add a draft-only `CookingSession` aggregate with server-owned identifiers and audit timestamps, ordered phases, and ordered steps.
- Store local cooking dates and step start times, minute durations, techniques, dome ranges, optional food targets, and optional setup, deflector, heat-zone, vent, and prep guidance.
- Add contract-registry-backed create, summary-list, get, full-replacement update, and delete operations under `/api/sessions`.
- Persist the aggregate in SQLite with foreign keys, cascading deletion, explicit sibling positions, and one transaction for create, replacement, and delete.
- Enforce explicit date, time, duration, temperature, draft-status, nesting, and child-identity rules through strict request schemas and structured errors.
- Extend the async HTTP dispatch and CORS seams while preserving health behavior and runtime response validation.
- Regenerate OpenAPI and the generated frontend transport client from the route registry, and update current product, technical, and architecture documentation to mark only draft planning as implemented.

## Impact

Affected areas are the cooking-session domain contract, backend route registry and dispatcher, API CORS behavior, SQLite migration and repository, repository and route tests, generated OpenAPI and frontend client artifacts, and current-behavior documentation/LikeC4 architecture. The change remains single-user and introduces no authentication, frontend planning UI, live cooking state, LLM behavior, probe integration, or recipe catalog.
