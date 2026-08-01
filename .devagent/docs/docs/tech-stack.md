# Tech Stack

The repository is a Bun workspace with a Vue frontend, Bun API backend, SQLite persistence, and Rspress documentation. The current product implementation is intentionally small, so these stack boundaries are the main navigation map for agents.

## Repository layout

```text
backend/              Bun TypeScript API and SQLite persistence foundation
frontend/             Vue 3 + Vite SPA
.devagent/docs/       Rspress project documentation
.devagent/architecture/ LikeC4 architecture source of truth
scripts/              Verification guardrail entrypoints
```

## Frontend

`frontend/` contains the browser application.

| Concern | Current setup |
| --- | --- |
| Runtime/build | Vite with Vue plugin in `frontend/vite.config.ts` |
| Framework | Vue 3 single-file components |
| Styling | Tailwind CSS v4 imported from `frontend/src/style.css` |
| Component system | `shadcn-vue` configured by `frontend/components.json` with `new-york` style and lucide icons |
| API access | Generated Hey API fetch client uses relative `/api`; Vite proxies it to `http://localhost:3000` in development |
| Server state | Pinia Colada, installed after Pinia in `frontend/src/main.ts` |
| Type checking | `vue-tsc -p frontend/tsconfig.json --noEmit` |

The mounted application entry is `frontend/src/main.ts` and `frontend/src/App.vue`. Its pathname-based composition exposes the primitive showcase at `/` and `/showcase` and the local fixture-driven editor at `/plan`; the app does not use Vue Router. Reusable registry primitives live under `frontend/src/components/ui`, Kamado-specific state/readout compositions live under `frontend/src/components/`, and the Plan feature lives under `frontend/src/features/plan/`.

## Backend

`backend/` contains the API process.

| Concern | Current setup |
| --- | --- |
| Runtime | Bun |
| HTTP server | Thin `Bun.serve` startup adapter in `backend/src/api.ts` |
| Persistence | `bun:sqlite` bootstrap with WAL, foreign-key enforcement, and numbered migrations at `DATABASE_PATH` |
| Current schema | Runner-owned migration history alongside `app_metadata` |
| Current endpoint | Contract-validated `GET /api/health` with status-only database health |
| Type checking | `tsc -p backend/tsconfig.json --noEmit` |

The backend is the correct future boundary for domain APIs, memory reads/writes, and LLM provider requests.

## Typed API and frontend state ownership

`backend/src/contract.ts` is the executable source for route metadata and Zod request/response schemas. The dispatcher in `backend/src/dispatcher.ts` validates inputs and declared outputs. `backend/src/openapi.ts` converts the same registry to `backend/openapi/openapi.json`, which Hey API then converts to the fetch SDK in `frontend/src/api/generated/`.

Generated artifacts are dependencies, not hand-editing surfaces. Change the backend registry, run `bun run generate:api`, and commit both generated trees. `bun run check:api` regenerates into temporary directories and reports drift without rewriting tracked files; `scripts/check` invokes it during normal verification.

The standalone `SessionPlan` schema in `backend/src/contract.ts` is registered as an OpenAPI component without a session route. The local Plan fixtures import its generated type from `frontend/src/api/generated/types.gen.ts`; the Plan feature does not call the API or declare parallel session, phase, or step DTOs. See [Local Plan Page](./local-plan.md) for the fixture and lifecycle rules.

Frontend state follows these ownership rules:

- **Pinia** owns shared state controlled by the browser application.
- **Pinia Colada** owns remote query and mutation state. Install it only after Pinia.
- Components and feature code consume domain composables such as `frontend/src/api/health.ts`; they do not import `frontend/src/api/generated/` or call `fetch` directly.
- Domain query keys live in `frontend/src/api/queryKeys.ts` and remain stable so cache operations do not depend on component-local arrays.
- Future successful mutation composables invalidate their related centralized keys through Pinia Colada's query cache. Do not move server responses into Pinia or add mutation endpoints solely to demonstrate invalidation.

## Documentation and architecture

`./.devagent/docs/` is an Rspress docs app. Its `build` script first runs LikeC4 webcomponent code generation from `../architecture`, then builds the docs site.

`./.devagent/architecture/` contains LikeC4 source files:

| File | Purpose |
| --- | --- |
| `likec4.config.json` | LikeC4 project identity. |
| `spec.c4` | Element, relationship, deployment node, and tag vocabulary. |
| `model.c4` | Product model: learner, SPA, API, SQLite, planned LLM boundary, and future components. |
| `deployment.c4` | Current local development topology. |
| `views.c4` | Rendered views embedded into the architecture docs. |

## Verification commands

Root `package.json` exposes the standard checks:

```text
bun run format:check
bun run lint
bun run typecheck
bun run deadcode
bun run test
bun run build
```

Project guardrail entrypoints also exist in `scripts/`, including `scripts/check`, `scripts/test`, `scripts/build`, and `scripts/precommit-run`.

Before claiming implementation work is complete, run `scripts/precommit-run` unless the task explicitly asks for a narrower verification.

## Related pages

- [Product Guardrails](./product-guardrails.md) — product boundaries and navigation model.
- [Architecture Diagrams](./architecture.mdx) — visual source of truth generated from LikeC4.
- [Local Plan Page](./local-plan.md) — generated contract, fixture selector, and local editor lifecycle.
