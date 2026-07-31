# Design: Typed API contract and frontend data access

## Context

`backend/src/index.ts` currently combines Bun startup, SQLite setup, CORS, URL parsing, and an inline health response. The frontend mounts Vue without Pinia or Pinia Colada and has no data-access layer, while Vite already proxies relative `/api` requests. There is no schema source, OpenAPI artifact, generated client, or drift check.

## Goals

- Make one backend route registry the executable source for runtime validation, OpenAPI, and generated TypeScript transport code.
- Prove exact success and deterministic error behavior using health only.
- Establish a domain-composable boundary and cache conventions for the Vue application.
- Make regeneration repeatable and stale artifacts fail normal repository verification.

## Non-Goals

- Product endpoints, authentication, LLM features, dummy mutations, or UI pages.
- Replacing Bun, `Bun.serve`, SQLite, database initialization, CORS, or the relative `/api` topology.
- Hand-maintained OpenAPI, duplicate frontend DTOs, or hand edits to generated SDK files.
- Generalizing all future API behavior from the health example.

## Decisions

### Runtime and contract source

Keep `Bun.serve` as a thin startup adapter and keep SQLite initialization in `backend/src/index.ts`. Extract a pure dispatcher that receives the health dependency it needs. A side-effect-free route registry owns method/path metadata and Zod 3.x schemas for the strict empty health query, health data, the v1 success envelope, and the shared error envelope. The dispatcher validates request input and every declared response before returning it.

Use `@asteasolutions/zod-to-openapi` to generate OpenAPI 3.0.3 from the same registered Zod schemas. This adds no routing framework and creates no second contract source.

### Public health contract

Keep `GET /api/health`. The OpenAPI document uses `info.version: 1.0.0`, a relative server URL `/api`, and path `/health`; versioning is expressed by the document and named v1 schemas rather than by changing the URL or adding a body version field.

A successful request returns HTTP 200, JSON content type, and:

```json
{"data":{"ok":true,"service":"api","database":{"status":"ok"}}}
```

The status-only database object preserves health semantics without publishing the absolute SQLite path.

Health declares no query parameters. Any supplied query key is malformed and returns HTTP 400 in the shared shape `{ "error": { "code", "message", "issues" } }`. Each issue has `path`, `code`, and `message`; issues are mapped to project-owned wording and sorted lexicographically by path, then code, then message so Zod wording or traversal order cannot leak into the wire contract. Unknown routes return 404 in the same envelope and non-GET methods on the health route return 405. Exact code and message literals are centralized alongside the schemas and asserted by tests. CORS headers and OPTIONS preflight remain functional.

### Generated artifacts and drift

Generate a committed OpenAPI JSON artifact under the backend contract area and a clearly marked generated SDK under `frontend/src/api/generated/`. The root `generate:api` command runs the local locked Bun dependencies—never floating `bunx`—to write both outputs, without timestamps or environment-dependent paths. A root `check:api` command generates both into a temporary directory and byte-compares only the canonical OpenAPI and SDK output trees, reporting a useful diff without rewriting tracked files or unrelated work. `scripts/check` invokes this after frozen install, so `scripts/precommit-run` enforces coupling.

The dependency manifests must use exact versions and `bun.lock` must record Zod 3.x, `@asteasolutions/zod-to-openapi`, `@hey-api/openapi-ts`, `@hey-api/client-fetch`, Pinia, and Pinia Colada. Generation twice from a clean checkout must be byte-identical.

### Frontend data access

Vue installs Pinia before Pinia Colada. Configure the generated fetch client with relative base `/api`, allowing the existing Vite proxy and same-origin deployment to determine the host. Hand-authored frontend code does not redefine Health or call raw `fetch`; a health domain composable invokes the generated health operation, uses a centralized stable health query key, and exposes generated success and structured error types.

Pinia owns shared client-controlled state. Pinia Colada owns remote query and mutation state. Components and features consume domain composables rather than generated transport modules. Query keys are centralized and stable. Future successful mutations invalidate the related centralized keys from their domain composables. Because health is read-only, this change documents and tests reusable key/invalidation helpers but does not invent a mutation or endpoint.

### Verification and documentation

Pure dispatcher tests assert exact status, content type, body, deterministic malformed-query issues, 404, 405, OPTIONS/CORS, and output-schema enforcement. Generation tests/checks cover OpenAPI content, generated operation routing, and byte stability. A frontend test runs the health composable with Pinia and Pinia Colada and a controlled fetch response, proving relative routing and typed success/error behavior without changing `App.vue`. Update `.devagent/docs/` and the existing LikeC4 source to reflect contract ownership and the generated-client/domain-composable boundary.

## Conflict Resolution

The reviewer and architect withheld approval until the stack and public contract were fixed. The accepted lead-developer recommendation resolves the stack conflict in favor of a framework-free Zod 3.x, zod-to-openapi, and Hey API fetch-client path while preserving Bun and SQLite. Its safer status-only database representation and OpenAPI `1.0.0` versioning recommendation resolve the database-path and envelope-version questions. Numeric dependency versions and exact public error literals were not supplied by the accepted evidence; they remain explicit implementation constraints rather than invented values in this draft.

## Risks

- Package APIs and Bun compatibility are version-sensitive. Mitigate by exact manifest pins, locked installation, generation, compilation, and request execution in the Docker-backed lanes.
- OpenAPI cannot fully describe rejection of undeclared query keys. Keep the query schema strict and prove behavior with exact dispatcher tests.
- Generator timestamps or ordering can create noisy drift. Disable unstable metadata, use fixed configuration, and compare temporary output byte-for-byte.
- Generated transport calls could bypass cache conventions. Restrict hand-authored callers to domain composables and verify this boundary with tests and dead-code/lint configuration.
- Handler extraction could alter startup, CORS, or SQLite behavior. Leave those responsibilities in the startup adapter and assert preflight and health behavior.

## Traceability

- `task:15626e43-920e-4638-ad58-bae00b5f7fa7`
- `decision:1-swarm-reviewer-recommendation`
- `decision:1-swarm-architect-recommendation`
- `decision:1-swarm-lead-dev-recommendation`
- `round:1:agent:swarm-reviewer`
- `round:1:agent:swarm-architect`
- `round:1:agent:swarm-lead-dev`