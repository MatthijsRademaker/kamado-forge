# Wire Plan, Today, and Live Cook to durable session APIs

## Why

Plan, Today, and Live Cook currently depend on fixture-backed behavior and do not prove the core plan-to-cook loop across browser reloads. The merged planning and live-transition prerequisites must become the single executable contract so draft ordering, activation, live progress, notes, completion, and structured failures all reflect durable backend state rather than a second client-side source of truth.

## What Changes

- Gate implementation on the merged planning/live OpenAPI contract, regenerated client, and prerequisite route components; resolve any missing or ambiguous API semantic in its owning prerequisite instead of adding raw fetches, duplicate DTOs, fixture bridges, or client-authored transition rules.
- Add a generated-client session domain layer using Pinia Colada with centralized parameterized list, detail-by-ID, active-session, and eligible-draft keys plus a tested mutation invalidation/refetch matrix.
- Keep ordered Plan edits local until an explicit create or update succeeds, persist the complete nested draft including reorder operations, preserve input after failure, and reconcile from the confirmed server representation.
- Make Today active-first. When there is no active session, distinguish failure from absence and present eligible drafts for explicit selection and activation; never silently choose or activate a draft.
- Connect Live Cook controls for pause/resume, back, advance, notes, cancel, and completion to pessimistic backend mutations. Disable duplicate submissions, retain visible authoritative state and entered input on rejection, and show corrective structured errors.
- Retain the completed session identifier and render a reloadable, ID-addressable read-only detail state after completion, without depending on the now-empty active-session result or adding Logbook UI.
- Provide loading, empty, error, retry, validation, pending, and narrow-screen states while preserving the prerequisite route and interaction design.
- Remove all production fixture imports, selectors, switches, and route branches for these flows while retaining typed builders only in test-support code.
- Add session composable tests and a real-API Playwright journey against an isolated durable SQLite database covering create, reload, activate, advance, note, complete, final reload, and a recoverable backend error.
- Regenerate and drift-check API artifacts, update documentation and LikeC4 current-state claims, and verify the complete change with `scripts/precommit-run`.

## Impact

The change affects the generated API/client coupling, frontend session composables and query keys, Plan form state, Today and Live Cook routes, structured route-state UX, fixture boundaries, Playwright full-stack setup, developer documentation, and architecture models. It integrates prerequisite session semantics but does not create a new session domain or alter persistence and transition rules unless a concrete prerequisite contract defect must first be repaired by its owning work.
