# Durable Plan Page

Plan at `/plan` edits a complete cooking-day aggregate in local form state and persists only on explicit save. Saved selection is retained as `/plan?sessionId={sessionId}`, so multiple drafts reload by explicit server identity. The server remains authoritative for confirmed content; failed saves never replace or discard the editable buffer.

## Data flow

```text
GET /api/sessions
        │
        ▼
Pinia Colada session list
        │ confirmed aggregate
        ▼
local Plan buffer ── add/remove/reorder/edit
        │ complete explicit POST or PUT
        ▼
server-confirmed aggregate ── rehydrate buffer
```

`frontend/src/features/plan/PlanPage.vue` owns route states and save orchestration. `frontend/src/features/plan/PlanEditor.vue` owns nested interactions and readiness. `frontend/src/features/plan/draft.ts` converts between the durable aggregate and local keys without sending client identities in write payloads.

The central separation is deliberate: Pinia Colada owns remote query state, while the Plan buffer owns unsaved user input. Query invalidation cannot silently overwrite edits. Only a successful create/update or an explicit ID-addressed selection rehydrates the form. A refresh failure stays inline beside the retained editor and has its own retry action.

## Complete ordered saves

Plan submits every editable field, ordered phase, and ordered step in one request. Durations remain the timing authority; offsets and totals are derived from array order. Dome range, food target, setup, deflector, heat-zone, vent, prep, phase technique/transition, and step guidance all cross the same aggregate boundary.

A rejected save keeps all values and ordering. Structured validation issues appear with their backend paths and corrective summary; unknown transport failures provide retry guidance without claiming persistence.

## Route states

- **Loading:** waits for authoritative session list data.
- **Empty:** offers creation when no draft exists.
- **Editing:** distinguishes new unsaved input from an ID-addressed saved server draft.
- **Saving:** disables duplicate submission.
- **Validation/conflict/transport/refresh failure:** preserves the buffer and explains correction or retry.
- **Confirmed:** rehydrates from the server response and reports the durable save time.

Production no longer supports `?fixture=` selectors. Typed local examples remain only under `frontend/src/test-support/` and cannot be selected by runtime code.

## Verification

- `frontend/src/features/plan/draft.test.ts` covers complete field and order conversion.
- `frontend/src/features/plan/model.test.ts` covers timeline, readiness, and local nested operations.
- `e2e/session-flow.spec.ts` creates, saves, retains selection against a newer competing draft, reloads, and later activates the same server-assigned plan.

## Related pages

- [Durable Cooking-Session API](./cooking-session-api.md) — aggregate and generated contract.
- [Today and Live Cook](./local-live-cook.md) — explicit activation and live execution.
- [Architecture Diagrams](./architecture.mdx) — frontend session-domain flow.
