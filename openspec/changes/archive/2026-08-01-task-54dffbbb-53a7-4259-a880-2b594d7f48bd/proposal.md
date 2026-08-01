# Create the context-aware coach API foundation

## Why

Kamado learners need to ask coaching questions without re-entering the state of the current cook. The LLM boundary must remain server-owned so authoritative session context can be assembled safely, provider credentials never reach Vue, provider failures are normalized, and model suggestions cannot mutate live-session state.

The current checkout does not contain the authoritative active-session, step, target, and note projection required by this change. Implementation is therefore gated on that projection becoming available and on the unresolved public API, provider, context-selection, advisory-tool, and error contracts being pinned. A coach-specific parallel session model is not an acceptable substitute.

## What Changes

- Establish an implementation gate that verifies the authoritative read-only active-session projection and records the exact public/provider contracts before coach code or generated artifacts are added.
- Add a contract-registered, non-streaming coach endpoint with runtime-validated chat input, success output, and shared structured errors.
- Add a read-only `CoachService` that assembles an immutable `ContextSnapshotV1` from authoritative active-session state. No active session is represented explicitly as `activeSession: null` without fabricated cook data.
- Add a vendor-neutral provider interface, one environment-selected real provider adapter, server-only provider/model/credential configuration, and deterministic error normalization.
- Keep the system prompt and advisory-only tool schemas beside the orchestration code. Do not provide a tool executor or session mutation dependency.
- Add a deterministic fake provider that captures exact requests, returns stable fixtures, and simulates rejection, network failure, and malformed output without network calls.
- Extend the API execution boundary for awaited provider work, regenerate OpenAPI and the typed Vue client from the executable route registry, and document backend-only provider configuration.
- Add exact active-session and no-active-session context tests, provider/configuration failure tests, provider-output validation tests, and persistence non-mutation coverage.

## Capabilities

### New Capabilities

- `context-aware-coach-api`: Provides a server-owned, context-aware, advisory-only coaching API with replaceable LLM providers and deterministic contracts.

### Modified Capabilities

- None. Existing API generation and typed-contract machinery is reused; generated artifacts are updated only after the coach contract is pinned.

## Impact

- Backend route contracts, dispatch/orchestration, provider adapters, startup configuration, and tests will change.
- The coach service will depend on the existing authoritative session read projection but will not gain session write capabilities.
- `.env.example` and relevant project documentation will describe non-VITE server provider configuration using non-secret placeholders.
- `backend/openapi/openapi.json` and `frontend/src/api/generated/` will be regenerated, not hand-edited.
- No Coach UI, MCP server, streaming, long-term memory, embeddings, autonomous mutations, authentication, or hardware integration is added.
