# context-aware-coach-api Specification Delta

## MODIFIED Requirements

### Requirement: Contract-validated non-streaming coach endpoint

The backend MUST register one non-streaming Coach endpoint whose strict public request accepts only one trimmed, nonblank question of at most 2,000 characters. Its structured success response and shared errors MUST be defined by runtime schemas. The endpoint MUST reject malformed or out-of-policy input before reading session context or invoking a provider, sort validation issues deterministically, and validate every response body before return.

#### Scenario: Invalid question is rejected at the contract boundary

- **WHEN** a client sends a blank or over-2,000-character question or supplies an undeclared body field
- **THEN** the backend returns the declared structured validation error without reading active-session context or invoking a provider

#### Scenario: Provider output does not match the public contract

- **WHEN** a provider returns content that cannot be validated as the structured Coach result
- **THEN** the backend returns `COACH_PROVIDER_INVALID_OUTPUT` instead of raw or partial provider content

### Requirement: Authoritative deterministic context assembly

`CoachService` MUST construct immutable Coach context server-side through the authoritative read-only active-session projection. The public request MUST NOT supply trusted session identity, status, phase, step, or note facts, and the implementation MUST NOT create a parallel Coach-specific session model. Context MUST be exactly `{ kind: "none" }` or an active snapshot containing only `kind`, `sessionId`, `sessionTitle`, `sessionStatus`, `phaseTitle`, `stepOrdinal`, `stepTitle`, and `projectedAt`.

#### Scenario: No session is active

- **WHEN** the authoritative projection reports no active session
- **THEN** the provider receives exactly `{ kind: "none" }` and no fabricated session data

#### Scenario: A session is active

- **WHEN** the authoritative projection returns an active session
- **THEN** the provider receives the allowlisted active snapshot and no notes, instructions, targets, setup, timing, or execution history

### Requirement: Vendor-neutral provider boundary

The backend MUST define an injected `CoachProvider` interface that receives only the validated question and immutable allowlisted context. A deterministic non-streaming fake MUST implement the interface for controlled development and tests. No production vendor, model, credential contract, prompt format, or provider SDK is selected by this change, and vendor-specific shapes MUST NOT leak into the public API.

#### Scenario: Deterministic fake captures a request

- **WHEN** a Coach test injects the fake provider
- **THEN** the fake performs no network call, captures the exact allowlisted provider input, and returns the configured stable fixture or typed simulated failure

#### Scenario: No production provider is selected

- **WHEN** Coach runs without an injected provider and `COACH_PROVIDER` is absent or `disabled`
- **THEN** the endpoint returns `COACH_PROVIDER_DISABLED` rather than fake guidance

### Requirement: Server-only provider configuration

Provider selection MUST occur only in Bun server configuration through the non-VITE `COACH_PROVIDER` environment variable. `disabled` and `fake` are the only supported runtime values in this slice; absent configuration behaves as disabled, and unsupported values MUST fail startup loudly. Provider configuration MUST be absent from Coach request/response schemas, OpenAPI, and generated Vue code.

#### Scenario: Fake configuration is selected explicitly

- **WHEN** the server starts with `COACH_PROVIDER=fake`
- **THEN** it constructs the deterministic fake without exposing provider selection through the browser contract

#### Scenario: Configuration is absent

- **WHEN** `COACH_PROVIDER` is absent or `disabled`
- **THEN** valid Coach questions return HTTP 503 `COACH_PROVIDER_DISABLED` while health and session routes remain available

#### Scenario: Configuration is unsupported

- **WHEN** `COACH_PROVIDER` contains any other value
- **THEN** API startup fails loudly rather than selecting a fallback

### Requirement: Deterministic safe provider failures

The backend MUST map disabled, timeout, unavailable, rate-limit, and invalid-output provider failures to pinned deterministic HTTP statuses and shared error envelopes. Responses MUST NOT contain prompts, raw provider payloads, stack traces, credentials, or provider-specific diagnostics. Unknown programming failures MUST remain fail-loud.

#### Scenario: Provider times out

- **WHEN** the provider reports a typed timeout
- **THEN** the endpoint returns HTTP 504 `COACH_PROVIDER_TIMEOUT` with an empty safe issue list

#### Scenario: Provider is unavailable

- **WHEN** the provider reports typed unavailability
- **THEN** the endpoint returns HTTP 503 `COACH_PROVIDER_UNAVAILABLE` with an empty safe issue list

#### Scenario: Provider rate limits the request

- **WHEN** the provider reports a typed rate limit
- **THEN** the endpoint returns HTTP 429 `COACH_PROVIDER_RATE_LIMITED` with an empty safe issue list

#### Scenario: Provider output is invalid

- **WHEN** provider output fails structured runtime validation
- **THEN** the endpoint returns HTTP 502 `COACH_PROVIDER_INVALID_OUTPUT` without partial output

### Requirement: Advisory-only orchestration cannot mutate sessions

`CoachService` MUST have only a read-only context dependency and a provider dependency. It MUST expose no session mutation operation or tool executor; provider guidance MUST be returned only as validated advisory data for user consideration.

#### Scenario: Provider suggests a session change

- **WHEN** provider guidance suggests advancing a step, changing a target, or adding a note
- **THEN** the Coach endpoint returns only the validated advisory response and leaves persisted session state unchanged

#### Scenario: Coach dependencies are assembled

- **WHEN** the backend constructs `CoachService`
- **THEN** it supplies no step, target, note, timing, or status mutation dependency

### Requirement: Exact context and non-mutation tests

The backend MUST use the deterministic fake provider to assert the complete question and allowlisted context supplied for no-active-session and active-session fixtures. It MUST compare authoritative session persistence before and after coaching to prove that guidance does not mutate state, and MUST exercise fake-provider success and failure through the HTTP boundary.

#### Scenario: Exact absent-session request is tested

- **WHEN** the no-active-session fixture invokes Coach
- **THEN** the test observes exactly one fake-provider input with the question and explicit `{ kind: "none" }` context

#### Scenario: Exact active-session request is tested

- **WHEN** the active-session fixture invokes Coach
- **THEN** the test observes exactly one fake-provider input whose allowlisted context comes from authoritative persisted state and confirms that state is unchanged afterward

#### Scenario: Fake failure is tested through HTTP

- **WHEN** an injected fake reports a typed failure
- **THEN** an API integration test observes the corresponding sanitized status and public error envelope

### Requirement: Generated coach contract and configuration documentation

The Coach operation and exact success/error schemas MUST be generated into the committed OpenAPI document and typed Vue client from the executable route registry. `.env.example` and relevant project documentation MUST describe backend-only fake/disabled provider selection, and normal verification MUST detect generated artifact drift.

#### Scenario: API artifacts are regenerated

- **WHEN** the executable Coach contract is finalized and the API generation command runs
- **THEN** the committed OpenAPI document and typed client contain the bounded question operation without provider configuration fields

#### Scenario: Repository verification runs

- **WHEN** `check:api` and the complete `scripts/precommit-run` lane run after implementation
- **THEN** they pass only when runtime contracts, generated artifacts, tests, and documented configuration are consistent
