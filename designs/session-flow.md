# Session-flow Blueprint

This document is the text-only UX contract for the kamado-first MVP session loop. It defines the visible information hierarchy and lifecycle for **Today**, **Plan**, and the **Live Cook** session state.

## Shared notation and fixed navigation

- Every ASCII layout uses `A. Region name — purpose` to identify each visible region. `[PRIMARY: label]` identifies the one action that moves the user through the main task. `[RECOVERY: label]` identifies a safe retry, return, or state-preserving alternative.
- `Dome target` and `Food target` always mean **planned/manual guidance**, not a probe, controller, or other hardware reading. A target is an intention the cook can follow or manually check; the UI must never present it as live telemetry.
- The fixed primary navigation, in this exact order and with these exact labels, is **Today**, **Plan**, **Coach**, **Learn**, and **Logbook**. It remains available while Live Cook is active. **Live Cook** is an entered session state, never a sixth primary destination.

## Visual language

Use charcoal surfaces, high-contrast light type, ember-orange emphasis for the primary action, outlined cards, restrained line icons, and optional subtle smoke/fire texture. Status always has a written label or icon in addition to color: for example `PAUSED ||`, `OVERDUE !`, and `ERROR !`.

The layouts below specify structure and priority, not Vue components, routes, styles, APIs,
telemetry, or hardware behavior.

## Today

### Desktop layout

```text
+-----------------------------------------------------------------------------------+
| A. PRIMARY NAV (persistent; switch destination)                                   |
|    [Today*]  [Plan]  [Coach]  [Learn]  [Logbook]                                  |
+--------------------------+--------------------------------------------------------+
| B. PAGE HEADER           | C. SESSION CARD (current session decision)             |
|    Today — purpose:      |    EMPTY: No active session.                           |
|    start or resume a cook|    [PRIMARY: Plan a cook] -> Plan / new draft          |
|                          |    [RECOVERY: Browse Learn] -> Learn                   |
|                          +--------------------------------------------------------+
|                          | D. RECENT CONTEXT (purpose: orient, not resume)        |
|                          |    Last cook summary  [View in Logbook]                |
+--------------------------+--------------------------------------------------------+
```

**Resumable-session variant.** Region C becomes `ACTIVE: Brisket — Step 3 of 6`, with the
next transition and planned start time. `[PRIMARY: Resume Live Cook]` enters the existing
Live Cook state. `[RECOVERY: Review plan]` opens its Plan without creating another session.

**Loading variant.** Region C reads `LOADING: Checking today’s session…`.
`[PRIMARY: Retry Today]` retries the same lookup; `[RECOVERY: Browse Learn]` leaves safely.
The session identifier is the retry context when the lookup has already found a session;
otherwise the original lookup/request identity is retained. Neither retry path can create an
active session.

**Error variant.** Region C reads `ERROR !: Today could not load.`
`[PRIMARY: Retry Today]` reloads the same state. `[RECOVERY: Go to Plan]` safely leaves
Today; it does not start a cook.

### Mobile layout

```text
+---------------------------------------------+
| A. PAGE HEADER (purpose: session decision)  |
|    Today                         [status]   |
+---------------------------------------------+
| B. SESSION CARD (purpose: start or resume)  |
|    EMPTY: No active session                 |
|    [PRIMARY: Plan a cook]                   |
|    [RECOVERY: Browse Learn]                 |
+---------------------------------------------+
| C. RECENT CONTEXT (purpose: orient)         |
|    Last cook summary      [View Logbook]    |
+---------------------------------------------+
| D. PRIMARY NAV (persistent bottom bar)      |
| [Today*] [Plan] [Coach] [Learn] [Logbook]   |
+---------------------------------------------+
```

**Resumable-session variant.** Region B shows `ACTIVE: Brisket`, current step, and the next
transition. `[PRIMARY: Resume Live Cook]` returns to the one existing session;
`[RECOVERY: Review plan]` opens that session’s Plan.

**Loading variant.** Region B shows `LOADING: Checking session…`.
`[PRIMARY: Retry Today]` retries the original lookup/request identity; if the lookup has found
a session, that session identifier is retained. Neither retry path can create an active session.
`[RECOVERY: Browse Learn]` leaves safely, and the bottom navigation remains usable.

**Error variant.** Region B shows `ERROR !: Today could not load.`
`[PRIMARY: Retry Today]` reloads in place; `[RECOVERY: Go to Plan]` returns safely without
starting or duplicating a session.

## Plan

### Desktop layout

```text
+-----------------------------------------------------------------------------------+
| A. PRIMARY NAV (persistent; switch destination)                                   |
|    [Today]  [Plan*]  [Coach]  [Learn]  [Logbook]                                  |
+-------------------+------------------------------+--------------------------------+
| B. PLAN HEADER    | C. COOKING-DAY TIMELINE      | D. TARGETS (manual guidance)   |
| Purpose: name and | Purpose: ordered duration    | Dome target: 250°F PLANNED     |
| save this draft.  | and transition plan.         | Food target: 203°F PLANNED     |
| Brisket / Sat     | 00:00 Light fire (15 min)    | [Edit targets]                 |
| Draft saved       | T1: fire established         +--------------------------------+
|                   | 00:15 Stabilize (30 min)     | E. KAMADO SETUP                |
|                   | T2: dome stable at target    | Fuel: lump charcoal, 3/4 load  |
|                   | 00:45 Cook (6 h)             | Heat: deflector, indirect      |
|                   | T3: wrap; Food 165°F PLANNED | Prep: clean grate; water pan   |
|                   | 06:45 Finish/rest (1 h)      | Vent: bottom 1-finger; top ¼   |
|                   | T4: food target / rest done  | Fire: adjust slowly; wait      |
+-------------------+------------------------------+--------------------------------+
| F. VALIDATION + ACTION (purpose: explain readiness and start exactly one cook)    |
| Complete: timeline, both targets, setup, and transition points.                   |
| [PRIMARY: Start Live Cook]    [RECOVERY: Save draft and return to Today]          |
+-----------------------------------------------------------------------------------+
```

Every target in Region D is planned/manual guidance, not a hardware reading. Region C is
editable: the cook can change order, duration, and named transition point. Regions D and E
are editable: the cook can change the target values, fuel, deflector/heat-zone arrangement,
prep, vent setting, and fire guidance.

**Empty/new-plan entry variant.** Regions B–E show `NO DRAFT: Start a cooking-day plan.`
`[PRIMARY: Create new plan]` creates an editable draft only; `[RECOVERY: Return to Today]`
creates no session.

**Incomplete-draft behavior.** `Start Live Cook` is disabled while the timeline, both
planned/manual targets, setup, or named transitions are missing. Its adjacent message names
the missing fields and `[PRIMARY: Complete plan]` focuses the first missing field. It never
creates a partial or duplicate active session. Once validation is complete, the same
`[PRIMARY: Start Live Cook]` creates one active Live Cook session.

**Loading and error variants.** The editable regions show `LOADING: Retrieving draft…` with
`[PRIMARY: Retry Plan]` and `[RECOVERY: Return to Today]`, or `ERROR !: Draft could not
load.` with the same named actions. Retry acts on the same draft request; neither path starts
a session.

### Mobile layout

```text
+---------------------------------------------+
| A. PLAN HEADER (purpose: identify draft)    |
| Brisket / Sat — Draft saved                 |
+---------------------------------------------+
| B. READINESS + ACTION (purpose: start once) |
| Ready: all required plan fields present     |
| [PRIMARY: Start Live Cook]                  |
| [RECOVERY: Save draft]                      |
+---------------------------------------------+
| C. TARGETS (planned/manual guidance)        |
| Dome 250°F PLANNED  | Food 203°F PLANNED    |
| [Edit targets]                              |
+---------------------------------------------+
| D. TIMELINE (collapsible; ordered plan)     |
| 00:00 Light fire: 15m; T1 established       |
| 00:15 Stabilize: 30m; T2 dome stable        |
| 00:45 Cook: 6h; T3 wrap                     |
| [Open full timeline and edit]               |
+---------------------------------------------+
| E. SETUP + VENTS (collapsible; cook setup)  |
| Lump charcoal / deflector / grate prep      |
| Bottom 1-finger; top ¼ — adjust slowly      |
| [Open setup and edit]                       |
+---------------------------------------------+
| F. PRIMARY NAV (persistent bottom bar)      |
| [Today] [Plan*] [Coach] [Learn] [Logbook]   |
+---------------------------------------------+
```

Region B displays `INCOMPLETE: Add food target and T3 transition` when required fields are
missing. `Start Live Cook` is disabled and `[PRIMARY: Complete plan]` opens the first missing
field. When complete, it is enabled and starts exactly one Live Cook session. Regions D and
E use labeled collapsible sections rather than a compressed desktop column.

**Empty/new-plan entry variant.** Regions B–E show `NO DRAFT` and
`[PRIMARY: Create new plan]`; `[RECOVERY: Return to Today]` leaves without a session.

**Loading and error variants.** Region B shows `LOADING: Retrieving draft…` with
`[PRIMARY: Retry Plan]` and `[RECOVERY: Return to Today]`, or `ERROR !: Draft could not load.`
with the same named actions; these act on the same draft and cannot duplicate a session.

## Live Cook (entered session state)

Live Cook retains the fixed five-item navigation. Its session indicator and return affordance
identify it as an active state, not a primary-navigation item.

### Desktop layout

```text
+-----------------------------------------------------------------------------------+
| A. PRIMARY NAV (persistent; switch destination)                                   |
|    [Today]  [Plan]  [Coach]  [Learn]  [Logbook]      SESSION: LIVE COOK           |
+----------------------------+------------------------------+-----------------------+
| B. SESSION PROGRESS        | C. CURRENT STEP + ACTION     | D. TARGETS            |
| Purpose: place in plan.    | Purpose: immediate task.     | Purpose: manual plan. |
| Step 2 / 6 • Stabilize     | Hold dome near target.       | Dome 250°F PLANNED    |
| 00:22 elapsed / 00:45 due  | [PRIMARY: Set bottom vent to | Food 203°F PLANNED    |
| Next: Cook at 00:45        | 1 finger open]               | Manual guidance       |
| Prompt: T2 dome stable     |                              | Not hardware readings |
+----------------------------+------------------------------+-----------------------+
+----------------------------------------------------+------------------------------+
| E. KAMADO GUIDANCE (purpose: safe current setup)   | F. TIMELINE (purpose: next)  |
| Fuel: lump charcoal; heat: deflector / indirect    | 1 Fire ✓  2 Stabilize *      |
| Top vent: ¼ open; wait before changing again       | 3 Cook -> T3 wrap -> Finish  |
+----------------------------------------------------+------------------------------+
| G. SESSION CONTROLS (purpose: deliberate lifecycle)| H. COACH (purpose: help)     |
| [Pause]  [Finish cook]                             | [Ask Coach about this step]  |
+-----------------------------------------------------------------------------------+
```

Region C remains unobstructed until its immediate action is completed or deliberately
changed. Region D always labels values as planned/manual guidance, never as live probe or
controller readings. Region F names the next phase and transition prompt; Region E retains
the current fuel, heat-zone/deflector, vent, and fire-adjustment guidance.

### Mobile layout

```text
+---------------------------------------------+
| A. SESSION STATUS (purpose: place in plan)  |
| LIVE COOK • Step 2 / 6 • Stabilize          |
| 00:22 elapsed • next Cook at 00:45          |
+---------------------------------------------+
| B. CURRENT STEP + ACTION (unobstructed)     |
| Hold dome near target.                      |
| [PRIMARY: Set bottom vent to 1 finger open] |
+---------------------------------------------+
| C. TARGETS (immediately visible)            |
| Dome 250°F PLANNED | Food 203°F PLANNED     |
| Manual guidance — not hardware readings     |
+---------------------------------------------+
| D. NEXT STEP (purpose: prepare ahead)       |
| Next: Cook • Prompt: T2 dome stable         |
+---------------------------------------------+
| E. SECONDARY DETAILS (labeled collapsibles) |
| [Timeline and transition points v]          |
| [Kamado setup, vents, and fire guidance v]  |
+---------------------------------------------+
| F. SESSION CONTROLS (purpose: lifecycle)    |
| [Pause]  [Finish cook]  [Ask Coach]         |
+---------------------------------------------+
| G. PRIMARY NAV (persistent bottom bar)      |
| [Today] [Plan] [Coach] [Learn] [Logbook]    |
+---------------------------------------------+
```

Region B and both Region C targets remain above the fold and unobscured by a secondary
panel. Regions E and F open labeled action sheets or overlays: **Coach** opens a
context-aware Coach overlay; **Pause** opens a pause-confirmation overlay; and **Finish
cook** opens a finish-confirmation overlay. Closing or canceling an overlay returns to the
same active step without losing session state.

## Shared session contract

### State matrix

| Area | State | Visible state and allowed action | Safe recovery and invariant |
| --- | --- | --- | --- |
| Today | Empty | `No active session`; **Plan a cook** | Browse Learn or Plan; no session exists. |
| Today | Resumable | `ACTIVE` name, step, next transition; **Resume Live Cook** | Review its Plan; exactly one existing session remains. |
| Today | Loading | `LOADING` | Retry retains a found session identifier or the original lookup identity; navigation remains available; neither path creates a session. |
| Today | Error | `ERROR !`; **Retry Today** | Return to Plan; retry retains a found session identifier or the original lookup identity and cannot create a session. |
| Plan | Empty/new | `No draft`; **Create new plan** | Return to Today; creates only a draft. |
| Plan | Editable draft | Timeline, targets, setup, and validation; **Start Live Cook** when complete | Save draft / return to Today; no session before successful start. |
| Plan | Loading | `LOADING` | Retry same draft request or return to Today. |
| Plan | Error | `ERROR !`; **Retry Plan** | Return to Today; no duplicate draft or session. |
| Live Cook | Active | Current step, immediate action, planned/manual targets, next step | Pause, Finish cook, or Ask Coach; session stays active. |
| Live Cook | Paused | `PAUSED`; frozen planned position and action | Resume reports wall-clock delay; no automatic phase advance. |
| Live Cook | Transition pending | Current phase complete; next transition prompt | Acknowledge or mark transition done; no automatic advance. |
| Live Cook | Overdue | `OVERDUE !`; missed transition and delay | Acknowledge, mark done and continue, or Ask Coach; never auto-advance. |
| Live Cook | Finish confirmation | Confirmation overlay with timing and notes/results fields | Cancel returns to the same active session; confirm hands off once. |
| Live Cook | Finished handoff | `FINISHED`; planned-versus-actual timing and notes/results captured | **Review in Logbook** opens reviewable context, not a new session. |
| Live Cook | Loading | `LOADING` over existing state | Retry or return to prior stable state; retain session identity. |
| Live Cook | Error | `ERROR !` with failed operation named | Retry or return to stable active state; retain session identity. |

### Transition table

| From | User action or condition | Result | Safety rule |
| --- | --- | --- | --- |
| Today / Empty | **Plan a cook** | Plan / Empty-new draft entry | Create or edit a draft only; do not start Live Cook. |
| Today / Resumable | **Resume Live Cook** | Live Cook / Active | Reopen the identified existing session. |
| Plan / Editable draft | **Start Live Cook**, after validation | Live Cook / Active at first step | Create one session only after timeline, targets, setup, and transitions are complete. |
| Plan / Incomplete draft | Attempt Start Live Cook | Remain in draft with missing fields named | Disable start and focus **Complete plan**; never create a partial session. |
| Live Cook / Active | Complete current phase at its prompt | Next Live Cook phase | Advance only after the cook records completion. |
| Live Cook / Active | **Pause** | Live Cook / Paused | Freeze planned action and timeline position immediately. |
| Live Cook / Paused | **Resume** | Live Cook / Active | Show wall-clock delay; retain planned position and do not silently advance. |
| Live Cook / Active | Transition time passes unfinished | Live Cook / Overdue | Label overdue/delayed; do not auto-advance. |
| Live Cook / Overdue | **Acknowledge delay** | Remain overdue/current phase | Preserve current phase for manual completion. |
| Live Cook / Overdue | **Mark transition done and continue** | Next Live Cook phase | Record the delayed manual completion once. |
| Live Cook / Overdue | **Ask Coach** | Coach overlay over current phase | Dismissal returns to the unchanged overdue session. |
| Live Cook / Active or Paused | **Finish cook** | Finish confirmation overlay | Keep active session behind overlay; do not finish yet. |
| Finish confirmation | **Cancel** | Prior Active or Paused state | Remove overlay without losing session state. |
| Finish confirmation | **Confirm finish** with timing and notes/results | Finished handoff | Capture planned-versus-actual timing, notes, and results once. |
| Finished handoff | **Review in Logbook** | Logbook review context | Supply the completed-cook context; Logbook is not redesigned here. |
| Any loading/error state | **Retry** or safe return | Same request or previous stable state | Preserve draft/session or Today lookup identity; never duplicate or create a session. |

### Safety semantics

- **Targets are guidance, not readings.** Every dome or food temperature in this document is
  labeled planned/manual guidance. It is not a hardware probe or controller reading, and a
  target may be followed or manually checked by the cook.
- **Pause freezes the plan.** Pause freezes the planned action and timeline position. Resume
  reports the wall-clock delay since pause, then returns to that same position; it does not
  infer that a transition happened or silently advance the timeline.
- **Overdue means manual recovery.** When a transition is late, the current phase remains
  visible with an `OVERDUE !` label. The cook can acknowledge the delay, mark the transition
  done and continue, or escalate to Coach. None of these states auto-advance.
- **Failures retain identity.** Loading and error recovery retries the same draft, known active
  session, or original Today lookup identity when no session has been found, or returns to its
  last stable state. A retry or return never creates a duplicate active session.

## Responsive and outdoor behavior

### Desktop-to-mobile transformations

| Desktop information pattern | Mobile transformation | Priority preserved |
| --- | --- | --- |
| Persistent primary navigation beside or above multi-column panels | Persistent fixed bottom bar: Today, Plan, Coach, Learn, Logbook | The five destinations stay available; Live Cook is still a state. |
| Today header, session card, and recent context share horizontal space | Header then session decision, with recent context below | Start/resume action precedes history. |
| Plan timeline, targets, and setup occupy visible columns | Targets stay visible; timeline and setup/vent details become separately labeled collapsible sections or action sheets | Start readiness and both planned/manual targets stay clear. |
| Live Cook shows action, targets, guidance, and timeline in panels | Current action, both targets, and next-step prompt stay above the fold; timeline and setup/vent guidance move into labeled collapsibles | The outdoor-critical action and targets cannot be covered by secondary content. |
| Inline help and lifecycle controls share the control row | Coach, Pause, and Finish open named overlays/action sheets | Dismiss or cancel returns to the unchanged current session. |

Mobile is a reprioritization, not a stacked desktop. No secondary timeline, setup, vent, or
help panel may displace the current action or either target from the initial Live Cook view.

### Outdoor-glanceability rules

- Use high-contrast light type and controls against charcoal surfaces; use ember-orange only
  as an emphasis, never as the only signal.
- Use readable type at outdoor viewing distance and a minimum 48 by 48 CSS-pixel touch target
  for interactive controls.
- Keep action copy short, imperative, and specific: for example, `Set bottom vent to 1 finger`.
- Pair every status color with a written label and, where helpful, a restrained line icon:
  `PAUSED ||`, `OVERDUE !`, `ERROR !`, or `COMPLETE ✓`.
- Keep the current action, both planned/manual targets, and the next-step prompt unobstructed;
  open Coach, pause, finish, and detail content in overlays or labeled action sheets instead.

## Scope boundary

This is documentation only. It introduces no Vue route, component, styling implementation,
backend schema or API, persistence, probe/controller behavior, telemetry, or architecture
change.

Coach, Learn, and Logbook appear only as the fixed navigation labels and required handoffs:
Coach receives the current cook-step context, Learn is a safe Today recovery destination, and
Logbook receives completed-cook review context. Their full screens, interactions, and content
are not designed by this artifact.
