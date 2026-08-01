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
| Routing | Vue Router history mode from `frontend/src/router.ts` |
| Styling | Tailwind CSS v4 imported from `frontend/src/style.css` |
| Component system | `shadcn-vue` configured by `frontend/components.json` with `new-york` style and lucide icons |
| API access | Generated Hey API fetch client uses relative `/api`; Vite proxies it to `http://localhost:3000` in development |
| Server state | Pinia Colada, installed after Pinia in `frontend/src/main.ts` |
| Type checking | `vue-tsc -p frontend/tsconfig.json --noEmit` |

The mounted application entry is `frontend/src/main.ts` and `frontend/src/App.vue`. `frontend/src/router.ts` sends the product routes through `frontend/src/components/ProductShell.vue`. Plan mounts the local editor from `frontend/src/features/plan/`; Today and Live share the mounted controller from `frontend/src/features/session/`; Coach, Learn, and Logbook remain orientation-only. The internal showcase remains directly mounted at `/showcase` outside product chrome. Reusable registry primitives live under `frontend/src/components/ui`, while app-specific compositions live under `frontend/src/components/`.

## Backend

`backend/` contains the API process.

| Concern | Current setup |
| --- | --- |
| Runtime | Bun |
| HTTP server | Thin `Bun.serve` startup adapter in `backend/src/api.ts` |
| Persistence | `bun:sqlite` bootstrap with WAL, foreign-key enforcement, and numbered migrations at `DATABASE_PATH` |
| Current schema | Migration history, `app_metadata`, normalized planning tables, and live-cook drafts, snapshots, transitions, visits, and notes |
| Current endpoints | Contract-validated health, planning `/api/sessions` CRUD, and live-cook draft/activation/session-command routes |
| Type checking | `tsc -p backend/tsconfig.json --noEmit` |

The backend is the correct future boundary for domain APIs, memory reads/writes, and LLM provider requests.

## Typed API and frontend state ownership

`backend/src/contract.ts` is the executable source for route metadata and Zod request/response schemas. The dispatcher in `backend/src/dispatcher.ts` validates inputs and declared outputs. `backend/src/openapi.ts` converts the same registry to `backend/openapi/openapi.json`, which Hey API then converts to the fetch SDK in `frontend/src/api/generated/`.

Generated artifacts are dependencies, not hand-editing surfaces. Change the backend registry, run `bun run generate:api`, and commit both generated trees. `bun run check:api` regenerates into temporary directories and reports drift without rewriting tracked files; `scripts/check` invokes it during normal verification.

The standalone local `SessionPlan` schema in `backend/src/contract.ts` remains the fixture contract for Plan and Today/Live. The separate strict cooking-session aggregate in `backend/src/session-contract.ts` drives `/api/sessions`; `backend/src/live-cook-contract.ts` drives `/api/drafts` and `/api/live-session`. OpenAPI and generated transport models include both boundaries. The current frontend features import the local generated model but do not call either durable API or declare parallel transport DTOs. See [Cooking and Live-Cook APIs](./cooking-session-api.md), [Local Plan Page](./local-plan.md), and [Local Today and Live Cook](./local-live-cook.md).

Frontend state follows these ownership rules:

- **Pinia** owns shared state controlled by the browser application.
- **Pinia Colada** owns remote query and mutation state. Install it only after Pinia.
- Components and feature code consume domain composables such as `frontend/src/api/health.ts`; they do not import generated runtime clients or call `fetch` directly. Type-only imports of standalone generated contract models are allowed.
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
- [Cooking and Live-Cook APIs](./cooking-session-api.md) — durable draft aggregate and persistence behavior.
- [Local Plan Page](./local-plan.md) — generated contract, fixture selector, and local editor lifecycle.
- [Local Today and Live Cook](./local-live-cook.md) — mounted Today/Live fixture lifecycle and controller.
