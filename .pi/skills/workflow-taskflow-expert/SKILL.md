---
name: workflow-taskflow-expert
description: Workflow and taskflow domain expert for this repository. Covers WorkflowDefinition, WorkflowState, TaskFlowDefinition, GateSpec, GatePolicy, EvaluateGate, ScheduleTx, action kinds, input modes, session modes, and validation. Use this when adding or changing gates, modifying workflow state execution, editing workflow or taskflow definitions, or debugging flow-controller scheduling.
---

# Workflow & Taskflow Expert

## Intent

Workflows and taskflows are the swarm's execution contract. A **workflow** describes what
a single agent does inside one run: an ordered state machine of actions. A **taskflow**
describes how the system reacts when a task changes status: which agents must run, under
what policy, and what happens on pass or fail. The manager's flow controller owns
taskflow scheduling; the agent-side engine owns workflow execution. Keeping those two
halves in agreement is the point of this domain.

## Domain model

**Workflow** (shared Go types; find them by searching for `WorkflowDefinition`):

- `WorkflowDefinition`: `Name`, `Version`, `InitialState`, `States`.
- `WorkflowState`: `ID`, `ActionKind`, `Command`, `Input`, `Session`, `Captures`,
  `Validation`, `OnSuccess` (next state ID).
- Action kinds (`WorkflowActionKind`): `command`, `fetch_pr_context`, `github_pr_comment`,
  `merge_pr`, `status_transition`, `emit_event`, `task_comment`, `create_task`,
  `load_project_context`, `deduplicate_task_proposal`, `record_review_metadata`.
- Input modes (`WorkflowInputMode`): `task_prompt`, `literal`, `artifact`, `file`, `composed`.
- Session modes (`WorkflowSessionMode`): `fresh`, `continue_state`, `continue_latest`.
- Validation modes: `marker` (output contains a marker string), `file_change`
  (files modified within scope).

**Taskflow** (find by searching for `TaskFlowDefinition`):

- `TaskFlowDefinition`: `Gates[]`, each keyed by `TaskStatus`.
- `GateSpec`: required + optional agents, policy, on_pass/on_fail transitions, hooks.
- `GatePolicy`: `all_finished`, `all_approved`, `exclusive_success`, `all_graded`.
- `GateInstance`: live instance created when a task enters a gated status; state machine
  `pending → blocked/passed/failed/overridden`.
- `GateAssignment`: one agent slot in ordinary gate, linked to `AgentRun`. Its business outcome is separate from run status.
- Agentless Refinement `GateSpec` (`IsRoomBacked`) creates durable room instead of assignments/controller run. Room terminal phase resolves gate.

## Invariants and rules

- `all_approved`: any `needs_work` outcome fails the gate immediately; only `approved`
  counts as success.
- `all_finished`: any `failed` outcome fails the gate; `finished` and `approved` both
  count as success.
- `exclusive_success`: the first required assignment to succeed passes the gate; the
  remaining assignments are skipped.
- `all_graded`: every required assignment must report a grade at or above `Threshold`;
  nil threshold retains runtime default 8.
- Sticky gates (`Sticky: true`) reuse the same agent assignments across re-evaluations.
- Gate creation is transactional. Ordinary gates create assignments and runs together. Room-backed Refinement creates gate plus room snapshot together, then starts supervisor after commit.
- On-pass hooks (`create_pr`, `merge_pr`, `commit_artifacts`) are blocking. Ordinary run-backed gates execute through runtime pending actions; room-backed gates execute manager-side through `manager/gatehook` against retained room workspace.
- Canonical taskflow lineages are keyed by `TaskDifficulty`, versioned, and mutable.
  Startup seed is seed-if-absent per difficulty and must never overwrite operator state.
- `TaskFlowDefinition.Validate` owns structural integrity. Manager save/validate/rollback
  also enforce live agent, workflow, compatibility, and room-definition references.
- Workflow definitions are semantically validated before execution
  (`ValidateWorkflowSemantics` on the shared side, plus agent-side validation); an
  invalid definition must fail loudly before any state runs.

## Discovery

- Structural taskflow validation: search for `TaskFlowDefinition.Validate`.
- Version activation: search for `SaveTaskFlowDefinitionVersion`; mutation handlers reuse
  structural and referential validation before save or rollback.
- Scheduling entry point: search for `ScheduleTx`. Check `GateSpec.IsRoomBacked` branch before assuming assignments exist.
- Ordinary gate evaluation: search `EvaluateGate`. Room terminal mapping lives in `FinalizeRoomOutcome` and `gatehook.TerminalHandler`.
- Agent-side execution: search for `executeWorkflow` — the state loop, session
  management, outcome parsing, and artifact capture.
- Serialization and persistence of these types live behind the manager's persistence
  layer; find call sites by searching for the type name you are changing.

## Flow

```
Task status change → ScheduleTx
  → ordinary gate: GateInstance + Assignments + AgentRuns → EvaluateGate
  → room-backed Refinement: GateInstance + Room → RoomSupervisor
      → participant child runs + durable phases → terminal room outcome
  → pass: blocking hook driver → finalize OnPass
  → fail: OnFail with diagnostic
```
