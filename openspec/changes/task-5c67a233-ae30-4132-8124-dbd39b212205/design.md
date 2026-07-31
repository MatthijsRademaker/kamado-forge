# Design: Local Fixture-Driven Plan Page

## Context

The frontend currently uses a direct Vue mount with pathname handling and exposes `/showcase` without Vue Router. Existing cards, buttons, form controls, empty/loading/error states, status displays, and temperature presentation provide the reusable UI boundary. The canonical API contract and generated frontend client currently expose health only, while this change requires fixtures to remain compile-time coupled to a generated session-plan shape.

The referenced session-flow blueprint is not present on the current branch. This design therefore makes its evidenced Plan hierarchy normative within the change artifacts: readiness and planned targets are prominent, ordered timeline and setup/vent guidance remain first-class, mobile detail sections collapse without losing priority information, and the fixed five-item navigation remains usable outdoors.

## Goals/Non-Goals

### Goals

- Create and edit a complete cooking-day draft entirely in memory.
- Preserve one authoritative session-plan shape from contract source through generated frontend type and fixture payloads.
- Keep ordered timeline calculation and readiness validation deterministic, reactive, and independently testable.
- Make every mutation and completion interaction keyboard accessible, visibly focused, and usable at 320px.
- Deterministically showcase complete, incomplete, empty, loading, and error states without a server.

### Non-Goals

- Add network requests, session endpoints, SQLite or browser persistence, autosave, or saved-state claims.
- Add LLM plan generation, recommendations, recipes, hardware integration, probes, controllers, or telemetry.
- Start Live Cook, transition session lifecycle state, or implement Today, Coach, Learn, or Logbook flows.
- Introduce Vue Router or redesign unrelated routes and reusable primitives.

## Decisions

### Contract-first data boundary

Before fixture or editor implementation, establish the canonical session-plan schema in the contract source and regenerate the committed OpenAPI/client artifacts through the repository generator. The contract must cover title, date, ordered phases and steps, canonical duration/timing values, technique, planned dome and food targets with units, setup, vent/fire guidance, transition guidance, and prep notes. Its accepted contract/readiness matrix must also settle field requiredness, empty-draft representation, date format, duration authority and range, temperature representation and range, and stable identity needs.

No session endpoint is added. Plan feature code imports the generated session-plan type as a type-only dependency, uses `satisfies` or equivalent static checking for every data-bearing fixture, and does not declare duplicate session, phase, or step DTOs. Loading and error belong to a small UI fixture-state wrapper rather than malformed domain payloads. Generated files are never edited manually.

### Route-thin shell

Extend the existing pathname composition rather than introducing Vue Router. Direct navigation and refresh at `/plan` render Plan; `/showcase` remains directly reachable and existing root behavior remains intact. The Plan shell presents Today, Plan, Coach, Learn, and Logbook in that order, marks Plan as current, and does not create behavior for unsupported destinations.

### Deterministic local fixtures and lifecycle

The supported local selector is `?fixture=complete|incomplete|empty|loading|error`. Data-bearing fixtures are immutable definitions checked against the generated type. Entering Plan deep-clones the selected draft into reactive state so edits cannot mutate fixture definitions. Refresh or fixture reselection recreates state from the selected fixture and discards edits.

Loading and error are explicit non-data states. Empty provides a local create-draft path using the contract's resolved empty-draft representation. Retry, reset, create, and return actions only make deterministic local state transitions and cannot fetch, save, create a backend session, or start a cook. Copy identifies the draft as local/in-memory and never claims persistence.

### Pure ordered timeline and readiness derivation

Phase and step arrays are the source of visible order. Named add, remove, move-up, and move-down operations mutate only those arrays and canonical editable fields. First-item move-up and last-item move-down are unavailable. Timeline offsets and total duration are derived by a pure function from array order and the duration authority established by the canonical contract; derived offsets and totals are not persisted in fixture payloads.

Readiness is a pure function over the draft and the accepted readiness matrix. It returns a summary, field paths, messages, and first-invalid target. The page renders reactive in-context errors associated with controls. Invoking `Complete plan` while invalid names the missing requirements and focuses the first invalid field. A valid draft displays a neutral local `Plan complete`/ready state and does not expose a Live Cook transition.

### Accessible outdoor composition

Compose existing semantic cards, buttons, inputs, textareas, empty/loading/error states, and status components rather than duplicating primitives. Reuse or minimally adapt temperature presentation only when it can expose human-readable planned/manual target semantics; target values must not use reading, probe, controller, live, or telemetry language.

At desktop widths, the ordered timeline is composed with readiness, planned targets, setup, and vent guidance. At narrow widths, DOM and visual priority place readiness and planned targets before labeled collapsible timeline and setup/vent sections. The five-item navigation becomes a persistent usable bottom bar with sufficient content and safe-area spacing. Controls have accessible names and error relationships, status is not color-only, focus is visible, actions work by keyboard, touch targets are at least 44 by 44 CSS pixels, and the page has no horizontal overflow at 320px.

## Conflict Resolution

The accepted recommendations converge on the existing no-router pathname strategy, so this design excludes Vue Router and keeps `/showcase` intact. The absent session-flow file is resolved as a delivery dependency by encoding its evidenced desktop/mobile hierarchy and state semantics directly in these normative artifacts. The future `Start Live Cook` affordance is resolved to a neutral local completion status because lifecycle transitions are explicitly out of scope.

The canonical contract field representations, readiness matrix, and empty-draft representation remain unresolved by the room evidence. They are a contract-first gate: implementation must not invent them in frontend feature code or proceed to fixture/UI work until they are settled in the authoritative schema and change artifacts.

## Risks

- A temporary frontend DTO would violate the strongest coupling requirement. Mitigation: gate fixture work on generation of the canonical session-plan type and statically check all payload fixtures.
- Mixing fixture status, validation, focus, or identity metadata into the transport shape would create drift. Mitigation: keep UI-only state separate from the cloned generated payload.
- Nested reorder could desynchronize order and timing or lose focus. Mitigation: centralize mutations, derive offsets/totals purely, use named move buttons, and test boundaries and focus behavior.
- Generic temperature presentation could imply telemetry. Mitigation: require planned/manual target labels and accessible text, and test the absence of live-reading semantics.
- Persistent mobile navigation could obscure controls or cause overflow. Mitigation: reserve bottom/safe-area space and verify the real page at 320px.
- Loading/error recovery could imply a server or duplicate a session. Mitigation: keep fixture selection and every recovery transition deterministic and local.

## Traceability

- `task:5c67a233-ae30-4132-8124-dbd39b212205`
- `decision:1-swarm-reviewer-recommendation`
- `decision:1-swarm-architect-recommendation`
- `decision:1-swarm-lead-dev-recommendation`
- `round:1:agent:swarm-reviewer`
- `round:1:agent:swarm-architect`
- `round:1:agent:swarm-lead-dev`
