# Build and wire the context-aware Coach page

## Why
Kamado learners need to ask for guidance during a cook without re-entering the active session and current step. The product currently has a routed Coach placeholder but no complete browser-to-backend experience, no structured Coach response contract, and no safe recovery path for transport or provider failures.

## What Changes
- Add a vendor-neutral Bun Coach endpoint that accepts only a nonblank learner question, resolves an allowlisted active-session/current-step snapshot on every send or retry, and never mutates the cooking session.
- Add an injected Coach provider boundary, runtime validation for provider output and public responses, a deterministic fake provider, and stable sanitized mappings for disabled, timeout, unavailable, rate-limit, and invalid-output failures.
- Return structured answers, ordered guidance, separate warnings, suggested follow-ups, and the exact nullable context snapshot used.
- Regenerate the committed OpenAPI document and Hey API client, and expose Coach sends through a Pinia Colada domain mutation rather than feature-level transport code.
- Replace the `/coach` placeholder inside the existing five-area ProductShell with a session-local transcript, visible current and per-answer context, review-first suggestions, an accessible multiline composer, pending state, and same-turn retry.
- Add backend and frontend coverage for active and no-active context, structured success and provider failure, transport failure, retry de-duplication, keyboard behavior, and 320px layout.
- Synchronize provider/configuration behavior, product status, and the LikeC4-backed architecture documentation with the executable contract.

## Impact
The change touches the backend contract/dispatcher, active-session projection integration, provider configuration, committed OpenAPI and generated client artifacts, frontend Coach data access and view state, automated tests, `.env.example`, and project/architecture documentation. It preserves the existing Today, Plan, Coach, Learn, and Logbook navigation and the backend-only provider boundary. No production LLM vendor is selected by this change.