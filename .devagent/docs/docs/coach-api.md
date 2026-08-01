# Context-Aware Coach

The Coach slice connects the session-local `/coach` transcript to a read-only Bun orchestration boundary. The browser sends one question through the generated client; the server resolves authoritative live context, invokes an injected provider, validates structured output, and returns the exact context snapshot used.

## Executable contract

`backend/src/coach-contract.ts` registers `POST /api/coach`. Its strict request accepts only:

```json
{ "question": "Should I adjust the top vent?" }
```

Questions are trimmed and limited to 2,000 characters. Blank or over-limit questions and browser-supplied session, phase, step, prompt, model, or provider fields are rejected before context lookup. A success contains a concise `answer`, ordered `guidance`, separate `warnings`, `suggestedFollowUps`, and `contextUsed`.

`contextUsed` is one of two strict shapes:

- `{ "kind": "none" }` when no active session exists;
- an active snapshot containing only `kind`, `sessionId`, `sessionTitle`, `sessionStatus`, `phaseTitle`, `stepOrdinal`, `stepTitle`, and `projectedAt`.

`backend/src/coach-context.ts` reduces one active live projection per attempt. Notes, instructions, targets, setup, vent guidance, timing, execution history, and the rest of the live DTO never cross the provider boundary.

## Provider boundary and selection

`backend/src/coach-provider.ts` defines the vendor-neutral `CoachProvider`. Calls are backend-only and non-streaming. This slice deliberately selects no production LLM vendor, model, credential contract, or automatic provider retry policy.

`COACH_PROVIDER` has two supported values:

| Value | Behavior |
| --- | --- |
| `disabled` | Deliberately rejects Coach questions with `COACH_PROVIDER_DISABLED`. This is also the behavior when the variable is absent. |
| `fake` | Selects the deterministic provider in `backend/src/fake-coach-provider.ts` for tests and controlled development. |

Unsupported values fail API startup instead of silently falling back. The fake returns stable structured guidance, one warning, and a follow-up; it also records exact provider inputs when injected by backend tests. It is never an implicit production fallback.

## Failures and user retry

Known provider failures use the shared API error envelope with an empty safe `issues` list. Messages are project-owned and omit prompts, credentials, raw payloads, provider diagnostics, and stack traces.

| Condition | HTTP | Public code | User retry |
| --- | ---: | --- | --- |
| Disabled or unconfigured | 503 | `COACH_PROVIDER_DISABLED` | No; server configuration is required |
| Timeout | 504 | `COACH_PROVIDER_TIMEOUT` | Yes |
| Unavailable | 503 | `COACH_PROVIDER_UNAVAILABLE` | Yes |
| Rate limited | 429 | `COACH_PROVIDER_RATE_LIMITED` | Yes |
| Invalid structured output | 502 | `COACH_PROVIDER_INVALID_OUTPUT` | Yes |

Unknown programming failures are rethrown through the existing server error path. `frontend/src/api/coach.ts` separately classifies a declared API envelope and a no-response transport failure while preserving the original cause.

## Browser behavior

`frontend/src/views/CoachView.vue` renders inside `ProductShell`. It shows the currently displayed active/no-active context, but each answer labels its returned `contextUsed` because context can change during a send or retry. Active answer context includes the exact session ID and projection timestamp alongside its session, phase, and step summary.

The transcript is local to the loaded page. Each question has a stable client-only identity; retry updates the same failed turn and sends the same question through a fresh server attempt. Suggestions populate and focus the multiline composer without sending. Enter inserts a newline, Ctrl+Enter or Command+Enter sends, and pending state blocks duplicates.

## Generation and verification

The executable schemas generate `backend/openapi/openapi.json` and `frontend/src/api/generated/`. `frontend/src/api/coach.ts` is the only Coach domain transport wrapper; feature code does not call `fetch` or import a provider SDK.

```bash
bun run generate:api
bun run check:api
```

Backend contract/service/dispatcher tests cover exact context, fake and disabled modes, sanitized failures, invalid output, and non-mutation. `frontend/src/api/coach.test.ts` covers generated routing and error classification. `e2e/coach.spec.ts` covers context disclosure, transcript and retry behavior, keyboard access, structured warnings, and 320px operation.

## Related pages

- [Architecture Diagrams](./architecture.mdx) — frontend, orchestration, context, and provider ownership.
- [Durable Cooking-Session API](./cooking-session-api.md) — authoritative live projection reduced for Coach.
- [Today and Live Cook](./local-live-cook.md) — the active session Coach reads without mutating.
- [Product Guardrails](./product-guardrails.md) — five-area shell and advisory-only product rules.
