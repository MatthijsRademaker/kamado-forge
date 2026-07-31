# Product Guardrails

This project is a **kamado-first BBQ coach and learning companion** for one owner. Every feature should reinforce the product loop in `vision.md`: plan a cooking day, follow live guidance, ask context-aware questions, log what happened, and learn from the next cook.

## Product identity

The app is not a generic recipe site. It should help a learner become confident at managing a kamado: fire building, vent control, ceramic heat retention, deflector setup, smoking, reverse searing, direct grilling, and temperature transitions.

## Primary navigation model

Future frontend work should converge on five areas:

| Area | Purpose | Guardrail |
| --- | --- | --- |
| **Today** | Start or continue the active cook. | Keep it glanceable outdoors; do not bury the current action behind complex navigation. |
| **Plan** | Build a cooking-day timeline. | Treat kamado setup, sequencing, targets, and transitions as first-class planning data. |
| **Coach** | Ask the LLM questions. | Backend must provide active session and memory context so the user does not repeat themselves. |
| **Learn** | Read kamado-oriented guides. | Learning content should connect directly to cooking decisions and session planning. |
| **Logbook** | Review cooks and lessons. | Capture planned vs. actual timing, results, mistakes, preferences, and improvements. |

## Architectural boundaries

- The **Vue SPA** owns interaction design and local UI state.
- The **Bun API** owns persistence, domain rules, and any future LLM provider calls.
- The **SQLite database** is the personal durable store.
- The frontend should call only the project backend for product data; direct browser-to-LLM integration would bypass memory, prompt hygiene, and session context.

## Current implementation status

Current code is a scaffold:

- `frontend/src/App.vue` renders a stack summary card.
- `backend/src/index.ts` exposes `/api/health`, initializes SQLite, and configures CORS.
- `.devagent/architecture/` now contains the source-of-truth LikeC4 model for intended product boundaries.

Planned product features are modeled as guardrails in the architecture diagrams, but their APIs, schema, UI routes, and LLM integration are not implemented yet.

## Related pages

- [Vision & Goals](./vision.md) — product strategy and anti-goals.
- [Architecture Diagrams](./architecture.mdx) — LikeC4 views for product boundaries and planned flow.
- [Tech Stack](./tech-stack.md) — repository layout, scripts, and current tooling.
