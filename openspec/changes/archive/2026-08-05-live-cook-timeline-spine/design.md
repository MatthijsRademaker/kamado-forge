# Design: Live Cook timeline spine

## Context

The live-cook projection is an event log. `executionHistory[]` is append-only, each entry carrying `actualStartedAt`, nullable `actualFinishedAt`, `elapsedSeconds`, its own `step` snapshot, and its own `notes[]`. The backend spec commits to this shape explicitly: *"Entering a step MUST create a new visit; advance and return MUST finish the outgoing visit and start a new visit for the target step at the same command timestamp."*

Measured consumption in `LiveView.vue`:

```
  plan.phases[]        never read
  executionHistory[]   line 73  → .flatMap(v => v.notes)   visits discarded
  currentStep          lines 56–57, 199–200
  nextStep             line 253, one line inside a guidance card
  progress.percent     lines 239–240
```

The live session at `/live/ccc78fce-…` contains three visits across two steps because a return occurred. The view reports `1 of 2` and `50%`. There is no arrangement of a cursor and a percentage that can express "second attempt at step 0 after advancing to step 1 and coming back," so this is a shape problem rather than a missing field.

Two layout facts constrain the redesign. `LiveView.vue:190` sets `min-h-[27rem]` on the glance region, which at 390px leaves roughly 180px of empty surface because the region's content is four short strings. And `lg:grid-cols-[1.3fr_0.7fr]` at line 216 places the navigation `aside` last in DOM order, so `Advance` lands approximately 1400px down the mobile page — measured, not estimated.

## Goals / Non-Goals

**Goals:**

- Render the durable execution log the backend already preserves, including non-linear cooks.
- Make the arc of the cook visible: where it has been, where it is, where it ends.
- Give the cook one loud region, and make it the region that changes.
- Answer "am I behind" from data already on the wire.
- Put `Advance` under the thumb at 390px.
- Serve the terminal read-only record from the same shape as the live one.

**Non-Goals:**

- Coach turns on the spine. Separate change; see the decision below on why the boundary sits here.
- Any contract, projection, persistence, or generated-client change.
- Retroactive notes on past visits. The API cannot attach them.
- Editing plan order or durations from Live Cook.
- Telemetry, probes, or any presentation of a target as a measured reading.

## The shape

Past above, a hard now-line, future ghosted below, composer pinned. Closer to a git log or a boarding pass than to a chat transcript — chat was the starting metaphor and it fails on one axis, addressed in the decisions below.

### Desktop

```text
   PLAN   ACTUAL
   ┌──────────────────────────────────────────────────────────────┐
   │  A. BEFORE YOU LIGHT — plan constants, collapsed   [ open ]  │
   │     two zones · half moon · direct right · ¼ vent            │
   └──────────────────────────────────────────────────────────────┘
   ───────────── B. PHASE 1 · FIRE — indirect ─────────────────────
                     leave when: clean smoke
                  │
    00:00  15:03 ─◇─   C. VISIT (past) Stabilize a clean fire      20 min
                  │        ran 0:08 · left 19:52 early
                  │        ⌐ note text nests here, owned by this visit
                  │
    00:20  15:03 ─◇─   C. VISIT (past) Cook over the clean fire    30 min
                  │        ran 0:02
                  │
                 ─⤺─   D. RETURN MARKER · back to “Stabilize a clean fire”
                  │
   ══════════════ ● ═══ E. NOW · Stabilize a clean fire · attempt 2
                  ┃
                  ┃      ┌───────────────────────────────────────┐
                  ┃      │  4 : 05     ▓▓▓▓▓▓▓░░░░░░░░░  of 20:00 │
                  ┃      └───────────────────────────────────────┘
                  ┃      Settle the dome; small vent changes only.
                  ╹
                  ┊
    00:20 ~15:23 ○      F. FUTURE (ghosted) Cook over clean fire  30 min
                  ┊        Keep the food over indirect heat.
                  ┊
                  ╵      G. PROJECTED FINISH ~15:53 · no phases after this
   ┌──────────────────────────────────────────────────────────────┐
   │  H. COMPOSER (pinned) ⌇ note…   [‖ Pause]  [Back] [Advance →]│
   └──────────────────────────────────────────────────────────────┘
```

Region `H` is pinned to the viewport bottom, not to the document end. `[PRIMARY: Advance]` lives there. `[RECOVERY: Back]` sits beside it, disabled at the first step. Finish and Cancel move behind an overflow control in `H`, retaining their existing confirmation dialogs unchanged — they are terminal, not per-step, and giving them permanent full-width buttons is what currently pushes `Advance` off-thumb.

### Mobile

```text
   ┌──────────────────────────────────────┐
   │ I. NOW BAR (pinned when now-line     │
   │    is scrolled out of view)          │
   │ ● ACTIVE  step 1/2  4:05/20:00   ⋯   │
   │ dome 225–275°F planned · food 130°F  │
   ├──────────────────────────────────────┤
   │ ⋮  ◇ Stabilize a clean fire    0:08  │  scroll up = the story
   │ ⋮  ◇ Cook over clean fire      0:02  │
   │ ⋮  ⤺ returned                        │
   │ ════════════════════════════════════ │
   │ E. NOW                               │
   │    STABILIZE A CLEAN FIRE            │
   │    4:05  ▓▓▓▓░░░░░░  of 20:00        │  ← the only loud region
   │    Settle the dome; small vent…      │
   │ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │
   │ F. ○ Cook over clean fire  ~15:23    │  ← ghosted future
   ├──────────────────────────────────────┤
   │ H. ⌇ note…   [ ‖ ]   [  ADVANCE  → ] │  ← pinned. thumb zone.
   └──────────────────────────────────────┘
```

The `PLAN` gutter column drops at narrow widths; drift moves inline into each visit's metadata line.

## Entry vocabulary

Every position on the spine is one of seven kinds. This is the actual data model of the view, and it is what the derivation module returns.

| Entry | Source | Derived? | Weight |
|---|---|---|---|
| Pre-cook constants | `plan.setupGuidance`, `ventGuidance`, `deflectorGuidance`, `heatZoneGuidance` | no | collapsed |
| Phase divider | boundary between `plan.phases[i]` step ranges | position only | rule + label |
| Visit (past) | `executionHistory[]` where `actualFinishedAt != null` | no | dense, muted |
| Return marker | `history[n+1].step.ordinal < history[n].step.ordinal` | **yes** | inline, distinct |
| Now | `currentStep` + `currentStep.execution` + `useNow` | elapsed only | dominant |
| Note | `visit.notes[]`, nested under its owning visit | no | indented |
| Future step | `plan.phases[].steps[]` past the cursor | position only | ghosted |

Phase membership requires mapping a flat step ordinal into `plan.phases[]`, which `CoachView.vue:160` already does in `phaseTitleAtStep` by accumulating `phase.steps.length`. That logic moves into the shared derivation module rather than being written a second time.

## Decisions

### The spine is the progress indicator; the determinate bar is removed

A timeline that shows position does not need a second element that reports a different position. `progress.percent` is cursor-derived: it reads `50%` on step 1 of 2, four minutes into a twenty-minute step, which a cook will read as "half done" when almost nothing has happened. Keeping both means keeping a component that contradicts the thing beside it.

`progress.percent` stays in the contract and stays unread by this view. Removing a field from a runtime-validated projection to serve a layout preference is the wrong direction of dependency.

**The cost, stated plainly:** `<Progress>` carries `aria-valuenow`. Deleting it deletes the only machine-readable progress value on the page. The spine must therefore state step position and elapsed-against-planned in text — the now entry and the now bar both carry it — and exactly one of those may be a live region, or a screen reader announces the same seconds twice from two places. This is tasks 5.2 and 5.3, and it is the most likely way this change regresses something that currently works.

**Confidence: high** on removing the bar, **moderate** on landing the announcement model correctly without a real screen reader pass.

### Past, present, and future share one scroll container

The alternative is a chat-pure history plus a separate "what's left" panel. Rejected: the complaint that started this is that the plan is invisible, and putting the future behind a disclosure re-hides most of it.

The consequence is that the scroll container holds content *below* the anchor the composer sits against, which is unlike any chat client and unlike a plain log. Two behaviors follow and must be specified rather than inherited:

- On load, scroll position resolves to the now-line, not the top and not the bottom.
- The container must not scroll-anchor to the bottom, because the bottom is the projected finish, not the current step.

**Confidence: high** on same-scroll, **moderate** on the scroll-anchoring mechanics surviving contact with iOS Safari.

### Drift and projection are derived client-side

`LiveView.vue:58` already derives live elapsed time in the frontend from `projectedAt` plus `useNow`. Following that precedent, per-visit drift (`elapsedSeconds` against `step.durationMinutes`) and projected finish (now plus the sum of remaining `durationMinutes`) are computed in the frontend from data already on the wire.

| Approach | Contract change | Regeneration | Testability |
|---|---|---|---|
| Frontend derivation from `plan` + `executionHistory` | none | none | pure module, direct unit tests |
| New projection fields on `liveCookProjectionSchema` | yes | OpenAPI + client + drift check | backend tests, then wiring |

Chosen: frontend derivation. The arithmetic is presentation-shaped — "left 19:52 early" is a phrasing decision, not a domain fact — and pushing it into a runtime-validated projection would fix a wording choice into the API. It lives in one pure module so it is unit-testable without mounting a component.

Projected finish is naïve: elapsed plus the sum of remaining planned durations, ignoring accumulated drift. It is labeled with `~` and is not presented as a commitment. A drift-compensated projection is a better number and a worse first version, because it invites the cook to trust it.

**Confidence: high.**

### Coach stays off the spine in this change

The chat metaphor pulls hard toward inlining Coach — `CoachView.vue` is already a transcript with `data-speaker` styling, and its turns would render on this spine with almost no new work. The blocker is durability, not layout: `context-aware-coach-api` guarantees no durable conversation history and one fresh context read per attempt. A coach answer sitting between two execution visits, vanishing on reload while the visits around it persist, tells the cook something false about what the spine is.

The intended end state — a floating Coach affordance with spine and plan access, attaching comments to individual entries — needs that persistence question answered first. What this change owes it is **anchors**: every spine entry renders against a stable durable identity (`visit.id`, `note.id`, `step.id`), so a later change can address an entry without re-deriving positions. No comment affordance, no anchor styling, no placeholder.

**Confidence: high** on deferring, **high** on stable IDs being the whole forward-compatibility obligation.

### The now bar is the answer to the 320-by-568 constraint

`today-live-cook` requires the complete current action and both labeled planned targets visible at 320-by-568 without vertical scrolling. `session-workflow-integration` requires current action and key targets available at 320px without horizontal overflow. The spine puts history above the now-line, which appears to break the first.

It does not, if the pinned now bar carries the targets. Dome and food targets are two short numbers, they are the values a cook steers toward, and they are constant for the cook — a slim pinned bar is a better home for them than a pair of 3.5rem cards that scroll away. Above the fold at 320-by-568 the composition must resolve to: now bar with status, position, elapsed, and both labeled targets; the now region's complete action text; and the composer with `Advance`.

That is tight. 568px minus a pinned bar and a pinned composer leaves little for the action text, and `instructions` is unbounded `requiredTextSchema`. The floor is empirical, and if it does not fit, the now bar's target row collapses before the action text truncates — the requirement names the *complete* action. Task 5.1 measures it rather than assuming it.

**Confidence: moderate.** This is the constraint most likely to force a compromise, and it is a pre-existing hard requirement rather than one this change invents.

### Plan constants become the first chronological entry

`setupGuidance`, `ventGuidance`, `deflectorGuidance`, and `heatZoneGuidance` are snapshotted at activation and immutable thereafter. On a timeline they have an obvious correct home: the top, before phase 1, because that is when they applied.

`session-flow-blueprint` requires active Live Cook to expose current vent and setup guidance. Collapsed-but-labeled-and-reachable satisfies exposure; buried behind an unlabeled control would not. The entry expands by default while no visit has finished — during fire-building the cook is actively reading vent guidance — and collapses once the first visit finishes.

**Confidence: moderate** on the auto-collapse heuristic. It is a guess about when a cook stops needing setup text, and the fallback is to leave it always collapsed with a clear label.

### Terminal sessions render as the same spine, closed

`LiveView.vue` branches on `_terminal` in nine places to produce a materially different information shape for the same payload. A completed cook is exactly what the spine renders best: a full history with timestamps and drift, no future, no composer, a closing entry. The `_terminal` branching collapses into: composer absent, future absent, closing entry present, now region rendered as the final visit.

This is also the Logbook record. Not built here, but the shape stops being an obstacle to it.

**Confidence: high.**

### Scroll animation on step change

`Advance` and `Back` move the now-line. Animating the scroll that follows it, rather than repositioning discontinuously, is the difference between the primary button feeling like navigation and feeling like a page reload. Respect `prefers-reduced-motion`, under which the position changes without transition.

**Confidence: high** on animating, **moderate** on the interaction with the mutation's own latency — the animation targets the post-mutation server state, so it cannot begin until the command is confirmed, and a slow confirm will read as an unresponsive button. Task 5.6 decides whether that needs a pending treatment on the now region.

## Risks

- **The above-fold composition may not fit 320-by-568.** Pre-existing requirement, newly tightened by two pinned regions. Measured at task 5.1; mitigation is collapsing the now bar's target row.
- **Two pinned regions plus a scroll container is a mobile-browser hazard.** Dynamic viewport units, iOS Safari toolbar behavior, and the on-screen keyboard raising the composer while the spine scrolls beneath it. Task 5.4.
- **Screen-reader duplication.** The now region and the now bar carry the same live values. Task 5.3.
- **Derived return markers depend on ordinal comparison.** Correct for the API's documented behavior — return targets only the immediate predecessor — but the derivation must not assume single-step deltas, since repeated returns produce repeated markers. Task 2.4 covers the multi-return case against a real multi-visit session.
- **`LiveView.vue` is 306 lines holding everything.** Adding the spine without extraction produces an unreviewable file. Task 1.1 is extraction, deliberately first.
