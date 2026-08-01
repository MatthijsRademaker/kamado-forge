# Today and Live Cook

Today and Live execute the persisted cooking-session contract. Today resolves active state before eligible drafts; Live reads and mutates one ID-addressed durable projection that remains reloadable after completion or cancellation.

## Today: active first

`frontend/src/views/TodayView.vue` first queries `/api/live-sessions/active`.

1. An `ACTIVE` or `PAUSED` result offers continuation to `/live/{sessionId}`.
2. Explicit `204` absence enables the eligible-draft query.
3. Zero eligible drafts offers Plan.
4. One or more drafts are displayed as explicit choices; no draft is silently selected or activated.
5. Activation navigates only after backend confirmation.

Active-query failure is never rendered as empty state. Eligible-query failure is distinct and retryable.

## Live: durable ID-addressed execution

`frontend/src/views/LiveView.vue` loads `/api/live-sessions/{sessionId}` directly. This route supports browser reload for active, paused, completed, and cancelled sessions. Current action, current and next step, planned targets, setup/deflector/heat-zone/vent guidance, timing, progress, status, and notes come from the backend projection. A cleaned-up reactive clock advances active elapsed time from the server's projection timestamp; the backend baseline excludes persisted pause intervals.

Pause, resume, return, advance, note, cancel, and complete are pessimistic generated-client mutations. Pending controls reject duplicate submission. A rejection retains prior visible state, preserves entered note text, shows corrective guidance, and refetches authoritative keys when state may have changed. Failed background refreshes render inline without replacing cached guidance or note input.

Notes are persisted against the current execution visit. Successful note creation clears the local input only after backend confirmation; persisted notes survive reload.

## Terminal detail

Completion and cancellation retain the session ID and current URL. The terminal projection is read-only and renders final progress, pause-aware step timing, execution history, and notes without depending on active lookup. Completion reports the final step; cancellation reports the step where the cook stopped. Active lookup correctly returns `204` after terminal transition.

The Live layout keeps current action and planned dome/food targets readable at 320px without page-level horizontal overflow.

Production no longer contains mounted session controllers, runtime fixture selectors, or `?fixture=` route branches.

## Verification

- `frontend/src/api/sessions.test.ts` covers success, structured rejection, and authoritative cache reconciliation.
- `backend/src/durable-session-workflow.test.ts` covers ID-addressed notes, transitions, completion, and terminal reload semantics.
- `e2e/session-flow.spec.ts` covers explicit activation, durable reloads, refresh-failure input retention, reactive timing, notes, advance, completed and cancelled terminal progress, direct final reload, and 320px rendering.

## Related pages

- [Durable Cooking-Session API](./cooking-session-api.md) — route and persistence contract.
- [Durable Plan Page](./local-plan.md) — complete ordered draft creation.
- [Compose Development](./compose-development.md) — isolated real-API Playwright topology.
- [Architecture Diagrams](./architecture.mdx) — current route and data-flow model.
