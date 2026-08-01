# Build the Local Fixture-Driven Plan Page

## Why

Kamado learners need to assemble and revise a complete cooking-day plan before backend session APIs, generation, or persistence exist. The current frontend exposes only a primitive showcase, and the generated client has no session-plan type, so this change must first establish the authoritative generated contract boundary and then deliver a useful local-only Plan experience without creating a competing frontend DTO or implying that edits are saved.

## What Changes

- Establish a contract-owned session-plan schema containing the Plan fields required by this change and regenerate the frontend type without adding a session endpoint.
- Add a route-thin `/plan` composition through the existing pathname-based application mount, preserve direct `/showcase` access, and show the ordered Today, Plan, Coach, Learn, and Logbook navigation with Plan active.
- Add contract-typed complete, incomplete, and editable empty draft fixtures plus explicit loading and error fixture states, selected locally through `?fixture=complete|incomplete|empty|loading|error`.
- Deep-clone a selected draft into local reactive editor state and support editing title, date, ordered phases and steps, duration/timing, technique, planned dome and food targets, setup, vent/fire and transition guidance, and prep notes.
- Add pure timeline and readiness derivation, nested add/remove/move controls, accessible validation summary and field errors, and first-invalid-field focus for the completion action.
- Compose existing reusable primitives and state compositions into an outdoor-readable desktop layout and a 320px-safe mobile hierarchy with persistent navigation and collapsible detail sections.
- Add behavior-level and browser coverage for routes, fixture states, local editing, nested ordering, derived timing, validation/focus, keyboard operation, and responsive layout.

## Impact

- Affected areas include the canonical backend contract schema, generated OpenAPI/client artifacts, `frontend/src/App.vue`, a focused Plan feature, shared navigation composition as needed, Plan tests, and documentation of the new route and local fixture mechanism.
- No session network endpoint, runtime backend call, LLM generation, recipe library, durable storage, Live Cook transition, or other product route is added.
- Generated artifacts remain generator-owned and drift-checked; frontend feature code consumes the generated session-plan type rather than declaring session, phase, or step DTOs.
- Completion requires the sanctioned frontend checks and `scripts/precommit-run`.
