# Tasks: Build and wire the Coach page

## 1. Confirm the implementation seams

- [x] 1.1 Verify the existing ProductShell `/coach` route, active live-session projection/204 absence behavior, Zod route registry, dispatcher, OpenAPI generator, and generated-client pipeline; extend these seams rather than recreating them.
- [x] 1.2 Add failing contract tests that lock the question-only request, discriminated context allowlist, structured success, and public provider error mappings.

## 2. Implement the backend Coach boundary

- [x] 2.1 Add strict runtime schemas and a `POST` Coach question route accepting only a nonblank question and returning answer, ordered guidance, warnings, follow-ups, and `contextUsed`.
- [x] 2.2 Add the server-side context reducer that reads one active projection per attempt, derives phase/step identity, emits the active/none allowlist, and never forwards the full live DTO.
- [x] 2.3 Add the injected vendor-neutral `CoachProvider`, validate provider output, add the explicitly selected deterministic fake, and implement deliberate disabled behavior.
- [x] 2.4 Map disabled, timeout, unavailable, rate-limit, and invalid-output failures to the specified sanitized status/code combinations while leaving unknown failures fail-loud.
- [x] 2.5 Prove with API integration tests active-context success including a warning, exact provider input and returned snapshot, no-active success, every declared provider failure, response validation, and absence of cooking-session mutations or leaked provider details.

## 3. Generate and consume the API operation

- [x] 3.1 Regenerate `backend/openapi/openapi.json` and `frontend/src/api/generated/` from the executable contract without hand-editing generated artifacts.
- [x] 3.2 Add a Coach domain data-access module that exposes the generated operation as a Pinia Colada mutation and classifies declared API errors separately from no-response transport failures.
- [x] 3.3 Add domain tests proving generated relative routing, typed structured success/errors, and transport-error classification.

## 4. Build the Coach view

- [x] 4.1 Replace the `/coach` placeholder inside the existing five-area shell with the active/no-active context summary, ordered session-local transcript, accessible user/Coach labels, and per-answer `contextUsed` summary.
- [x] 4.2 Render concise answers, ordered guidance, warnings in semantically distinct markup, and suggested follow-ups without opaque markdown-only presentation.
- [x] 4.3 Add relevant keyboard-focusable suggestion controls that populate and focus the composer without auto-send.
- [x] 4.4 Add the accessible multiline composer with whitespace rejection, Enter newline, Ctrl/Command+Enter send, duplicate-pending prevention, and announced pending state.
- [x] 4.5 Implement stable local turn identities and retained same-turn retry for transport and retryable provider failures without erasing or duplicating transcript entries.
- [x] 4.6 Apply the visual reference's hierarchy and Kamado Forge styling without copying its alternate navigation or out-of-scope dashboard, and keep all essential content operable at 320px.

## 5. Verify frontend behavior

- [x] 5.1 Add component/browser tests for active and no-active context, response snapshot display, structured warnings, suggestion review, blank rejection, multiline and keyboard submission, pending duplicate prevention, and accessible labels/status announcements.
- [x] 5.2 Add tests for offline retention, provider-error distinction, retryability, fresh context on retry, and replacement of the same failed turn without a duplicate user message.
- [x] 5.3 Add a 320px viewport test proving no page-level horizontal overflow and usable context, transcript, warnings, suggestions, composer, retry controls, touch targets, and visible focus.

## 6. Synchronize configuration and documentation

- [x] 6.1 Update `.env.example` and provider documentation with explicit provider selection, fake/disabled behavior, non-streaming semantics, context allowlist, public error/status/retry mappings, and fake-provider test behavior.
- [x] 6.2 Update product status and project documentation for the shipped Coach behavior and reconcile stale baseline statements.
- [x] 6.3 Update canonical LikeC4 model/views and their documentation embeds to show the implemented Coach UI, backend orchestration, active-session context path, and backend-only provider boundary.

## 7. Complete verification

- [x] 7.1 Run focused backend, frontend, browser, API generation/drift, and documentation checks and repair all failures.
- [x] 7.2 Run `scripts/precommit-run` and require it to complete successfully.
