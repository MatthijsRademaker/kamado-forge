# API Generation Specification

## ADDED Requirements

### Requirement: OpenAPI is generated from runtime schemas
The repository MUST generate and commit an OpenAPI 3.0.3 document from the backend route registry and Zod schemas through `@asteasolutions/zod-to-openapi`. The document MUST use `info.version` 1.0.0, a relative `/api` server URL, a `/health` path, and the declared 200, 400, 404, and 405 schemas. It MUST NOT become a hand-maintained contract source.

#### Scenario: Generate the health document
- **WHEN** the root API generation command runs
- **THEN** it emits the canonical OpenAPI document from the same route metadata and schemas used by the dispatcher

#### Scenario: Inspect client routing metadata
- **WHEN** a generator or reviewer reads the OpenAPI server and health path
- **THEN** they combine to relative `/api/health` without a hard-coded deployment origin

### Requirement: Fetch client generation is reproducible
The repository MUST use exact locked versions of `@hey-api/openapi-ts` and `@hey-api/client-fetch` to generate and commit a fetch-compatible TypeScript SDK under `frontend/src/api/generated/`. Generated files MUST be clearly marked, MUST contain no timestamps or environment-dependent paths, and MUST NOT be hand-edited.

#### Scenario: Regenerate from a clean checkout
- **WHEN** a maintainer runs the single root `generate:api` command after a frozen dependency install
- **THEN** the canonical OpenAPI document and TypeScript SDK are regenerated using local locked Bun dependencies without floating package execution

#### Scenario: Repeat generation
- **WHEN** generation runs twice with unchanged source and locked dependencies
- **THEN** both tracked output trees are byte-identical

### Requirement: API drift fails normal verification
The repository MUST provide a root `check:api` command that generates OpenAPI and SDK output into a temporary location and byte-compares it with only the canonical tracked artifacts. The command MUST report drift without modifying tracked or unrelated files. `scripts/check` MUST invoke it so `scripts/precommit-run` fails when backend contracts, OpenAPI, and generated frontend code are out of sync.

#### Scenario: Generated artifacts are current
- **WHEN** `check:api` runs with artifacts matching the contract registry
- **THEN** the temporary comparison succeeds without changing the working tree

#### Scenario: Generated artifacts are stale
- **WHEN** a route or schema changes without regenerating the OpenAPI document and SDK
- **THEN** `check:api`, `scripts/check`, and `scripts/precommit-run` fail with a useful generated-artifact diff
