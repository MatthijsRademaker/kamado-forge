# Implementation Tasks

- [x] 1. Verify that the planning, live-transition, Plan UI, Today/Live UI, and route prerequisites are merged; inventory generated operations/types, statuses, no-active semantics, note association, structured errors, and the ID-bearing active/completed route. Repair any blocking gap in its owning prerequisite contract before continuing.
- [x] 2. Regenerate OpenAPI and the frontend client from the executable backend contract, confirm deterministic drift checks, and do not hand-edit generated artifacts.
- [x] 3. Add centralized parameterized session list, detail-by-ID, active, and eligible-draft keys plus generated-client Pinia Colada query/mutation composables and an explicit mutation-to-key invalidation/refetch matrix.
- [x] 4. Add composable tests for key identity, typed success and structured errors, affected-key invalidation/refetch after every mutation, and snapshot rollback for any optimistic behavior actually introduced.
- [x] 5. Replace Plan fixture data with queries and explicit create/update mutations while keeping nested add/remove/reorder edits local, submitting the complete order, preserving failed input, mapping validation feedback, and reconciling only after confirmed save.
- [x] 6. Replace Today fixture data with active-first loading; distinguish no-active from failure, show create/open-Plan when no eligible draft exists, show explicit draft choices when drafts exist, and activate only after user selection and backend confirmation.
- [x] 7. Replace Live Cook fixture actions with ID-based detail loading and pessimistic pause/resume, back, advance, note, cancel, and complete mutations; disable pending controls, preserve note text on rejection, and show structured corrective errors.
- [x] 8. Retain the completed session ID and render a read-only detail-backed final state that survives direct reload after active lookup becomes empty.
- [x] 9. Complete Plan, Today, and Live Cook loading, empty, validation, conflict, unknown-error, retry, and pending states; verify Live current action and key targets remain usable at 320px without horizontal overflow.
- [x] 10. Remove production fixture providers, imports, selectors, environment switches, and route branches for Plan, Today, and Live Cook; retain typed builders only in test-support modules that production cannot select.
- [x] 11. Extend Playwright infrastructure to run the real frontend and API with isolated durable SQLite reset/cleanup, then cover create, reload, activate, advance, add note, complete, direct final reload, and at least one recoverable backend error.
- [x] 12. Update affected `.devagent/docs/` and LikeC4 source so generated session data flow and now-executable Plan/Today/Live paths are current rather than planned.
- [x] 13. Run API generation/drift verification and the complete Docker-backed `scripts/precommit-run` suite; resolve all failures before completion.
