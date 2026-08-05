## Why

Live Cook renders a snapshot of a domain the backend models as an append-only log, and the gap is measurable rather than aesthetic. `GET /api/live-sessions/:id` returns `plan.phases[].steps[]` and `executionHistory[]`; `LiveView.vue` consumes neither. `plan.phases` is never read. `executionHistory` is read exactly once, at line 73, as `.flatMap((visit) => visit.notes)` — the visits themselves, their start and finish timestamps, their durations, and their ordering are discarded on arrival.

The session at `/live/ccc78fce-017c-41a2-9141-bddfa0f6f713` shows what that costs:

```
visit#0  step0  "Stabilize a clean fire"     8s   finished
visit#1  step1  "Cook over the clean fire"   2s   finished    ← advanced
visit#2  step0  "Stabilize a clean fire"   245s   open        ← returned
```

That cook went forward and then backward. The page renders `Current action · 1 of 2`, `50%`, and `No notes saved yet.` A non-linear cook is not merely under-described; it is undescribable in the current shape, because a cursor plus a percentage cannot express a revisit. The backend went to deliberate lengths to preserve repeated visits as separate durable rows — the live-cook-session spec dedicates a requirement and a scenario to it — and the only view of that data throws it away.

Three further defects are structural, not incidental:

- **The loudest element is the most static.** The glance region is `min-h-[27rem]` (`LiveView.vue:190`) carrying a step title that does not change for twenty minutes, while `_elapsedSeconds`, which changes every second, renders smaller and below it. At 390px the hero leaves roughly 180px of empty charcoal.
- **The primary verb is unreachable.** `Advance` lives in an `aside` that the `lg:grid-cols-[1.3fr_0.7fr]` layout stacks last on mobile. Measured at 390px wide, `Advance` sits past four cards, approximately 1400px down the page. Live Cook's stated use case is a phone read outdoors mid-cook.
- **Plan constants outrank live signals.** `setupGuidance`, `ventGuidance`, `deflectorGuidance`, and `heatZoneGuidance` are immutable strings snapshotted at activation. They occupy a full card at the same visual weight as timing, directly above the notes region, and they never change for the duration of the cook.

## What Changes

Live Cook becomes a **single vertical timeline spine with a now-line**: completed execution history above, the current step as the one dominant live region, remaining planned steps ghosted below, and a pinned action composer. Past, present, and future occupy one continuously scrollable column.

- Render `executionHistory[]` as ordered timeline entries with actual start time and actual duration, replacing the discarded-then-flattened treatment. Notes render nested under the visit that owns them rather than pooled into one list.
- Derive and render a **return marker** wherever `executionHistory[n+1].step.ordinal < executionHistory[n].step.ordinal`, so a cook that moved backward reads as having moved backward. Mark a repeated step with its attempt count.
- Render `plan.phases[]` as **phase dividers** on the spine, carrying `phase.title`, `phase.technique`, and `phase.transitionGuidance`, so the arc of the cook is visible rather than implied.
- Render planned steps beyond the cursor as **ghosted future entries** in the same scroll container, with planned durations and a derived projected finish time.
- Make the **spine itself the progress indicator**. The determinate `Progress` bar and the `progress.percent` readout are removed from the view. A timeline that shows position does not need a second element claiming a different position — and `50%` at step 1 of 2 is the current shape reporting a cursor as if it were completion. `progress.percent` remains in the contract, unread by this view.
- Introduce a **left time gutter** carrying planned cumulative offset against actual wall-clock time, and per-visit planned-versus-actual drift. This is the change's substantive new information: it answers "am I behind," which the current view cannot.
- Collapse the four plan-constant guidance strings into a **collapsed pre-cook entry at the top of the spine**, where they are chronologically correct and no longer compete with live state. They remain reachable, labeled, and expanded-by-default on first load of a cook whose first step has not yet finished.
- Pin an **action composer** to the bottom of the viewport carrying the note input, `Pause`/`Resume`, and `Advance`/`Back`, replacing the mobile arrangement that strands `Advance` below four cards.
- Pin a **slim now bar** that appears when the now-line scrolls out of view, carrying session status, step position, live elapsed against planned, both planned targets, and `Advance`.
- **Animate the scroll** that follows the now-line when `Advance` or `Back` resolves, rather than repositioning discontinuously.
- Render terminal (`COMPLETED`, `CANCELLED`) sessions through the same spine as a closed record, replacing the `_terminal` branching that currently produces a different information shape for the same data.

Out of scope, deliberately:

- **Coach integration.** The intended end state is a floating Coach affordance with access to the spine and plan, able to attach comments to individual entries. That needs its own change: `context-aware-coach-api` guarantees no durable conversation history, so weaving ephemeral coach turns into a durable log is a decision about honesty of persistence, not a layout detail. This change only ensures spine entries carry stable durable identity so that future change has anchors to attach to.
- **Contract or backend changes.** Drift, projected finish, attempt counts, and return markers are all derived in the frontend from `plan` and `executionHistory`, following the existing precedent at `LiveView.vue:58` where elapsed time is derived client-side from `projectedAt` and `useNow`. No new projection fields, no OpenAPI regeneration, no persistence change.
- **Retroactive notes.** The API attaches notes to the current execution only, so past entries are structurally read-only. Accepted as-is; the spine displays them without offering to edit them.
- **Editing the plan from Live Cook.** The spine shows future steps; it does not reorder or retime them.

## Capabilities

### New Capabilities

- `live-cook-timeline`: The spine's entry vocabulary, ordering rules, derived drift and projection, now-line and pinned-region behavior, scroll and animation contract, and terminal-record reuse.

### Modified Capabilities

- `session-workflow-integration`: Its Live Cook rendering requirement currently mandates rendering "progress" and treats history as notes. Restated so that timeline position satisfies progress and so history renders as visits, without which this change would contradict a live spec.
- `today-live-cook`: Its glanceable-guidance requirement fixes a 320-by-568 no-vertical-scroll contract on the current action plus both planned targets. Restated against the spine's above-fold composition, which must satisfy the same constraint through the now region and now bar rather than through a 27rem hero.
- `session-flow-blueprint`: `designs/session-flow.md` is the repository's text-only UX contract and its Live Cook ASCII layouts describe the shape this change replaces. Updated so the blueprint does not document a layout that no longer exists.

## Impact

Affects `frontend/src/views/LiveView.vue`, which is currently a single 306-line file holding data access, six mutations, derivation, and the entire layout. The spine's entry vocabulary needs extraction into components under `frontend/src/features/` or `frontend/src/components/panels/`, following the existing `PlanEditor.vue` precedent, rather than growing that file further. Derived timeline construction is pure and belongs in a separately testable module.

`designs/session-flow.md` Live Cook desktop and mobile layouts are rewritten.

Removes the `Progress` primitive usage from `LiveView.vue`. That primitive remains in use elsewhere and is not touched.

Accessibility consequence worth stating rather than discovering: removing the determinate progress bar removes an ARIA-announceable progress value. The spine must state step position and elapsed-against-planned in text that assistive technology reaches, and the pinned now bar must not become a duplicate live region announcing the same seconds twice. Both are verification tasks, not assumptions.

No backend behavior, persistence, API contract, generated client, routing, or new runtime dependency. Independent of `forge-distressed-display-type`, which is at 13 of 20 tasks: that change confirmed at task 3.3 that `LiveView.vue:200`'s heading renders clean because Live Cook resolves to `flat`. This change relocates that heading into the now region and must preserve the `flat` budget assignment, so the two do not collide in either order.
