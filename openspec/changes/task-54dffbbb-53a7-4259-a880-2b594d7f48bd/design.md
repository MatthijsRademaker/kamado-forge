# Context-aware coach API foundation design

## Context

The backend currently exposes a strict health-only route registry, a shared `{ "error": { "code", "message", "issues" } }` envelope, generated OpenAPI/client artifacts, and a synchronous dispatcher. A network-backed coaching request introduces asynchronous execution, provider configuration, vendor failures, and runtime output validation.

The intended coaching flow also requires authoritative state for the active session, current step, targets, and recent notes. That source is absent from this checkout even though published session documentation describes it. The implementation must not compensate by creating an in-memory or coach-specific session model. Exact public chat/response schemas, provider choice and environment names, context selection rules, advisory tool outputs, and public error mappings are also not yet decided.

## Goals / Non-Goals

**Goals:**

- Provide one non-streaming, contract-validated server coaching boundary.
- Assemble deterministic context server-side from the authoritative active-session read projection.
- Represent no active session explicitly and never fabricate session facts.
- Isolate vendor behavior behind a replaceable provider interface selected from Bun server configuration.
- Keep provider secrets out of API schemas, OpenAPI, generated Vue code, and VITE-prefixed configuration.
- Make prompts and advisory-only tool schemas explicit near provider execution.
- Validate provider output and return deterministic, safe structured errors.
- Prove exact provider requests and unchanged session persistence with deterministic tests.

**Non-Goals:**

- Implementing a duplicate session domain or temporary in-memory session source.
- Frontend Coach UI or frontend state integration beyond generated client regeneration.
- MCP transport, streaming, durable chat history, long-term memory, summaries, embeddings, or retrieval.
- Tool execution or autonomous changes to steps, targets, notes, timing, or session status.
- Authentication, multi-user behavior, community features, or hardware integration.

## Decisions

### Gate implementation on prerequisites and pinned contracts

Before route implementation, verify that the authoritative session contracts, persistence, and active-session read projection are available. Record the exact initial provider/transport and non-VITE environment variables; bounded chat and success schemas; target and recent-note projection rules; advisory tool/result schemas; and status/code/message/issues mappings for configuration, rejection, network/timeout, and malformed-output failures. Do not regenerate public artifacts against guessed contracts.

### Use one read-only orchestration flow

The API validates the client request before any context lookup or provider call. `CoachService` then reads through a read-only active-session projection, constructs immutable `ContextSnapshotV1`, and invokes the provider once with the selected model, validated chat, server-owned system prompt, and advisory-only tool schemas. It validates the provider result before mapping it to the public response.

The service receives no session mutation repository, command service, or tool executor. Session identity, step, target, and note facts are never accepted as trusted client input.

### Make absent and active context deterministic

`ContextSnapshotV1` represents no active session as `activeSession: null`, with no fabricated current step, targets, or notes. For an active session, the snapshot contains only the pinned authoritative session identity/status, current-step representation, target selection, and bounded recent-note fields and ordering. Exact-value tests capture the complete provider request for both states.

### Isolate real and fake providers behind one interface

A vendor-neutral `CoachProvider` owns provider request/result and typed failure shapes so vendor SDK or HTTP response structures cannot cross the public API. Bun startup/configuration selects the provider and model and supplies credentials from server-only environment variables. The initial real adapter performs one non-streaming invocation. The fake implements the same interface, performs no network I/O, captures exact requests, returns stable fixtures, and deterministically simulates required failures.

### Keep prompt and tools advisory-only

System instructions and typed advisory tool schemas live beside the orchestrator that passes them to the provider. The declared tool set contains no operation for advancing steps, changing targets, writing notes, changing status/timing, or otherwise mutating a session. Suggestions are validated response data for user consideration only.

### Normalize all failures at the backend boundary

The asynchronous dispatch path awaits provider execution and catches typed provider/configuration failures. Invalid public input, invalid provider output, provider rejection, network/timeout failure, and missing or invalid configuration map to pinned shared error envelopes. Public bodies and schemas omit upstream bodies, stack traces, request URLs, credentials, and vendor-specific internals.

### Generate public artifacts from executable contracts

Register the coach route and schemas in the executable route registry only after contract decisions are fixed. Regenerate committed OpenAPI and fetch client output through the existing commands; do not hand-edit generated files. Update `.env.example` and project documentation for delivered server-only configuration and mark architecture behavior current only where implementation exists.

## Risks

- **Missing session dependency could create a parallel domain model.** Mitigation: stop implementation until the authoritative read projection exists and inject only that read interface.
- **Async provider exceptions could escape the current dispatcher.** Mitigation: add an explicit awaited route path with centralized typed normalization and preserve health behavior.
- **Unbounded or unstable targets and notes could make context and tests nondeterministic.** Mitigation: pin selection, fields, bounds, and ordering before implementation.
- **Vendor errors could leak credentials or unstable response shapes.** Mitigation: confine vendor types to the adapter and expose only declared safe errors.
- **Advisory tools could become a mutation channel.** Mitigation: provide no executor or write dependency and verify persistence before and after coaching.
- **Generated API artifacts could drift.** Mitigation: regenerate from the registry and run `check:api` and `scripts/precommit-run`.

## Traceability

- Task: `task:54dffbbb-53a7-4259-a880-2b594d7f48bd`
- Accepted architecture decision: `decision:1-swarm-architect-recommendation`
- Accepted review decision: `decision:1-swarm-reviewer-recommendation`
- Accepted implementation decision: `decision:1-swarm-lead-dev-recommendation`
- Validated round evidence: `round:1:agent:swarm-architect`, `round:1:agent:swarm-reviewer`, `round:1:agent:swarm-lead-dev`
