# Establish a generated typed API contract and frontend health query path

## Why

The Bun API and Vue SPA currently share only an inline, unvalidated `/api/health` response. Establishing one executable contract path now prevents runtime behavior, OpenAPI, generated transport types, and frontend server-state conventions from drifting when product endpoints are later added.

## What Changes

- Keep `Bun.serve`, the existing `/api/health` URL, CORS behavior, SQLite initialization, and the relative `/api` frontend topology.
- Extract a side-effect-free API dispatcher and route registry from backend startup.
- Define the strict health request, v1 success envelope, and shared error envelope once with Zod 3.x, and emit OpenAPI 3.0.3 from those schemas with `@asteasolutions/zod-to-openapi`.
- Return health as `{ "data": { "ok": true, "service": "api", "database": { "status": "ok" } } }`; do not expose the SQLite filesystem path.
- Normalize malformed query input, unknown routes, and unsupported methods into deterministic structured 400, 404, and 405 errors.
- Commit a generated OpenAPI document and a generated fetch TypeScript SDK produced by pinned `@hey-api/openapi-ts` and `@hey-api/client-fetch` dependencies.
- Add one root generation command and a temporary-output drift check in `scripts/check`, making stale generated artifacts fail `scripts/precommit-run`.
- Register Pinia before Pinia Colada, configure the generated client with relative base `/api`, and expose health through a domain query composable with a centralized key and typed errors.
- Record server-state, client-state, generated-code, query-key, and mutation-invalidation conventions without adding a mutation endpoint or UI.
- Add exact backend contract, generation, generated-client, and frontend query tests; update affected developer documentation and LikeC4 architecture.

## Impact

Affected areas are the backend HTTP boundary, root dependency and generation scripts, committed API artifacts, frontend bootstrap and data access, verification, developer documentation, and architecture source. Backend schema and route changes must be accompanied by regenerated OpenAPI and frontend client artifacts. No product endpoint, page, runtime replacement, database migration, or SQLite setup change is included.
