# coach-experience Specification

## Purpose
TBD - created by archiving change task-c45345df-0e4e-44b8-ad99-6b40768b6e73. Update Purpose after archive.
## Requirements
### Requirement: Coach questions use server-owned active context

The Coach API MUST accept a strict trimmed, nonblank question of at most 2,000 characters without browser-supplied cook identifiers, resolve one authoritative active live-session projection for every send and retry, and MUST NOT mutate cooking-session state. It MUST reduce that projection to the exact snapshot used for provider input and public output. The snapshot MUST be discriminated as `{ kind: "none" }` or as an active value containing only `kind`, `sessionId`, `sessionTitle`, `sessionStatus`, `phaseTitle`, `stepOrdinal`, `stepTitle`, and `projectedAt`; the full live projection and user notes MUST NOT cross the provider boundary.

#### Scenario: Ask during an active cook

- **WHEN** the learner submits a question without any session, phase, or step identifier while a cook is active
- **THEN** the API resolves the active projection, sends only the question and allowlisted active snapshot to the provider, and returns that same snapshot as `contextUsed`

#### Scenario: Ask without an active cook

- **WHEN** the active-session lookup reports its normal absence state and the learner submits a general kamado question
- **THEN** the provider receives explicit `{ kind: "none" }` context and the API returns a successful answer with the same context absence

#### Scenario: Retry after context changes

- **WHEN** a failed question is retried after the active live projection changes
- **THEN** the API resolves a fresh snapshot for the retry and returns the exact new snapshot used

#### Scenario: Coach never changes the cook

- **WHEN** any Coach question succeeds or fails
- **THEN** no cooking-session status, step, timing, or note is mutated

### Requirement: Coach success is structured and runtime-validated

A successful Coach response MUST be runtime-validated and MUST contain a concise `answer`, ordered `guidance` items, zero or more `warnings`, `suggestedFollowUps`, and the exact nullable `contextUsed` snapshot. Provider output MUST be validated before public serialization, warnings MUST remain structurally separate from guidance, and invalid or partial provider output MUST NOT be presented as an answer.

#### Scenario: Renderable structured guidance

- **WHEN** the provider returns a valid answer with multiple guidance items and a warning
- **THEN** the API returns the items in order, returns the warning in the distinct warnings collection, and includes the server-owned context snapshot

#### Scenario: Invalid provider output

- **WHEN** provider output does not conform to the required structured schema
- **THEN** the API returns the declared invalid-output error and does not return fabricated or partial Coach guidance

### Requirement: Provider orchestration is backend-only and vendor-neutral

The Bun API MUST invoke an injected vendor-neutral `CoachProvider`; browser code MUST NOT call an LLM provider or assemble provider prompts. A deterministic fake provider MUST be selectable explicitly for tests and controlled development, MUST NOT be an implicit production fallback, and a missing or disabled provider MUST fail deliberately. Provider calls in this slice MUST be non-streaming.

#### Scenario: Exercise the deterministic fake

- **WHEN** an integration test injects or explicitly selects the fake provider
- **THEN** the API returns deterministic structured output and the test can inspect the allowlisted provider input

#### Scenario: No provider is configured

- **WHEN** Coach receives a question without an enabled supported provider
- **THEN** the API returns `COACH_PROVIDER_DISABLED` rather than fake or generic guidance

#### Scenario: Browser sends a question

- **WHEN** the Coach view submits or retries a turn
- **THEN** it uses the generated project client through the Coach domain mutation and never imports a provider SDK or issues a feature-level raw fetch

### Requirement: Provider failures have stable sanitized public mappings

Known provider failures MUST use the shared structured API error envelope with project-owned messages, an empty safe issue list, and these mappings: disabled or unconfigured to HTTP 503 and `COACH_PROVIDER_DISABLED`; timeout to HTTP 504 and `COACH_PROVIDER_TIMEOUT`; unavailable to HTTP 503 and `COACH_PROVIDER_UNAVAILABLE`; rate limit to HTTP 429 and `COACH_PROVIDER_RATE_LIMITED`; and invalid structured output to HTTP 502 and `COACH_PROVIDER_INVALID_OUTPUT`. The API MUST NOT expose credentials, prompt contents, raw provider payloads, provider-specific diagnostics, or stack traces. The frontend MUST distinguish a request with no API response as a transport/offline failure rather than a provider failure.

#### Scenario: Provider times out

- **WHEN** the injected provider reports its typed timeout failure
- **THEN** the API returns HTTP 504 with `COACH_PROVIDER_TIMEOUT` and no provider-private details

#### Scenario: Provider rate limits a request

- **WHEN** the injected provider reports its typed rate-limit failure
- **THEN** the API returns HTTP 429 with `COACH_PROVIDER_RATE_LIMITED` and a user-triggered retry remains available

#### Scenario: Provider is unavailable

- **WHEN** the injected provider reports typed unavailability
- **THEN** the API returns HTTP 503 with `COACH_PROVIDER_UNAVAILABLE` and a user-triggered retry remains available

#### Scenario: Browser cannot reach the API

- **WHEN** a send fails without receiving the declared API error envelope
- **THEN** the view explains that Coach could not be reached and does not label the failure as a provider error

#### Scenario: Unexpected provider integration failure

- **WHEN** provider orchestration throws an unknown programming error rather than a typed provider failure
- **THEN** the existing server error path remains fail-loud and does not misclassify it as a declared provider condition

### Requirement: The Coach view presents current and used context

The `/coach` route MUST render inside the ProductShell with exactly Today, Plan, Coach, Learn, and Logbook as the primary areas. Before sending, the view MUST identify the displayed active session and current phase/step or explicitly state that no active-cook context will be used. Each successful Coach turn MUST label and render the returned `contextUsed` snapshot so the learner can see what informed that answer, including when it differs from the pre-send display.

#### Scenario: Active context is visible

- **WHEN** the Coach page has an active session projection
- **THEN** it identifies at least the session, status, current phase, and current step before the learner sends

#### Scenario: Context changes during a request

- **WHEN** the context returned with an answer differs from the context displayed before send
- **THEN** the answer shows the returned snapshot as the context used rather than implying that the stale display informed it

#### Scenario: No cook is active

- **WHEN** the active-session query returns its normal absence state
- **THEN** the page states that no active-cook context will be used and still permits a general kamado question

### Requirement: Transcript and retry state remain session-local and stable

The Coach view MUST maintain an ordered, reload-cleared transcript with accessible user and Coach turns and stable client-only turn identities. It MUST preserve prior turns and the failed question, prevent a second submission while a send is pending, and retry a failed question by updating the same turn rather than appending a duplicate user turn. Transport failures and timeout, unavailable, rate-limit, and invalid-output provider failures MUST offer user-triggered retry; disabled-provider failures MUST explain that configuration is required instead of offering an ineffective retry.

#### Scenario: Send is pending

- **WHEN** a Coach mutation is in progress
- **THEN** the pending state is announced, existing turns remain visible, and duplicate submission is disabled

#### Scenario: Retry a transport failure

- **WHEN** the learner retries a failed no-response transport attempt
- **THEN** the same user turn becomes pending again and no duplicate user message is appended

#### Scenario: Reload the page

- **WHEN** the learner fully reloads Coach
- **THEN** the in-page transcript is cleared and no durable conversation history is requested

### Requirement: Suggestions and composer are keyboard-accessible

Suggested questions MUST be relevant to the displayed kamado context, keyboard-focusable, and MUST copy their exact text into and focus the composer without sending. The composer MUST expose an accessible name, reject blank or whitespace-only questions, preserve multiline entry with Enter, submit with Ctrl+Enter or Command+Enter, avoid focus traps, and announce pending and error changes.

#### Scenario: Select a suggested question

- **WHEN** the learner activates a suggestion by keyboard
- **THEN** its exact text appears in the focused composer for review and editing and no question is sent

#### Scenario: Enter a multiline question

- **WHEN** the learner presses Enter in the composer
- **THEN** a newline is inserted without submitting the question

#### Scenario: Submit by keyboard

- **WHEN** the focused composer contains nonblank text and the learner presses Ctrl+Enter or Command+Enter
- **THEN** one user turn is submitted through the Coach mutation

#### Scenario: Reject empty input

- **WHEN** the composer contains only whitespace and the learner attempts to send
- **THEN** no turn or network request is created and accessible validation feedback is available

### Requirement: Coach remains usable at 320 pixels

The ProductShell, context summary, transcript, structured warnings, suggestions, composer, and retry state MUST have no page-level horizontal overflow at a 320px viewport. Essential context and controls MUST remain operable, content MUST wrap, touch targets MUST remain practical, focus MUST remain visible, and status/error changes MUST be announced.

#### Scenario: Use Coach at minimum width

- **WHEN** the Coach page is exercised at a 320px viewport with a long answer and warning
- **THEN** the page has no horizontal overflow and all essential context, composer, suggestion, and retry controls remain visible and operable

### Requirement: Coach contract artifacts and documentation stay synchronized

The executable Coach schemas MUST generate the committed OpenAPI operation and Hey API client mutation, and frontend Coach feature code MUST consume that generated operation through Pinia Colada. Generated files MUST NOT be hand-edited, and normal API drift verification MUST fail when runtime schemas, OpenAPI, or generated code diverge. `.env.example`, provider documentation, product status, and canonical LikeC4-backed architecture documentation MUST agree with executable provider selection, fake/disabled behavior, non-streaming semantics, context disclosure, public failure mappings, and the backend-only provider boundary.

#### Scenario: Generate Coach artifacts

- **WHEN** the project API generation command runs after the Coach contract changes
- **THEN** it reproducibly emits the Coach OpenAPI operation and generated frontend mutation from the executable schemas

#### Scenario: Detect stale generated code

- **WHEN** the executable Coach contract changes without regenerated committed artifacts
- **THEN** API drift verification and `scripts/precommit-run` fail

#### Scenario: Verify the complete slice

- **WHEN** focused fake-provider backend tests, frontend mutation/view tests, browser accessibility/responsive tests, generation checks, and documentation checks pass
- **THEN** `scripts/precommit-run` completes successfully
