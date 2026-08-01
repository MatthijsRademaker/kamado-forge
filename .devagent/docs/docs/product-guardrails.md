# Product Guardrails

This project is a **kamado-first BBQ coach and learning companion** for one owner. Every feature should reinforce the product loop in `vision.md`: plan a cooking day, follow live guidance, ask context-aware questions, log what happened, and learn from the next cook.

## Product identity

The app is not a generic recipe site. It should help a learner become confident at managing a kamado: fire building, vent control, ceramic heat retention, deflector setup, smoking, reverse searing, direct grilling, and temperature transitions.

## Primary navigation model

The responsive product shell uses exactly five authoritative areas:

| Area | Purpose | Guardrail |
| --- | --- | --- |
| **Today** | Start or continue the active cook. | Keep it glanceable outdoors; do not bury the current action behind complex navigation. |
| **Plan** | Build a cooking-day timeline. | Treat kamado setup, sequencing, targets, and transitions as first-class planning data. |
| **Coach** | Ask the LLM questions. | Backend must provide active session and memory context so the user does not repeat themselves. |
| **Learn** | Read kamado-oriented guides. | Learning content should connect directly to cooking decisions and session planning. |
| **Logbook** | Review cooks and lessons. | Capture planned vs. actual timing, results, mistakes, preferences, and improvements. |

## Architectural boundaries

- The **Vue SPA** owns interaction design and local UI state.
- The **Bun API** owns persistence, domain rules, and all LLM provider calls.
- The **SQLite database** is the personal durable store.
- The frontend should call only the project backend for product data; direct browser-to-LLM integration would bypass memory, prompt hygiene, and session context.

## Current implementation status

Current code ships the durable plan-to-cook slice inside the routed product shell:

- `frontend/src/router.ts` defines history-mode routes for `/today`, `/plan`, ID-addressed `/live/{sessionId}`, `/coach`, `/learn`, and `/logbook`, with `/` redirecting to Today.
- `frontend/src/features/plan/` owns the local ordered editing buffer. Explicit create and update actions persist the complete plan, and `/plan?sessionId={sessionId}` retains the selected server draft across reloads.
- `frontend/src/views/TodayView.vue` checks active state first, then offers eligible saved plans for explicit activation. It never treats an API failure as ordinary absence or silently chooses a draft.
- `frontend/src/views/LiveView.vue` renders backend-owned progress, timing, notes, and transitions for one session ID. Completed and cancelled detail remains read-only and reloadable at the same URL.
- `frontend/src/api/sessions.ts` centralizes generated-client queries, keys, mutation reconciliation, and background refetches. Production Plan, Today, and Live code no longer imports selectable fixtures or a mounted session controller.
- `backend/src/contract.ts`, `backend/src/session-contract.ts`, and `backend/src/live-cook-contract.ts` expose durable `/api/sessions` and `/api/live-sessions` routes backed by SQLite.
- `backend/src/coach-contract.ts`, `backend/src/coach-context.ts`, and `backend/src/coach-service.ts` expose a question-only `/api/coach` boundary that reduces one authoritative active projection to an explicit allowlist and cannot mutate it.
- `backend/src/coach-provider.ts` keeps provider execution server-only. Deliberate disabled behavior and an explicitly selected deterministic fake are shipped; no production LLM vendor is selected.
- `frontend/src/api/coach.ts` wraps the generated operation and distinguishes declared API errors from no-response transport failures.
- `frontend/src/views/CoachView.vue` ships visible current/used context, a session-local transcript, structured guidance and warnings, review-first suggestions, accessible multiline submission, and same-turn retry.
- `frontend/src/components/KamadoShowcase.vue` remains an internal gallery at standalone `/showcase`; Learn and Logbook remain orientation-only placeholders.
- `.devagent/architecture/` contains the source-of-truth LikeC4 model for product boundaries.

Plan, Today, Live, and Coach are executable product flows. Learn, Logbook, durable learning memory, and a production Coach provider remain planned.

## Related pages

- [Vision & Goals](./vision.md) — product strategy and anti-goals.
- [Architecture Diagrams](./architecture.mdx) — LikeC4 views for product boundaries and current flow.
- [Tech Stack](./tech-stack.md) — repository layout, scripts, and current tooling.
- [Durable Cooking-Session API](./cooking-session-api.md) — planning, activation, live commands, and terminal detail.
- [Context-Aware Coach](./coach-api.md) — strict questions, allowlisted context, provider behavior, transcript, and retry.
- [Durable Plan Page](./local-plan.md) — local editing and explicit persistence.
- [Today and Live Cook](./local-live-cook.md) — active-first selection and ID-addressed execution.
