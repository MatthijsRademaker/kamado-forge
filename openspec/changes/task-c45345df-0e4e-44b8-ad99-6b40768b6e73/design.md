# Design: Context-aware Coach vertical slice

## Context
The existing ProductShell and `/coach` route provide the authoritative five-area navigation, while the active live-session API provides the backend-owned cooking projection and explicit no-active-session semantics. The Coach slice must connect that route to a backend-owned provider boundary through the generated client. The visual reference at `designs/kamado-learn-chat-page.png` informs dark styling, message hierarchy, suggestions, and composer prominence only; its navigation and learning dashboard are not product requirements.

The transcript is local to the loaded page. The backend resolves context independently for each request because the active cook may change between page render, send, response, and retry.

## Goals
- Let a learner ask a kamado question without supplying cook or step identifiers.
- Show both the currently displayed context and the exact server snapshot that informed each answer.
- Render answers, guidance, warnings, and follow-ups as distinct structured content.
- Preserve the question and transcript across failures and make transport failures distinguishable from provider failures.
- Keep generated API artifacts, runtime behavior, tests, configuration, and documentation synchronized.
- Keep the experience keyboard-operable and usable without page-level horizontal overflow at 320px.

## Non-Goals
- Voice, image, or file input.
- Streaming or partial responses.
- Durable conversations, persistent coaching memory, or a conversation-history selector.
- MCP, browser-to-provider calls, or selection of a production LLM vendor/model.
- Autonomous activation, pause, advancement, timing, note, or other cooking-session mutations.
- Learning dashboards, mode selectors, books carousels, alternate navigation, generic coaching, accounts, community, or hardware/probe integration.

## Decisions

### Use the existing shell and live-session baseline
Implementation extends the existing `/coach` placeholder, ProductShell, active-session query, strict Zod route registry, dispatcher, and generation pipeline. It does not rebuild those prerequisites. The implementation first verifies that these named seams remain present and reconciles any stale product-status documentation.

### Keep the request narrow and resolve context once on the server
The Coach request body contains only a nonblank `question`. The API reads one authoritative active live projection for every send and retry, reduces it once, gives that snapshot to the provider, and returns the same snapshot as `contextUsed`. Browser-supplied session, phase, step, prompt, or provider fields are rejected.

`contextUsed` is discriminated as either `{ kind: "none" }` or an active snapshot containing only `kind`, `sessionId`, `sessionTitle`, `sessionStatus`, `phaseTitle`, `stepOrdinal`, `stepTitle`, and `projectedAt`. The phase is derived server-side from the authoritative plan and current-step ordinal when it is not already projected. Notes, instructions, targets, setup, vent guidance, elapsed/planned timing, and the rest of the live DTO are not sent to the provider or echoed by Coach in this slice. No active session is valid and still permits a general kamado question.

### Validate structured output at both provider and public boundaries
The provider result is runtime-validated into a concise `answer`, ordered `guidance` strings, zero or more `warnings`, and `suggestedFollowUps`. The public success response is separately runtime-validated and adds `contextUsed`. Context comes from the server, not provider output. Invalid output never becomes fabricated or partially rendered guidance.

### Use an injected, vendor-neutral provider
The backend owns a `CoachProvider` port. A deterministic fake is available only through explicit test/development configuration or dependency injection and is never an implicit production fallback. If no supported provider is configured, the endpoint fails deliberately. A real vendor adapter, model, credential contract, and production retry policy remain outside this change.

Provider failures use the existing structured API error envelope with an empty safe issue list and these stable public mappings:

| Condition | HTTP status | Public code | User retry |
| --- | ---: | --- | --- |
| Disabled or unconfigured | 503 | `COACH_PROVIDER_DISABLED` | No; configuration is required |
| Timeout | 504 | `COACH_PROVIDER_TIMEOUT` | Yes |
| Unavailable | 503 | `COACH_PROVIDER_UNAVAILABLE` | Yes |
| Rate limited | 429 | `COACH_PROVIDER_RATE_LIMITED` | Yes |
| Invalid structured output | 502 | `COACH_PROVIDER_INVALID_OUTPUT` | Yes |

Messages are project-owned and sanitized. Credentials, prompts, raw provider payloads, provider-specific diagnostics, and stack traces never enter public responses. Unknown programming failures remain fail-loud through the existing server error path rather than being mislabeled as a known provider failure.

### Reconcile transcript turns locally
Each submitted question creates one client-only turn identity with pending, succeeded, or failed state. While any send is pending, duplicate submission is disabled. A retry reuses the failed question and turn identity, resolves fresh server context, and replaces that turn's failed/assistant state; it does not append another user turn. Existing turns remain visible. A response snapshot may differ from the page's pre-send context, and the answer labels the returned snapshot as the context used.

A request that receives a declared provider error is rendered from its public code. A failure that receives no API response is rendered as a transport/offline failure. Neither path fabricates an answer. Retry is offered for transport errors and for the retryable provider codes above.

### Keep suggestions review-first and the composer accessible
Suggested questions are keyboard-focusable and relevant to the displayed active/no-active state. Selecting one copies its exact text into and focuses the composer without sending. Enter inserts a newline; Ctrl+Enter or Command+Enter submits. Blank or whitespace-only input is rejected, and pending/error changes are announced without moving or trapping focus.

### Preserve generated transport boundaries
The executable Zod contract generates OpenAPI and the Hey API operation. A Coach domain module wraps that operation as a Pinia Colada mutation. Feature code does not call `fetch`, import a provider SDK, or hand-author duplicate Coach DTOs. Generated files are regenerated, never edited manually, and normal drift checks remain authoritative.

## Risks
- **Changing live context:** The pre-send context can become stale. Resolve a single fresh backend snapshot for each attempt and always render the returned `contextUsed` beside its answer.
- **Over-disclosure:** Passing the full live DTO could expose notes or unnecessary cooking data. Serialize and test only the explicit context allowlist.
- **Duplicate turns:** Coupling transcript entries directly to mutation state can duplicate questions on retry. Keep stable local turn identities and replace same-turn state.
- **Failure confusion or leakage:** Transport and provider errors can collapse into one message or expose vendor internals. Classify network absence in the browser and map only typed failures to sanitized public codes in the API.
- **Contract drift:** Runtime schemas, OpenAPI, generated operations, and domain types can diverge. Regenerate artifacts and exercise the generated mutation before running drift and precommit checks.
- **Responsive regressions:** Long warnings and shell controls can overflow narrow layouts. Use a single-column narrow layout, wrapping content, practical controls, visible focus, and actual 320px coverage.

## Conflict Resolution
The exploration dossier described a showcase/health-only checkout, while the round-one lead developer inspected the current implementation and found the routed ProductShell, `/coach` placeholder, active-session normalization, persistence-backed live projections, and generation pipeline already present. This design follows the newer, repository-specific inspection and treats those components as the baseline to extend, while requiring an initial verification rather than rebuilding them.

The room did not approve a production LLM vendor. This design therefore resolves provider scope to an injected vendor-neutral port, explicit fake mode for controlled development/tests, and a deliberate disabled error when no provider is configured. It does not guess vendor credentials or silently return fake guidance.

The room required a disclosure-safe context contract but left optional live fields open. This design adopts the accepted minimum identity/title/status, phase/step, ordinal, and projection timestamp fields and excludes notes and all additional plan/live details from this first slice.

## Traceability
- `task:c45345df-0e4e-44b8-ad99-6b40768b6e73`
- `decision:1-swarm-reviewer-recommendation`
- `decision:1-swarm-architect-recommendation`
- `decision:1-swarm-lead-dev-recommendation`
- `round:1:agent:swarm-reviewer`
- `round:1:agent:swarm-architect`
- `round:1:agent:swarm-lead-dev`