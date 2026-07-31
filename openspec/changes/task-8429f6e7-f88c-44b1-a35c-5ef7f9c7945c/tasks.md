# Implementation Tasks

## 1. Author the session-flow blueprint

- [ ] 1.1 Create `designs/session-flow.md` as a self-contained, text-only Markdown document with shared notation, visual-language guidance, and the authoritative fixed navigation labels: Today, Plan, Coach, Learn, and Logbook.
- [ ] 1.2 Add legible, region-labeled desktop and mobile ASCII layouts for Today, including empty/no-active-session, resumable-session, loading, and error variants with named primary and recovery actions.
- [ ] 1.3 Add legible, region-labeled desktop and mobile ASCII layouts for Plan, including empty/new-plan entry and an editable draft with an ordered cooking-day timeline, planned/manual dome and food targets, kamado setup, vent guidance, transition points, and the Start Live Cook action including incomplete-plan behavior.
- [ ] 1.4 Add legible, region-labeled desktop and mobile ASCII layouts for active Live Cook, prioritizing the current step and immediate action while exposing the next step, planned/manual targets, vent/setup guidance, timeline progress and prompts, pause/finish controls, and Coach handoff.

## 2. Define the shared session contract

- [ ] 2.1 Add a state matrix and transition table covering Today to Plan, draft Plan to Live Cook, live phase handoffs, overdue transition recovery, pause/resume, finish confirmation/cancel, and finish to reviewable Logbook context.
- [ ] 2.2 Specify that planned/manual targets are not hardware readings; pause freezes planned progression and reports wall-clock delay on resume; overdue transitions do not silently advance and offer acknowledge/mark-done-and-continue plus Coach escalation; loading/error states preserve safe retry or return without creating a duplicate active session.
- [ ] 2.3 Add explicit desktop-to-mobile transformations and outdoor-glanceability rules, including persistent mobile navigation, priority current action and targets, collapsible/action-sheet secondary content, overlays, high contrast, readable type, large touch targets, concise copy, and non-color-only status cues.
- [ ] 2.4 State the documentation-only scope boundary and that Coach, Learn, and Logbook are not fully designed by this artifact.

## 3. Verify

- [ ] 3.1 Manually review the document against the six-layout, visible-region, primary-action, state-transition, responsive, and outdoor-glanceability requirements.
- [ ] 3.2 Run `scripts/precommit-run` successfully after adding the document.
