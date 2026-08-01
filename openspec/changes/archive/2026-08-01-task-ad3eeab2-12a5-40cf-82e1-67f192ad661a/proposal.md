# Add Durable Draft Cooking-Session Planning API

## Why

The backend currently exposes only health behavior and SQLite has no product-domain session schema. A single kamado owner needs a durable, editable cooking-day plan that preserves the complete ordered plan and its manual targets before later Plan or Live capabilities are built.

## What Changes

- Extend the existing unversioned `/api` boundary with `POST` and `GET /sessions` plus `GET`, full-replacement `PUT`, and `DELETE /sessions/{sessionId}`.
- Add separate strict write and read contracts for draft-only session aggregates. The server owns session, phase, and step identifiers, the `draft` status, and aggregate audit timestamps.
- Persist sessions, ordered phases, and ordered steps in normalized SQLite tables with foreign keys, cascades, internal ordinals, and transaction-safe create, replacement, and deletion.
- Preserve session planning data for cooking date, manual Fahrenheit targets, setup and guidance, phase technique, and step instructions and integer-minute durations. Derived offsets and totals remain computed rather than persisted.
- Add repository and route coverage for complete nested CRUD round trips, order and reorder behavior, validation, rollback, resource-not-found behavior, and deletion.
- Regenerate OpenAPI and the generator-owned frontend client, update relevant domain and architecture documentation, and verify with `scripts/precommit-run`.

The executable contract uses `cookingDate`, `plannedDomeRange.minF`/`maxF`, optional-by-omission `plannedFoodTargetF`, distinct setup/deflector/heat-zone/vent guidance fields, ordered `phases`/`steps`, and integer Fahrenheit values. Dome targets are bounded from 150°F through 700°F and food targets from 32°F through 212°F, matching the repository's established planning limits.

## Impact

- Affects the executable backend contract and dispatcher, API/CORS composition, SQLite migrations and session repository, backend tests, canonical OpenAPI, generated frontend transport types, and relevant project documentation and LikeC4 descriptions.
- Establishes a durable single-user draft-session aggregate under the existing API and persistence boundaries; it does not add a second URL version or framework.
- Does not add active-cook transitions, generation or coaching, frontend UI integration, probes or telemetry, recipes, authentication, accounts, sharing, or multi-user ownership.
