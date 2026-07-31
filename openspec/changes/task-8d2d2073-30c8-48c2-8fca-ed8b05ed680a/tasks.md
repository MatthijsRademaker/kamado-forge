# Implementation Tasks

## 1. Resolve prerequisite contracts

- [ ] 1.1 Obtain and identify the authoritative session-flow blueprint and exact generated session type/version used by frontend fixtures.
- [ ] 1.2 Map lifecycle states, steps, targets, timing, notes, and terminal semantics to that contract; record any local-only UI state separately.
- [ ] 1.3 If direct generated typing is unavailable, obtain explicit contract-owner approval for an imported generated-type-derived adapter; do not hand-edit generated output or create an independent transport DTO.
- [ ] 1.4 Stop fixture implementation and report the dependency if neither the generated contract nor an approved derived boundary is available.

## 2. Add route and fixture boundaries

- [ ] 2.1 Centralize route resolution for Today at `/` and `/today`, Live at `/live`, and the preserved internal showcase at `/showcase`.
- [ ] 2.2 Add documented, whitelisted `fixture` query identifiers for no-session, draft, active-running, and active-paused direct states.
- [ ] 2.3 Define immutable fixture seeds statically checked against the approved generated contract boundary and clone them for each mounted flow.
- [ ] 2.4 Verify direct navigation and refresh for all product routes and `/showcase` under the existing serving model.

## 3. Implement the local session-flow controller

- [ ] 3.1 Add one in-memory controller for fixture selection, draft start, active running/paused state, and reset-to-baseline behavior.
- [ ] 3.2 Implement mounted-only elapsed advancement, pause freezing, resume continuation, and cleanup on unmount with a controllable test seam.
- [ ] 3.3 Implement ordered Back/Advance transitions, disabling Back at the first step and Advance at the final step while updating all step-derived content atomically.
- [ ] 3.4 Retain one session-scoped local note across step navigation and reset it on reload/app recreation.
- [ ] 3.5 Implement confirmed Finish and Cancel outcomes that return to Today's no-session state; ensure dismissal performs no transition.

## 4. Build Today and Live views

- [ ] 4.1 Compose Today states for no session with a primary plan/start intent, draft with planned summary and Start cook, and active with progress plus Continue/Resume cook.
- [ ] 4.2 Compose the Live header so the complete current action and explicitly labeled planned dome and food target values/units appear first.
- [ ] 4.3 Add distinct setup and vent guidance, elapsed alongside planned duration, determinate progress, and next-step content.
- [ ] 4.4 Add Pause/Resume, Back, Advance, labeled note entry, Finish cook, and Cancel cook using existing Forge primitives where their contracts fit.
- [ ] 4.5 Apply feature-scoped control sizing and responsive composition without changing generic primitive APIs unnecessarily.

## 5. Add destructive-action and accessibility behavior

- [ ] 5.1 Add separately named Finish cook and Cancel cook dialogs with consequence-specific descriptions and explicit confirm/cancel actions.
- [ ] 5.2 Ensure Cancel and Escape leave state unchanged and restore focus to the originating trigger; only explicit confirmation transitions state.
- [ ] 5.3 Verify accessible names, labels, keyboard operation, visible focus, and at least 44-by-44 CSS-pixel hit areas for primary outdoor and confirmation controls.

## 6. Add deterministic verification

- [ ] 6.1 Add controller/component tests for fixture initialization, draft start, running/paused timing, first/final step boundaries, atomic step content, note retention, and terminal transitions.
- [ ] 6.2 Add browser tests that directly exercise every Today state and Live running/paused variant without a backend or API request.
- [ ] 6.3 Cover note input, both dialogs' dismissal and confirmation paths, Escape behavior, focus restoration, semantic progress, and keyboard focus.
- [ ] 6.4 At 320 by 568 CSS pixels, measure that the complete current action and both planned targets are visible without vertical scrolling, controls do not overlap, and there is no page-level horizontal overflow.
- [ ] 6.5 Preserve and run existing `/showcase` coverage.

## 7. Keep project sources coherent

- [ ] 7.1 Update affected `.devagent/architecture` LikeC4 and `.devagent/docs` sources if the implemented route/view/controller boundaries change documented product structure.
- [ ] 7.2 Run the frontend format, lint, typecheck, unit, build, and browser checks available through repository Docker-backed scripts.
- [ ] 7.3 Run `scripts/precommit-run` and resolve all failures before completion.