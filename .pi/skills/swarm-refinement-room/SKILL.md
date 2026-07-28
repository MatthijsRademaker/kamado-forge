---
name: swarm-refinement-room
description: Use this when operating as a participant inside the Swarm Refinement Room, validating or submitting room phase results, writing proposal_synthesis artifacts, handling artifactBaseReference/traceability, or debugging room phase failures.
license: MIT
compatibility: Requires Go-native refinement room runtime.
metadata:
  author: dev-swarm
  version: "1.0"
---

# Swarm Refinement Room — Participant Protocol

## Intent

Refinement Room converts backlog task into validated OpenSpec artifacts through manager-dispatched participant child runs plus manager-internal deterministic supervisor phases. Participant sessions never publish canonical files or evaluate task gate. Their only deliverable is committed phase result submitted through room tools; Room Supervisor owns reduction, finalization, publication, handoff, and terminal gate routing.

## Invariants

- Runtime state lives on the manager room record. Do not create repo-local ledgers or treat checkout writes as canonical room state.
- Pi-backed phases must use `validate_room_phase_result` / `submit_room_phase_result`; do not call `report_work_outcome`, `report_review_outcome`, or `report_refinement_outcome`.
- `submit_room_phase_result` is atomic: invalid submissions are not consumed. Repair exact validation errors, then resubmit.
- Traceability must reference bounded room evidence only: `task:<taskId>`, `dossier:<timestamp>`, `decision:<id>`, or `round:<n>:agent:<id>`.
- `artifactBaseReference` in `proposal_synthesis` must be copied exactly from the prompt. Stale or modified references are rejected.
- Canonical OpenSpec artifacts are published only by the Go finalizer after validation; participant checkout writes are draft scratch only.
- Git commits, pushes, and task branch persistence are gate-hook concerns, not participant responsibilities.

## Phase result protocol

1. Build candidate JSON matching the phase prompt schema.
2. Call `validate_room_phase_result` when shape is uncertain or after repairs.
3. Call `submit_room_phase_result` with the final object.
4. If submit returns validation errors, repair and submit again.
5. Stop after valid commit; participant runtime completes child run while supervisor observes durable result.

Common hard failures:

- Final answer in prose or markdown fences instead of `submit_room_phase_result`.
- Missing required `explore` fields: problem framing, goals/non-goals, assumptions, questions, affected areas with evidence, sources, participants, acceptance criteria, initial proposal sketch.
- Missing required `proposal_synthesis` fields: proposal, design, tasks, specs, traceability, artifactBaseReference.
- OpenSpec delta headings not matching `## ADDED|MODIFIED|REMOVED|RENAMED Requirements`, `### Requirement: ...`, `#### Scenario: ...`.
- Requirement text missing `SHALL`/`MUST`, or scenarios missing `WHEN`/`THEN` bullets.

## Discovery

- Find current phase vocabulary by searching for `RoomRuntimePhase` and `RefinementRoomPhaseKind`.
- Find validation rules by searching for `ValidateRoomPhaseResult` and phase-specific validator names.
- Find participant prompt construction by searching for `BuildExplorationPrompt`, `BuildRoundPrompt`, and `BuildSynthesisPrompt`.
- Inspect room progress through the manager room progress API or dashboard; do not inspect local ledger paths.
- For local end-to-end driver work, use `swarm-agent room run --task-id <id>` against a running local stack with participant containers.
