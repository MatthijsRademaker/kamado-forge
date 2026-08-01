# Design: Today and Live Cook Fixture Slice

## Context

The Vue root currently renders a primitive showcase and has no Today or Live product view. Existing project guidance identifies Today as the application entry and `/showcase` as an internal surface, while an older primitive requirement still makes the showcase the root. The generated API and backend contract currently expose health types only, so the requested session contract coupling cannot yet be implemented honestly.

This change is a bounded local interaction model. Durable session behavior remains a future backend concern; fixture selection, pause state, elapsed display, step position, and notes exist only while the application is mounted.

## Goals / Non-Goals

### Goals

- Make no-session, draft, active-running, and active-paused states directly and deterministically exercisable.
- Provide a Today entry that clearly distinguishes no session, a draft ready to start, and an active cook ready to continue.
- Keep the complete current action and both planned temperature targets visible before scrolling at 320 by 568 CSS pixels.
- Support setup and vent guidance, elapsed/planned timing, determinate progress, next-step context, pause/resume, bounded navigation, a local note, and safe terminal actions.
- Reuse existing Forge primitives and maintain keyboard, focus, dialog, and outdoor touch-target accessibility.
- Preserve `/showcase` and verify direct navigation, responsive behavior, and the full local state flow.

### Non-Goals

- Network requests, generated-client queries or mutations, backend routes, persistence, or database changes.
- Timing that survives reload/unmount, background execution, service workers, wake locks, notifications, or alarms.
- Probe/controller integration or presentation of targets as measured telemetry.
- Chat, LLM calls, recovery coaching, Plan implementation, Logbook completion, or learning content.
- Hand-editing generated files or creating a parallel session transport DTO.

## Decisions

### Reconcile the route contract around Today

The application shell will resolve `/` and `/today` to Today, `/live` to Live, and `/showcase` to the preserved internal showcase. This resolves the conflicting root requirements in favor of the documented normal application entry while retaining direct showcase access. Route resolution remains thin: it selects a view and validated fixture identifier rather than owning session transitions. Direct load and refresh are acceptance paths under the existing development and built-preview serving model.

### Use explicit fixture identifiers

A documented local `fixture` query selector will whitelist `no-session`, `draft`, `active-running`, and `active-paused`. Only combinations applicable to a view need render there, but every Today state and both Live running/paused variants must have a direct URL. Fixture seeds are immutable and cloned into mounted controller state, preventing state leakage between selections or tests.

### Gate fixtures on the generated contract and blueprint

Before authoring fixture fields, identify the authoritative session-flow blueprint and exact generated session type/version. Fixture durable fields must use `satisfies` or an imported generated-type-derived alias. If the generated session type remains unavailable, implementation stops unless the contract owner explicitly approves a generated-type-derived adapter. Generated output remains read-only. Local-only UI state such as selected fixture, mounted elapsed accounting, dialog visibility, and session-scoped note text stays separate from transport data.

### Centralize local transitions

One in-memory session-flow controller owns fixture initialization, draft-to-active start, pause/resume, elapsed calculation, ordered Back/Advance transitions, session-scoped note retention, and terminal outcomes. Elapsed time advances only while the mounted active state is running, freezes while paused, and is cleaned up on unmount. Reloading or recreating the app returns to the selected fixture baseline.

Back is disabled at the first step. Advance is disabled at the final step, leaving a separate Finish cook action as the only completion path. Step changes update action, planned targets, guidance, timing/progress, and next-step content together. Notes remain available across Back/Advance for the mounted session and reset with the fixture baseline.

Confirmed Finish cook and confirmed Cancel cook both leave Live and show Today's no-session state. Dismissing either confirmation, including with Escape, leaves controller state unchanged.

### Keep the Live hierarchy mobile-first

The first viewport region contains the complete current-action instruction and two explicitly labeled planned targets, including units. Styling must not imply connected probes or live readings. Setup guidance and vent guidance remain separate readable instructions below that glanceable block, followed by elapsed versus planned timing, determinate progress, next step, note entry, navigation, and terminal actions.

Use existing Button, Progress, Dialog, Textarea, EmptyState, StatusIndicator, and temperature/readout compositions where their generic contracts fit. Apply feature-scoped sizing where necessary so primary outdoor controls and confirmation actions expose at least 44-by-44 CSS-pixel touch areas without broadening generic primitive APIs.

### Verify behavior through deterministic browser checks

Automated checks directly load every fixture, use controlled or bounded time assertions for running and paused elapsed behavior, exercise first/final step boundaries and note retention, and cover both dialog dismissal and confirmation. Browser geometry checks at 320 by 568 assert no page-level horizontal overflow and that the complete current action and both target readouts are within the initial viewport. Keyboard tests assert names, visible focus, Escape dismissal, and focus restoration.

## Risks

- **Missing contract or blueprint:** fixtures could become an unreviewed second model. Mitigation: make contract identification the first blocking task and do not implement fixtures without generated-type coupling or explicit contract-owner approval.
- **Route regressions:** root reassignment or thin pathname handling could break direct refresh. Mitigation: centralize the route matrix and test direct loads for `/`, `/today`, `/live`, and `/showcase`.
- **Timer flakiness:** wall-clock-only assertions can be unstable. Mitigation: isolate elapsed calculation behind a controllable clock seam, clear it on unmount, and avoid persistence claims.
- **Small-screen overflow:** verbose guidance and dense controls can push required content below the fold or overlap. Mitigation: action/targets first, feature-level touch sizing, and measured browser bounds at 320 by 568.
- **Targets mistaken for telemetry:** readout styling may imply connected probes. Mitigation: use explicit “planned target” labels and units and omit connected/live-sensor affordances.
- **Shared fixture mutation:** tests or route changes could leak prior state. Mitigation: keep seeds immutable and clone each selected baseline.

## Traceability

- Task scope and acceptance: `task:8d2d2073-30c8-48c2-8fca-ed8b05ed680a`
- Contract-first frontend slice: `decision:1-swarm-lead-dev-recommendation`
- Route-thin fixture/controller separation: `decision:1-swarm-architect-recommendation`
- Measured viewport, accessibility, and no-independent-DTO gate: `decision:1-swarm-reviewer-recommendation`
- Validated contributor evidence: `round:1:agent:swarm-lead-dev`, `round:1:agent:swarm-architect`, `round:1:agent:swarm-reviewer`
