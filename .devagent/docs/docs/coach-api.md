# Context-Aware Coach API

The Bun backend owns the complete coaching boundary: it validates bounded chat, reads authoritative active-session state from SQLite, invokes OpenAI through a vendor-neutral adapter, and returns advisory-only data. Browser code never supplies trusted cook context or receives provider credentials and metadata.

## Executable boundary

`backend/src/coach-contract.ts` registers `POST /api/coach` in the executable route registry. Requests contain 1–20 `user` or `assistant` messages, end with a user message, limit each message to 2,000 characters, and limit total content to 12,000 characters. The public response contains one validated message and up to four `next_action` or `caution` suggestions.

The request has no session ID, status, step, target, note, model, provider, or credential fields. `backend/src/dispatcher.ts` rejects invalid input before the service can read context or invoke a provider, and the generated OpenAPI/client artifacts expose only this public contract.

## Read-only orchestration

`backend/src/coach-service.ts` performs one context read and one provider call. `backend/src/coach-context.ts` projects the existing SQLite-backed active session into immutable `ContextSnapshotV1`:

- no active session is exactly `activeSession: null`;
- active context includes session identity/status/title, the current step, planned dome and food targets, and at most five newest persisted notes;
- timing, progress, next-step data, setup fields, and other session state are excluded;
- context comes only from the read-only `findActive` projection exposed by `backend/src/persistence/live-cook-repository.ts`.

The system prompt and two typed advisory tools live beside the service. Neither tool accepts a session ID or exposes an executor, so returned suggestions cannot advance steps, change targets, write notes, alter timing, or change session status.

## Provider ownership and configuration

`backend/src/coach-provider.ts` is the vendor-neutral boundary. `backend/src/openai-coach-provider.ts` implements one non-streaming OpenAI Responses API call and maps vendor output and failures into provider-owned types. Provider IDs, response bodies, request URLs, and token metadata do not cross the public API.

Configure the backend process with non-VITE variables:

| Variable | Required value |
| --- | --- |
| `COACH_PROVIDER` | `openai` |
| `COACH_MODEL` | Exact non-blank OpenAI model identifier sent by the adapter |
| `OPENAI_API_KEY` | Server-only OpenAI credential |

`.env.example` contains non-secret placeholders. Missing, blank, or unsupported configuration keeps health and session routes available but makes valid coach requests return HTTP 503 `COACH_CONFIGURATION_ERROR`. Never place these values in `VITE_` variables; Vite-prefixed values are browser-readable.

## Safe failures

| Condition | HTTP | Public code |
| --- | ---: | --- |
| Invalid public request | 400 | `VALIDATION_ERROR` |
| Provider rejection | 502 | `COACH_PROVIDER_REJECTED` |
| Malformed provider output | 502 | `COACH_PROVIDER_INVALID_RESPONSE` |
| Network or timeout failure | 503 | `COACH_PROVIDER_UNAVAILABLE` |
| Missing or invalid configuration | 503 | `COACH_CONFIGURATION_ERROR` |

Every provider/configuration failure uses the shared error envelope with an empty `issues` array and omits upstream bodies, stack traces, URLs, credentials, model values, and vendor details.

## Generation and verification

`backend/openapi/openapi.json` and `frontend/src/api/generated/` are generated from the executable route registry. Do not hand-edit them.

```bash
bun run generate:api
bun run check:api
```

`backend/src/coach-service.test.ts` proves exact active and absent context plus persistence non-mutation. `backend/src/coach-dispatcher.test.ts`, `backend/src/coach-config.test.ts`, and `backend/src/openai-coach-provider.test.ts` cover boundary ordering, safe failures, configuration, and adapter mapping without network calls.

## Related pages

- [Architecture Diagrams](./architecture.mdx) — product boundaries and the delivered backend coach flow.
- [Durable Cooking-Session API](./cooking-session-api.md) — authoritative live-session projection used for coach context.
- [Tech Stack](./tech-stack.md) — repository layout, generated API workflow, and verification commands.
- [Product Guardrails](./product-guardrails.md) — advisory-only product and backend ownership rules.
