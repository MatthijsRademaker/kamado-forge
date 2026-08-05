# Implementation Tasks

## 1. Extraction before addition

- [x] 1.1 Extract the current `LiveView.vue` layout into feature components before adding any timeline behavior. The file is 306 lines holding data access, six mutations, derivation, and the whole template; adding the spine in place produces an unreviewable diff. Follow the existing `frontend/src/features/plan/PlanEditor.vue` precedent for placement.
- [x] 1.2 Confirm the extraction is behavior-neutral: existing session-flow and Live Cook checks pass unchanged before any timeline work starts. If they do not, the extraction is wrong — repair it here rather than carrying the difference forward.

## 2. Derived entry sequence

- [x] 2.1 Create a pure derivation module that takes the live-cook projection and returns the ordered entry sequence: pre-cook guidance, phase dividers, past visits, return markers, notes nested under their visits, the current step, ghosted future steps, and the closing entry. It must be callable and assertable without mounting a component.
- [x] 2.2 Move the flat-ordinal-to-phase mapping out of `CoachView.vue:160` (`phaseTitleAtStep`) into the shared module and have Coach consume it. Do not write that accumulation a second time.
- [x] 2.3 Derive per-visit drift from `elapsedSeconds` against `step.durationMinutes`, and projected finish as elapsed plus the sum of remaining planned durations. Projected finish is naïve — it ignores accumulated drift — and must be labeled approximate. Do not make it drift-compensated in this change.
- [x] 2.4 Derive return markers from `history[n+1].step.ordinal < history[n].step.ordinal` and attempt counts from repeated step identity. Verify against a session with more than one successive return; the API returns only to the immediate predecessor, so repeated returns must yield repeated markers rather than one collapsed marker.
- [x] 2.5 Unit test the module against a projection with multiple phases, repeated visits, at least one return, and notes on more than one visit. Use the shape of the real session at `/live/ccc78fce-017c-41a2-9141-bddfa0f6f713` (visit#0 step0 8s, visit#1 step1 2s, visit#2 step0 open) as the baseline return case.
- [x] 2.6 Confirm no request or response schema, generated OpenAPI document, or generated client module changed, and that the API drift check passes. If the derivation feels like it wants a projection field, stop and raise it rather than editing the contract.

## 3. Spine rendering

- [x] 3.1 Render the seven entry kinds from the design's vocabulary table, with past, current, and future distinguishable without relying on color alone.
- [x] 3.2 Render `executionHistory` as ordered visit entries with actual start time and actual duration. Delete the `.flatMap((visit) => visit.notes)` pooling at `LiveView.vue:73` and render notes nested under their owning visit.
- [x] 3.3 Render `plan.phases[]` as dividers carrying title, technique, and transition guidance. This is the first use of `plan.phases` in this view.
- [x] 3.4 Render remaining planned steps as ghosted future entries in the same scroll container as history and the current step. Not behind a disclosure, not in a separate panel.
- [x] 3.5 Render the left time gutter with planned cumulative offset against actual wall clock on wide viewports, collapsing to inline per-visit metadata at narrow widths.
- [x] 3.6 Collapse the four plan-constant guidance strings into the labeled pre-cook entry at the head of the spine, expanded while no visit has finished and collapsed thereafter. Confirm setup and vent guidance remain distinct, readable, and reachable — `session-flow-blueprint` requires them exposed.
- [x] 3.7 Remove the `Progress` primitive usage and the `progress.percent` readout. Leave `progress.percent` in the projection unread; do not remove it from the contract.
- [x] 3.8 Render every durable entry against the identifier the projection supplies (`visit.id`, `note.id`, `step.id`). No comment affordance, no anchor styling, no placeholder — this is forward compatibility for the later Coach change and nothing more.
- [x] 3.9 Delete the `min-h-[27rem]` glance region at `LiveView.vue:190`. Preserve Live Cook's `flat` atmosphere assignment when relocating the display heading, so `forge-distressed-display-type` task 3.3's recorded expectation still holds in either merge order.

## 4. Pinned regions and motion

- [x] 4.1 Build the pinned action composer with the note input, pause/resume, and back/advance. Advance must be reachable without page scrolling at every supported width. Move Finish and Cancel behind an overflow control, retaining their existing dialogs, consequence copy, escape dismissal, and focus restoration verbatim.
- [x] 4.2 Build the pinned now bar, appearing only when the current-step region leaves the viewport, carrying status, step position, elapsed against planned, both labeled planned targets, and advance.
- [x] 4.3 Resolve initial scroll position to the current-step region on load, and prevent the container from anchoring to the end of its content — the end is the projected finish, not the current step.
- [x] 4.4 Animate the scroll that follows the now-line on confirmed advance or return, and reposition without animation under `prefers-reduced-motion: reduce`.
- [x] 4.5 Render terminal sessions through the same spine with the composer absent, future entries absent, and a closing entry. Collapse the nine existing `_terminal` branches into that single difference.

## 5. Verification

- [x] 5.1 Measure the above-fold composition at 320 by 568 CSS pixels. The complete current action and both labeled planned targets must be visible without vertical scrolling, per the pre-existing `today-live-cook` requirement, now with two pinned regions competing for that space. If it does not fit, collapse the now bar's target row rather than truncating the action text, and record the measurement. This is the most likely task to force a compromise.
- [x] 5.2 Confirm no determinate progress element or completion percentage remains anywhere in the view, and that step position and elapsed-against-planned are present as text reachable by assistive technology.
- [x] 5.3 Verify with a real screen reader that elapsed time is announced from exactly one live region. The now region and the now bar both display it; if both are live regions the same seconds are announced twice. This is the most likely way this change regresses working behavior.
- [x] 5.4 Test two pinned regions plus a scroll container on a real iOS Safari and a real Android browser: toolbar show/hide, dynamic viewport units, and the on-screen keyboard raising the composer while the spine scrolls beneath it. Confirm the composer and its submit action stay visible and operable with the keyboard open.
- [x] 5.5 Confirm the pinned action region and the persistent bottom navigation do not obscure one another at 390px, and that touch targets remain at least 44 by 44 CSS pixels without overlap at 320px width.
- [x] 5.6 Decide whether a confirmed-mutation-gated scroll animation needs a pending treatment on the now region. The animation targets post-confirmation server state, so a slow confirm reads as an unresponsive primary button. If it does, add it; if not, record why.
- [x] 5.7 Add browser coverage for the return case: advance, return, and confirm the timeline renders both visits and the return marker, and that the repeated step is labeled with its attempt. No current check exercises a backward cook, which is why this defect shipped.
- [x] 5.8 Confirm the terminal rendering at its own session route without active lookup, with persisted notes read-only and no control offering to edit them.
- [x] 5.9 Confirm no page-level horizontal overflow at 320px and no page-level horizontal overflow with the time gutter present at wide widths.
- [x] 5.10 Rewrite the active Live Cook desktop and mobile ASCII layouts in `designs/session-flow.md` to the spine, including a depicted non-linear cook and the pinned regions. Leaving the blueprint describing the replaced layout is the drift this repository guards against.
- [x] 5.11 Run the complete Docker-backed `scripts/precommit-run` suite, including the frozen-lockfile frontend build, and resolve all failures.
