# Design: Durable Plan-to-Live session integration

## Context

Four prerequisite deliverables own the planning API, live-transition API, Plan interaction model, and Today/Live Cook interaction model. This change joins them. The backend remains authoritative for status, active-session uniqueness, current and next steps, timestamps, notes, and allowed transitions. Pinia Colada owns remote state; the Plan editor alone owns transient nested form input. Production fixtures must no longer be a runtime data source.

Implementation starts by inventorying the merged generated operations and route semantics. The inventory must establish draft list/detail/create/update behavior, complete ordered replacement, active lookup and its empty response, activation, transitions, note association, cancellation, completion, session status values, structured validation/conflict errors, and the ID-bearing detail route. If that contract cannot satisfy the acceptance flow, the gap is repaired in the owning prerequisite contract and the client is regenerated before frontend wiring continues.

## Goals

- Persist a complete ordered draft and reload the same server-assigned session.
- Resolve Today from authoritative active and eligible-draft data without ambiguous automatic selection.
- Run and finish a cook through backend-confirmed actions, persistent notes, and reloadable terminal detail.
- Keep generated operations, Pinia Colada cache state, routes, and durable persistence aligned.
- Preserve actionable recovery and user input through loading, empty, validation, conflict, and transport failures.
- Prove the complete journey across browser reloads against a real API and isolated database.

## Non-Goals

- Coach/chat or LLM behavior.
- Logbook history browsing, post-cook lesson editing, or a completed-cook history UI.
- Learning content, recipe catalogs or generation, and generic cooking expansion.
- Hardware integrations, push notifications, or server-running timers.
- Multi-user, collaboration, cross-device synchronization policy, or offline-first editing.
- Reworking the application shell, visual system, or prerequisite interaction design beyond states required for durable integration.
- Recreating session schemas, transitions, or API semantics already owned by prerequisite work.

## Decisions

### Contract-gated generated boundary

The merged backend route registry and generated client are the contract source. Session feature code consumes generated operations and types through one session-domain composable layer. It does not call raw `fetch`, duplicate transport DTOs, import generated modules directly into route components, or mirror remote session state in Pinia. Contract changes are regenerated and checked for drift rather than applied to generated files by hand.

### Central cache topology

Centralized stable keys cover session lists, detail by ID, active session, and eligible drafts. Session mutation composables own a mutation-to-key matrix. Draft save, activation, each transition, note creation, cancellation, and completion reconcile an authoritative response where complete and invalidate/refetch every affected list, detail, active, or eligible-draft key. Failures that may reflect a stale or concurrently changed server state also refetch the affected authoritative queries.

### Local Plan editing buffer

The Plan editor copies a loaded draft into explicit local nested form state. Add, remove, and reorder operations modify only that buffer. Create or update submits the complete ordered representation. The form is rehydrated only after confirmed save or an explicit reload action; a rejected save retains values and order, maps field issues where the contract provides paths, and never claims success.

### Active-first Today behavior

Today queries the authoritative active session first. An active result offers continuation. A true no-active result may load eligible drafts: zero drafts gives a create/open-Plan action, while one or more drafts are shown for explicit selection and activation. Today never auto-activates or silently selects a draft, and an API or transport failure renders an error with retry rather than an empty state.

### Pessimistic authoritative actions

Activation, pause/resume, back, advance, note creation, cancellation, and completion remain pessimistic because the backend validates transitions and owns IDs, timestamps, progress, and the one-active-session invariant. Controls are disabled while the corresponding mutation is pending. Rejection leaves the prior visible server state in place and preserves unsent form or note text. An optimistic update is permitted only when the exact prior cache snapshot is restorable and rollback plus authoritative refetch are covered by tests.

### ID-addressable terminal state

Live Cook is backed by session detail using the prerequisite ID-bearing route. After completion, the application retains that ID and renders the completed detail read-only. A direct reload therefore does not rely on active lookup, which should now be empty, and does not require Logbook history UI.

### Route and error states

Plan, Today, and Live Cook distinguish loading, true absence, structured validation/conflict rejection, and unknown transport failure. Known error codes map to contextual correction or retry actions while unknown failures receive a safe fallback. Live Cook continues to expose current and next guidance, targets, setup or vent guidance, timing, progress, and status; current action and key targets remain usable at 320px without horizontal overflow.

### Test boundary and fixture isolation

Composable tests use controlled transport to prove typed success/errors, stable parameterized keys, mutation invalidation/refetch, and rollback for any optimism actually used. Playwright starts or targets the real frontend and API against a per-run isolated durable SQLite database with deterministic reset and cleanup. The journey crosses reloads after save and completion and includes a recoverable backend rejection. Timestamp checks assert persisted presence and ordering rather than exact wall-clock values unless the harness supplies deterministic clock control. Fixture builders remain only under test-support paths and no production runtime path can select them.

## Conflict Resolution

The refinement evidence left the no-active draft rule and exact terminal URL open. The accepted lead-developer decision resolves the first by requiring active-first Today behavior with explicit draft choice and activation; this design makes that explicit for both one and multiple drafts and forbids automatic activation. The accepted reviewer and architect decisions resolve terminal behavior by requiring an ID-addressable detail-backed completed state; the exact URL is inherited from the prerequisite route contract rather than invented here. Exact operation names, note association, no-active status, and structured error literals likewise come from the merged executable contract. Cancel remains wired and tested at the composable/route boundary, while the required browser proof follows the task's completion journey.

## Risks

- Partial invalidation could leave Today and Live Cook inconsistent. Mitigation: centralize keys, define a per-mutation matrix, and assert affected invalidations.
- Query reconciliation could overwrite unsaved nested edits. Mitigation: isolate the local Plan buffer and rehydrate only after success or explicit reload.
- Speculative transitions could show false success. Mitigation: use pessimistic actions by default and require exact tested rollback for any optimism.
- No-active, empty-list, and transport errors could collapse into misleading empty UI. Mitigation: derive distinct states from generated contract semantics and test each path.
- Fixture imports or runtime switches could preserve a false production path. Mitigation: move builders to test support and verify production source/build boundaries.
- The browser suite could pass without persistence or leak state between runs. Mitigation: use the real API, isolated SQLite lifecycle, reload assertions, and deterministic cleanup.

## Traceability

- `task:ec28d9c4-811a-426e-b51d-722bcae1ccae`
- `decision:1-swarm-reviewer-recommendation`
- `decision:1-swarm-lead-dev-recommendation`
- `decision:1-swarm-architect-recommendation`
- `round:1:agent:swarm-reviewer`
- `round:1:agent:swarm-lead-dev`
- `round:1:agent:swarm-architect`