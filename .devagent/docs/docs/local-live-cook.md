# Local Today and Live Cook

Today and Live provide a deterministic outdoor cook walkthrough backed by mounted local fixtures. The backend now persists draft cooking sessions, but these views do not call that API: the Vue SPA owns their fixture lifecycle and the generated `SessionPlan` model statically checks fixture data.

## Route and fixture boundary

`frontend/src/router.ts` mounts Today and Live through `frontend/src/components/ProductShell.vue`. The shell creates one `frontend/src/features/session/controller.ts` instance, so navigation from Today to Live preserves the mounted cook while refresh recreates the selected fixture baseline.

Use the local-only selector to inspect each state:

| URL | State |
| --- | --- |
| `/today?fixture=no-session` | Empty Today entry with a Plan action |
| `/today?fixture=draft` | Planned session ready to start |
| `/today?fixture=active-running` | Running session ready to continue |
| `/today?fixture=active-paused` | Paused session ready to resume |
| `/live?fixture=active-running` | Running Live guidance baseline |
| `/live?fixture=active-paused` | Paused Live guidance baseline |

Unsupported selectors resolve to no session. Fixtures do not fetch, import a generated runtime client, use browser storage, or persist edits.

## Contract and controller ownership

`frontend/src/features/session/fixtures.ts` checks its durable plan seed with the generated `SessionPlan` type from `frontend/src/api/generated/types.gen.ts` and clones it for each mounted flow. That local model comes from the standalone schema in `backend/src/contract.ts`; it is separate from the generated `/api/sessions` transport models, and generated files remain read-only.

The local controller separately owns fields that are not transport data:

- selected fixture and lifecycle kind;
- running or paused state and mounted elapsed accounting;
- current ordered step;
- session note text;
- terminal transitions.

Elapsed time advances only while running and its interval is cleared with ProductShell. Back and Advance enforce first and final boundaries. Confirmed Finish and Cancel both reset the controller and return to Today's no-session state; dialog dismissal changes nothing.

## Guidance semantics

Live presents the complete current instruction and both planned Fahrenheit targets before supporting setup, vent guidance, timing, progress, next-step, note, and terminal controls. Targets are planning values, not measured readings, connected probes, or controller telemetry.

The 320-by-568 acceptance boundary includes the mobile ProductShell header. Browser tests measure the action and both planned targets against the real viewport, verify no page-level horizontal overflow, and require 44-by-44-pixel primary and confirmation controls.

## Verification

Behavior coverage lives in:

- `frontend/src/features/session/controller.test.ts` for fixture initialization, mounted timing, bounded navigation, note retention, and terminal reset;
- `e2e/session-flow.spec.ts` for direct fixtures, Today-to-Live transitions, timer behavior, dialogs, focus restoration, narrow-viewport geometry, and no API requests;
- existing shell, Plan, and showcase suites for route regressions.

Run `scripts/check`, `scripts/test`, `scripts/build`, and `scripts/precommit-run` before changing this boundary.

## Related pages

- [Cooking and Live-Cook APIs](./cooking-session-api.md) — durable draft aggregate and persistence semantics.
- [Local Plan Page](./local-plan.md) — canonical `SessionPlan` contract and local Plan lifecycle.
- [Architecture Diagrams](./architecture.mdx) — frontend route and local-controller boundaries.
- [Tech Stack](./tech-stack.md) — Vue, generated API, and verification ownership.
