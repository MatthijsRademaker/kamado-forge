# Context-aware coach API foundation tasks

## 1. Resolve implementation gates

- [x] 1.1 Verify that the authoritative session contracts, persistence, and read-only active-session projection for session identity/status, current step, targets, and notes are available; stop rather than creating a coach-specific or in-memory session model if they are not.
- [x] 1.2 Pin the initial production provider/transport, model-selection behavior, non-VITE provider/model/credential environment variable names, and missing/invalid configuration behavior.
- [x] 1.3 Pin the bounded public chat request, permitted roles and limits, public success envelope, and any intentionally public advisory suggestion shape without exposing vendor metadata by default.
- [x] 1.4 Pin `ContextSnapshotV1` active-session fields, target selection, recent-note scope/count/order/fields, and whether any timing or next-step fields are included.
- [x] 1.5 Pin the typed advisory-only tool schemas and outputs, with no executable session operation.
- [x] 1.6 Pin deterministic HTTP status, code, message, and issues payloads for invalid configuration, provider rejection, network/timeout failure, and malformed provider output.

## 2. Add contract and asynchronous execution support

- [x] 2.1 Add strict runtime schemas and route metadata for the non-streaming coach request, success response, and declared shared errors.
- [x] 2.2 Reject malformed or out-of-policy input before session lookup or provider invocation, with deterministic ordered validation issues.
- [x] 2.3 Make the relevant dispatch boundary explicitly asynchronous, await provider execution, runtime-validate returned bodies, and preserve existing health and CORS behavior.

## 3. Assemble authoritative read-only context

- [x] 3.1 Define immutable `ContextSnapshotV1` and a context assembler that depends only on the authoritative active-session read projection and never trusts session facts from the client.
- [x] 3.2 Map no active session to exactly `activeSession: null` without fabricated step, target, or note data.
- [x] 3.3 Map active state using the pinned identity/status, current-step, target, and bounded/ordered recent-note rules.

## 4. Implement provider orchestration

- [x] 4.1 Define the vendor-neutral `CoachProvider` request/result/failure interface, including selected model, validated chat, immutable context, system prompt, and advisory-only tool schemas.
- [x] 4.2 Place the system prompt and typed advisory tool definitions beside the coach orchestrator, with no mutation tool or executor.
- [x] 4.3 Implement `CoachService` with one read-only context lookup and one provider invocation, validate provider output, and expose no session mutation dependency.
- [x] 4.4 Implement the selected real non-streaming provider adapter and keep vendor types, IDs, upstream bodies, URLs, and credentials behind the adapter boundary.
- [x] 4.5 Resolve provider, model, and credentials from Bun server configuration and map missing/invalid configuration to the pinned safe error.
- [x] 4.6 Implement the deterministic no-network fake provider with exact request capture, stable fixture output, and rejection, network/timeout, and malformed-output modes.

## 5. Prove contracts, failures, and non-mutation

- [x] 5.1 Add an exact-value no-active-session test asserting the complete provider request, declared prompt/tools, validated chat, `activeSession: null`, and absence of fabricated cook data.
- [x] 5.2 Add an exact-value active-session test asserting the complete provider request is assembled from authoritative persisted session, current-step, target, and bounded/ordered note data.
- [x] 5.3 Add tests proving invalid chat does not read context or invoke the provider and provider output is runtime-validated before return.
- [x] 5.4 Pin exact structured responses for provider rejection, network/timeout failure, malformed output, and invalid/missing provider/model configuration; assert no raw provider or secret-bearing details escape.
- [x] 5.5 Snapshot authoritative active-session persistence before and after a response containing suggestions and prove no session, step, target, note, timing, or status state changed.
- [x] 5.6 Test that the real adapter uses the configured model and maps vendor success/failure into provider-owned types without network calls in the deterministic suite.

## 6. Generate artifacts and document configuration

- [x] 6.1 Add non-secret placeholders for the pinned server-only provider configuration to `.env.example`; do not add provider secrets to VITE-prefixed variables or public schemas.
- [x] 6.2 Regenerate the OpenAPI document and typed Vue client from the executable route registry, then run `check:api` to prove no drift.
- [x] 6.3 Update relevant project documentation for provider/model/credential configuration, backend-only secret ownership, and only the coach architecture actually delivered.
- [x] 6.4 Run focused backend/context/configuration tests and then the Docker-backed `scripts/precommit-run`; resolve all failures.
