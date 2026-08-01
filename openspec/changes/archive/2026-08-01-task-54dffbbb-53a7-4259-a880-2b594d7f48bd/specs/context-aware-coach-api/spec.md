# context-aware-coach-api Specification

## ADDED Requirements

### Requirement: Contract-validated non-streaming coach endpoint
The backend MUST register one non-streaming coach endpoint whose bounded public chat request, success response, and shared structured errors are defined by runtime schemas. It MUST reject malformed or out-of-policy input before reading session context or invoking a provider, sort validation issues deterministically, and validate every response body before return.

#### Scenario: Invalid chat is rejected at the contract boundary
- **WHEN** a client sends chat input that violates the declared request schema or policy
- **THEN** the backend returns the declared structured validation error without reading active-session context or invoking a provider

#### Scenario: Provider output does not match the public contract
- **WHEN** a provider returns content that cannot be validated and mapped to the declared coach success schema
- **THEN** the backend returns the declared malformed-provider-output error instead of raw provider content

### Requirement: Authoritative deterministic context assembly
`CoachService` MUST construct immutable `ContextSnapshotV1` server-side through the authoritative read-only active-session projection. The public request MUST NOT supply trusted session identity, status, current-step, target, or note facts, and the implementation MUST NOT create a parallel coach-specific session model.

#### Scenario: No session is active
- **WHEN** the authoritative projection reports no active session
- **THEN** the provider request contains `activeSession: null` and contains no fabricated current-step, target, or note data

#### Scenario: A session is active
- **WHEN** the authoritative projection returns an active session
- **THEN** the provider request contains the pinned session identity/status, current-step representation, target selection, and bounded recent-note fields in the pinned deterministic order

### Requirement: Vendor-neutral provider boundary
The backend MUST define a `CoachProvider` interface that receives the environment-selected model, validated chat, immutable context, server-owned system prompt, and advisory-only tool schemas. A real non-streaming adapter and deterministic fake MUST implement the same interface, and vendor request, response, identifier, and error shapes MUST NOT leak into the public API.

#### Scenario: Configured real provider is invoked
- **WHEN** a valid coach request is handled with valid server provider configuration
- **THEN** the selected adapter performs one non-streaming invocation using the configured model and returns a provider-owned typed result

#### Scenario: Deterministic fake captures a request
- **WHEN** a coach test uses the fake provider
- **THEN** the fake performs no network call, captures the exact provider request, and returns the configured stable fixture or typed simulated failure

### Requirement: Server-only provider configuration
Provider, model, and credential selection MUST occur only in Bun server configuration through documented non-VITE environment variables. Credentials and secret-bearing configuration MUST be absent from coach request/response schemas, OpenAPI, generated Vue code, and safe public errors.

#### Scenario: Configuration is valid
- **WHEN** the server resolves a supported provider with its required model and credentials
- **THEN** it constructs the selected adapter without exposing those credentials through the browser contract

#### Scenario: Configuration is missing or invalid
- **WHEN** required provider or model configuration is absent or unsupported
- **THEN** the coach path returns the pinned deterministic structured configuration error without exposing configuration values or credentials

### Requirement: Deterministic safe provider failures
The backend MUST map provider rejection, network or timeout failure, malformed provider output, and invalid configuration to pinned deterministic HTTP statuses and shared error envelopes. Responses MUST NOT contain upstream bodies, stack traces, request URLs, credentials, or vendor-specific internals.

#### Scenario: Provider rejects the request
- **WHEN** the adapter reports a provider rejection
- **THEN** the endpoint returns the pinned rejection status, code, message, and issues without raw upstream details

#### Scenario: Provider network call fails
- **WHEN** the adapter reports a network or timeout failure
- **THEN** the endpoint returns the pinned network-failure status, code, message, and issues without raw upstream details

### Requirement: Advisory-only orchestration cannot mutate sessions
The system prompt and typed advisory tool schemas MUST live beside coach execution code and MUST expose no session mutation operation. `CoachService` MUST have no session mutation dependency or tool executor; model suggestions MUST be returned only as validated data for user consideration.

#### Scenario: Model suggests a session change
- **WHEN** a provider response suggests advancing a step, changing a target, or adding a note
- **THEN** the coach endpoint returns only the validated advisory response and leaves all persisted session state unchanged

#### Scenario: Tool definitions are supplied
- **WHEN** `CoachService` constructs the provider request
- **THEN** it supplies exactly the declared advisory-only tool schemas and no callable step, target, note, timing, or status mutation

### Requirement: Exact context and non-mutation tests
The backend MUST use the deterministic fake provider to assert the complete prompt, tools, validated chat, selected model, and context supplied for no-active-session and active-session fixtures. It MUST also compare authoritative session persistence before and after coaching to prove that suggestions do not mutate state.

#### Scenario: Exact absent-session request is tested
- **WHEN** the no-active-session fixture invokes coaching
- **THEN** the test observes exactly one provider request with the declared input and explicit absent-session context

#### Scenario: Exact active-session request is tested
- **WHEN** the active-session fixture invokes coaching
- **THEN** the test observes exactly one provider request whose context values come from authoritative persisted state and confirms that state is unchanged afterward

### Requirement: Generated coach contract and configuration documentation
The coach operation and exact success/error schemas MUST be generated into the committed OpenAPI document and typed Vue client from the executable route registry. `.env.example` and relevant project documentation MUST describe backend-only provider configuration with non-secret placeholders, and normal verification MUST detect generated artifact drift.

#### Scenario: API artifacts are regenerated
- **WHEN** the executable coach contract is finalized and the API generation command runs
- **THEN** the committed OpenAPI document and typed client contain the coach operation without provider credentials or secret-bearing fields

#### Scenario: Repository verification runs
- **WHEN** `check:api` and `scripts/precommit-run` run after implementation
- **THEN** they pass only when the runtime contract, generated artifacts, tests, and documented configuration are consistent
