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
| Framework | Vue 3 with `<script setup>` single-file components |
| Styling | Tailwind CSS v4 imported from `frontend/src/style.css` |
| Component system | `shadcn-vue` configured by `frontend/components.json` with `new-york` style and lucide icons |
| API access | Vite dev proxy forwards `/api` to `http://localhost:3000` |
| Type checking | `vue-tsc -p frontend/tsconfig.json --noEmit` |

The mounted application entry is `frontend/src/main.ts` and `frontend/src/App.vue`, which currently exposes the route-thin primitive showcase at `/` and `/showcase`. Reusable registry primitives live under `frontend/src/components/ui`; Kamado-specific state/readout compositions and the showcase composition live under `frontend/src/components/`.

## Backend

`backend/` contains the API process.

| Concern | Current setup |
| --- | --- |
| Runtime | Bun |
| HTTP server | `Bun.serve` in `backend/src/index.ts` |
| Persistence | `bun:sqlite` bootstrap with WAL, foreign-key enforcement, and numbered migrations at `DATABASE_PATH` |
| Current schema | Runner-owned migration history alongside `app_metadata` |
| Current endpoint | `GET /api/health` |
| Type checking | `tsc -p backend/tsconfig.json --noEmit` |

The backend is the correct future boundary for domain APIs, memory reads/writes, and LLM provider requests.

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
