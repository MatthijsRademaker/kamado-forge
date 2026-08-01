# Local Plan Page

The Plan feature at `/plan` lets a learner build a complete cooking-day timeline through local fixtures. The backend now exposes a durable draft cooking-session API, but this UI deliberately remains disconnected: the Vue SPA owns the fixture lifecycle and editor state and does not persist Plan edits.

## Contract boundary

`backend/src/contract.ts` defines the standalone Zod `SessionPlan` schema used by the current local UI. `backend/src/openapi.ts` registers it alongside the separate cooking-session CRUD routes, and `bun run generate:api` emits both the local model and durable API transport types in `frontend/src/api/generated/types.gen.ts`.

The feature preserves one domain shape across that boundary:

| Layer | Source | Responsibility |
| --- | --- | --- |
| Contract | `backend/src/contract.ts` | Required draft structure, IDs, date representation, step durations in minutes, and planned Fahrenheit target ranges |
| Generated artifact | `frontend/src/api/generated/types.gen.ts` | Canonical `SessionPlan`, `SessionPlanPhase`, and `SessionPlanStep` TypeScript types |
| Fixture data | `frontend/src/features/plan/fixtures.ts` | Compile-time checks every data-bearing fixture with `satisfies SessionPlan` and clones selected data |
| Local model | `frontend/src/features/plan/model.ts` | Derives timeline totals, readiness errors, and immutable nested operations without declaring competing Plan DTOs |

Generated files are generator-owned. Change the Zod source, run `bun run generate:api`, and use `bun run check:api` to detect drift. The durable `/api/sessions` aggregate has a separate strict write/read contract in `backend/src/session-contract.ts`; no handwritten frontend API integration is part of the local Plan feature.

## Route-thin composition

`frontend/src/router.ts` mounts `/plan` through `frontend/src/components/ProductShell.vue`; `frontend/src/views/PlanView.vue` renders `frontend/src/features/plan/PlanPage.vue` inside that shared product chrome. `/` redirects to Today, and `/showcase` remains outside product chrome.

The shared shell displays Today, Plan, Coach, Learn, and Logbook in product order. Plan is implemented locally; Today, Coach, Learn, and Logbook are orientation-only placeholders. At narrow widths the shell exposes navigation through its menu; desktop keeps navigation in the sidebar.

## Fixture selector

Use the local-only query parameter to review deterministic states:

| URL | Composition |
| --- | --- |
| `/plan?fixture=complete` | Ready, populated reverse-sear draft |
| `/plan?fixture=incomplete` | Populated draft with readiness errors |
| `/plan?fixture=empty` | Empty-state action backed by a typed empty draft |
| `/plan?fixture=loading` | Explicit loading composition with no draft payload |
| `/plan?fixture=error` | Explicit error composition with no draft payload |

An absent or unsupported `fixture` value selects `complete`. Selecting a data fixture deep-clones its module-owned definition before Vue receives it. Refreshing, resetting, or selecting the fixture again discards edits and creates another clone.

Create, retry, return, and reset actions are deterministic in-memory transitions. They do not call `fetch`, use the generated SDK, create a backend session, write browser storage, or claim that a plan was saved. `Complete plan` only validates the local draft and displays an in-memory completion status; it does not start Live Cook.

## Timeline and readiness

Step `durationMinutes` values are the timing authority. `frontend/src/features/plan/model.ts` sums steps in explicit array order to derive step offsets, phase offsets and totals, and the Plan total. Fixtures never persist derived timing.

Readiness is also a pure derivation. It checks the contract/readiness rules and returns ordered field paths and messages. `frontend/src/features/plan/PlanEditor.vue` relates editable-field messages to their inputs and focuses the first invalid field when completion is requested. Because structural identities are not editable, identity failures focus the visible requirements summary instead of throwing or inventing identity fields.

Dome and food temperatures are manual planned targets in degrees Fahrenheit. The editor deliberately avoids current-reading, probe, controller, and telemetry semantics.

## Verification

Behavior coverage lives in:

- `frontend/src/features/plan/model.test.ts` for timeline, readiness, and nested operations.
- `frontend/src/features/plan/fixtures.test.ts` for selection, cloning, and local transitions.
- `e2e/plan.spec.ts` for direct routes, fixtures, editing, focus, keyboard controls, refresh reset, target semantics, and the 320px composition.

Run `scripts/check`, `scripts/test`, `scripts/build`, and `scripts/precommit-run` before changing the Plan boundary.

## Related pages

- [Cooking and Live-Cook APIs](./cooking-session-api.md) — durable aggregate contract, ordering, and transaction semantics.
- [Tech Stack](./tech-stack.md) — frontend, backend, generated client, and verification ownership.
- [Product Guardrails](./product-guardrails.md) — product navigation and architectural boundaries.
- [Architecture Diagrams](./architecture.mdx) — product containers and frontend component map.
