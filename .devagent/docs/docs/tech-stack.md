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

The mounted application entry is `frontend/src/main.ts` and `frontend/src/App.vue`. `frontend/src/router.ts` sends the product routes through `frontend/src/components/ProductShell.vue`. Plan owns a local editable buffer under `frontend/src/features/plan/`; Plan, Today, and ID-addressed Live consume durable session operations through `frontend/src/api/sessions.ts`. Coach, Learn, and Logbook remain orientation-only. The internal showcase remains directly mounted at `/showcase` outside product chrome. Reusable registry primitives live under `frontend/src/components/ui`, while app-specific compositions live under `frontend/src/components/`.

## Backend

`backend/` contains the API process.

| Concern | Current setup |
| --- | --- |
| Runtime | Bun |
| HTTP server | Thin `Bun.serve` startup adapter in `backend/src/api.ts` |
| Persistence | `bun:sqlite` bootstrap with WAL, foreign-key enforcement, and numbered migrations at `DATABASE_PATH` |
| Current schema | Migration history, `app_metadata`, normalized planning tables, and live-cook drafts, snapshots, transitions, visits, and notes |
| Current endpoints | Contract-validated health, planning `/api/sessions` routes, activation, and ID-addressed `/api/live-sessions` queries and commands |
| Type checking | `tsc -p backend/tsconfig.json --noEmit` |

The backend is the current boundary for durable session data and domain transitions, and the future boundary for memory and LLM provider requests.

## Typed API and frontend state ownership

`backend/src/contract.ts` is the executable source for route metadata and Zod request/response schemas. The dispatcher in `backend/src/dispatcher.ts` validates inputs and declared outputs. `backend/src/openapi.ts` converts the same registry to `backend/openapi/openapi.json`, which Hey API then converts to the fetch SDK in `frontend/src/api/generated/`.

Generated artifacts are dependencies, not hand-editing surfaces. Change the backend registry, run `bun run generate:api`, and commit both generated trees. `bun run check:api` regenerates into temporary directories and reports drift without rewriting tracked files; `scripts/check` invokes it during normal verification.

The strict cooking-session aggregate in `backend/src/session-contract.ts` drives planning and eligible-draft routes under `/api/sessions`. `backend/src/live-cook-contract.ts` joins activation to that aggregate and defines active, ID-addressed live/terminal detail, notes, and commands under `/api/live-sessions`. Plan, Today, and Live use the generated operations exclusively through `frontend/src/api/sessions.ts`; production components do not declare parallel transport DTOs or call `fetch` directly. See [Durable Cooking-Session API](./cooking-session-api.md), [Durable Plan Page](./local-plan.md), and [Today and Live Cook](./local-live-cook.md).

Frontend state follows these ownership rules:

- **Pinia** owns shared state controlled by the browser application.
- **Pinia Colada** owns remote query and mutation state. Install it only after Pinia.
- Components and feature code consume domain composables such as `frontend/src/api/health.ts` and `frontend/src/api/sessions.ts`; they do not import generated runtime clients or call `fetch` directly.
- Session query keys and the mutation invalidation matrix live together in `frontend/src/api/sessions.ts` so cache operations do not depend on component-local arrays.
- Successful session mutations reconcile their authoritative response before asynchronously invalidating affected queries. A later refresh failure remains query state and does not turn the committed mutation into a rejection.

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
