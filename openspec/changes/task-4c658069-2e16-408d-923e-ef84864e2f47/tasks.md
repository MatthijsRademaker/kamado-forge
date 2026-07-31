# Implementation tasks

## 1. Executable aggregate contract

- [ ] 1.1 Add strict create, replacement, full-session, summary-list, path, and shared response schemas for the draft-only aggregate, including exact local date/time, duration, temperature, nesting, optional-field, and identity rules.
- [ ] 1.2 Register POST/list GET/resource GET/PUT/DELETE under `/api/sessions` with the specified envelopes and HTTP statuses while keeping the registry side-effect free and authoritative.
- [ ] 1.3 Add focused schema tests for impossible dates, malformed times, non-integer/out-of-range durations, non-finite/out-of-range/reversed targets, non-draft status, invalid nesting, unknown fields, optional targets, and deterministic nested issue paths.

## 2. SQLite schema and repository

- [ ] 2.1 Add migration `0002` for session, phase, and step tables with draft and invariant checks, foreign keys, cascades, and unique sibling positions.
- [ ] 2.2 Add a dedicated cooking-session repository that maps explicit position-ordered rows to the nested aggregate and validates relevant domain invariants at its boundary.
- [ ] 2.3 Implement transactional create with server UUIDs and UTC audit values.
- [ ] 2.4 Implement transactional full PUT replacement that preserves valid supplied child IDs, creates IDs for new children, removes omitted children, derives order from arrays, rejects duplicate/unknown/foreign/mis-parented IDs, and advances only `updatedAt`.
- [ ] 2.5 Implement transactional deletion through enforced foreign-key cascades and deterministic summary listing.
- [ ] 2.6 Add repository tests for migration constraints/cascades, nested round trips and ordering, replace/reorder/add/remove behavior, identity validation, delete, audit behavior, and controlled nested-write failures proving complete rollback for create and replacement.

## 3. HTTP dispatch and routes

- [ ] 3.1 Make the dispatcher and startup fetch boundary promise-aware and add strict JSON body and path validation without regressing health dispatch.
- [ ] 3.2 Wire all session routes to the repository, runtime-validate declared success and error outputs, and preserve deterministic shared 400/404/405 envelopes.
- [ ] 3.3 Extend CORS preflight to advertise GET, POST, PUT, DELETE, and OPTIONS while preserving configured origin/header behavior.
- [ ] 3.4 Add route tests for nested create/get round trips, summary list shape/order, complete update/reordering, delete and subsequent absence, malformed JSON, every validation class, invalid and unknown IDs including unknown DELETE, rejected-request non-mutation, audit behavior, health, and CORS.

## 4. Generated contracts and documentation

- [ ] 4.1 Regenerate and commit `backend/openapi/openapi.json` from the runtime registry and `frontend/src/api/generated/` from OpenAPI; verify all five operations and strict nested/summary types are present.
- [ ] 4.2 Update Product Guardrails, Tech Stack, current Session API wording, and `.devagent/architecture/model.c4` where they currently call the draft API/storage planned, without claiming any excluded live, UI, LLM, probe, catalog, or multi-user behavior.

## 5. Verification

- [ ] 5.1 Run the generated API drift check and repair any route/OpenAPI/client mismatch.
- [ ] 5.2 Run `scripts/precommit-run` and resolve all in-scope failures.
