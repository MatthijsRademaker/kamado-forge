# Local Plan Page

The Plan feature at `/plan` lets a learner build a complete cooking-day timeline before session APIs or persistence exist. The Vue SPA owns the entire fixture lifecycle and editor state; the backend owns only the canonical generated `SessionPlan` contract, not a Plan endpoint.

## Contract boundary

`backend/src/contract.ts` defines the standalone Zod `SessionPlan` schema. `backend/src/openapi.ts` registers it as an OpenAPI component without registering a route, and `bun run generate:api` emits the canonical frontend type in `frontend/src/api/generated/types.gen.ts`.

The feature preserves one domain shape across that boundary:

| Layer | Source | Responsibility |
| --- | --- | --- |
| Contract | `backend/src/contract.ts` | Required draft structure, IDs, date representation, step durations in minutes, and planned Fahrenheit target ranges |
| Generated artifact | `frontend/src/api/generated/types.gen.ts` | Canonical `SessionPlan`, `SessionPlanPhase`, and `SessionPlanStep` TypeScript types |
| Fixture data | `frontend/src/features/plan/fixtures.ts` | Compile-time checks every data-bearing fixture with `satisfies SessionPlan` and clones selected data |
| Local model | `frontend/src/features/plan/model.ts` | Derives timeline totals, readiness errors, and immutable nested operations without declaring competing Plan DTOs |

Generated files are generator-owned. Change the Zod source, run `bun run generate:api`, and use `bun run check:api` to detect drift. The schema registration does not expose `/api/session` or any other session route.

## Route-thin composition

`frontend/src/App.vue` selects the composition from `window.location.pathname`: `/plan` mounts `frontend/src/features/plan/PlanPage.vue`, while `/` and `/showcase` continue to mount the primitive showcase. The app deliberately has no Vue Router.

The Plan shell displays Today, Plan, Coach, Learn, and Logbook in product order. Only Plan is current and implemented; the other navigation items are inert rather than placeholder product routes. At narrow widths the navigation is a persistent bottom bar, while desktop keeps it at the top.

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

Readiness is also a pure derivation. It checks the contract/readiness rules, returns ordered field paths and messages, and identifies the first invalid control. `frontend/src/features/plan/PlanEditor.vue` relates each message to its input and focuses the first invalid field when completion is requested.

Dome and food temperatures are manual planned targets in degrees Fahrenheit. The editor deliberately avoids current-reading, probe, controller, and telemetry semantics.

## Verification

Behavior coverage lives in:

- `frontend/src/features/plan/model.test.ts` for timeline, readiness, and nested operations.
- `frontend/src/features/plan/fixtures.test.ts` for selection, cloning, and local transitions.
- `e2e/plan.spec.ts` for direct routes, fixtures, editing, focus, keyboard controls, refresh reset, target semantics, and the 320px composition.

Run `scripts/check`, `scripts/test`, `scripts/build`, and `scripts/precommit-run` before changing the Plan boundary.

## Related pages

- [Tech Stack](./tech-stack.md) — frontend, backend, generated client, and verification ownership.
- [Product Guardrails](./product-guardrails.md) — product navigation and architectural boundaries.
- [Architecture Diagrams](./architecture.mdx) — product containers and frontend component map.
