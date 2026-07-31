# Design: Text-only MVP session-flow blueprint

## Context
The product is a single-user, kamado-first BBQ coach whose core loop is to plan a cooking day, follow live guidance, ask context-aware questions, log what happened, and learn for the next cook. Today must start or continue the active cook without burying it; Plan must make kamado setup, sequencing, targets, and transitions first-class; Live Cook must work outdoors with clear current actions and recovery paths.

The requested deliverable is one self-contained Markdown document. Existing design images establish a dark charcoal surface, ember-orange emphasis, high-contrast typography, outlined-card, and restrained-line-icon visual language, but their navigation labels are not authoritative.

## Goals / Non-Goals

### Goals
- Give implementation workers six legible, region-labeled ASCII layouts: desktop and mobile Today, Plan, and active Live Cook.
- Define one coherent state model from an empty Today through a draft Plan and active/paused Live Cook to a reviewable Logbook handoff.
- Keep current action, next action, planned targets, and kamado guidance actionable and glanceable outdoors.
- State responsive transformations rather than treating mobile as a stacked desktop layout.

### Non-Goals
- Vue routes, components, styles, APIs, persistence, schemas, tests beyond documentation verification, or any implementation work.
- Hardware probe/controller readings or telemetry behavior.
- Full Coach, Learn, or Logbook experience design beyond their required navigation presence and session handoffs.
- Architecture, navigation-ownership, generic BBQ, social, marketplace, multi-user, or public-recipe scope changes.

## Decisions

### One five-area shell; Live Cook is session state
The document will make Today, Plan, Coach, Learn, and Logbook the fixed primary navigation in both form factors. Live Cook is entered from Today or a started Plan and is represented by active-session status and return affordances, not a sixth primary destination.

### One state machine across paired layouts
The desktop and mobile layouts will express the same session states and transitions. A state/transition matrix will cover empty, loading, error, draft, active, paused, overdue/transition-pending, and finished conditions so the views cannot define divergent recovery behavior.

### Temperatures are planned/manual guidance
Dome and food values will be labeled as planned targets or manual guidance. They are not probe/controller readings, and the blueprint will not imply hardware telemetry.

### Explicit lifecycle recovery
Pausing freezes planned action/timeline progression, visibly marks the session paused, and resume reports any wall-clock delay instead of silently advancing. A missed transition visibly becomes overdue/delayed, does not auto-advance, and provides an acknowledge/mark-transition-done-and-continue path plus a Coach handoff. Finishing asks for confirmation, captures planned-versus-actual timing and notes/results, then hands off to Logbook; canceling finish preserves the active cook.

### Responsive and outdoor priorities
Desktop uses the referenced persistent-rail and multi-column information-density pattern. Mobile keeps the fixed five-area navigation as a bottom bar, makes the current action and both planned targets immediately visible, moves secondary timeline/setup/vent detail into labeled collapsible sections or action sheets, and uses overlays for Coach, pause, and finish flows. The artifact will prescribe contrast, readable type, large targets, short action copy, non-color-only status cues, and an unobstructed current-action/temperature region.

## Risks
- Independently described states could drift across Today, Plan, and Live Cook; the shared matrix and transition table are required to prevent this.
- Reference mockup labels could displace the mandated navigation; the document must treat only the five required labels as authoritative.
- Unlabeled target temperatures could imply unsupported telemetry; every temperature surface must identify planned/manual guidance.
- A mobile layout that merely stacks desktop content could obstruct the outdoor-critical action; the document must specify prioritization, collapse, and overlay behavior.

## Traceability
- `task:8429f6e7-f88c-44b1-a35c-5ef7f9c7945c`
- `decision:1-swarm-architect-recommendation`
- `decision:1-swarm-reviewer-recommendation`
- `decision:1-swarm-lead-dev-recommendation`
- `round:1:agent:swarm-architect`
- `round:1:agent:swarm-reviewer`
- `round:1:agent:swarm-lead-dev`
