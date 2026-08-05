---
name: spec-discipline
description: Contract between task specs and the agents that execute them. Use this when formulating or refining a task spec, and when executing a task whose spec leaves a decision open — scope, acceptance check, subsystems, or coupling touches unstated.
---

# Spec Discipline

## Intent

Most failed swarm tasks trace back to the same defect: the spec left a decision open and
the worker silently picked an interpretation. This skill defines both sides of the fix —
what a spec must pin down before work starts, and what an executor must do when it
doesn't. The runtime is headless: there is no user to ask. The only substitute for asking
is making assumptions *visible* where a reviewer will see them.

## For spec writers — a spec is incomplete unless it pins down

1. **Scope by subsystem.** Which parts of the system are in scope, and — when adjacent
   work is foreseeable — what is explicitly out of scope. "Fix the retry behavior" is not
   a scope; "in the manager's task lifecycle handling, not the agent-side engine" is.
2. **The acceptance check.** How the worker proves the change works, expressed in the
   sanctioned verification lanes (the Docker-backed `scripts/` commands — see
   `.pi/rules/agent-verification.md`) or an observable behavior. A spec whose only
   acceptance criterion is "it should work" delegates the definition of done to the
   least-informed party.
3. **Expected coupling touches.** Which cross-boundary contracts the change will touch —
   use the coupling map in the `system-coherence` skill. If the change alters the manager
   API, say the dashboard client must be regenerated; if it changes documented behavior,
   name the docs page. "No coupling touches expected" is a valid and useful statement.

A decision the spec intentionally delegates to the worker should be delegated explicitly:
"choose either approach; record the choice in the task comment."

## For executors — never silently pick

When the spec leaves a decision open, classify it:

**Bridgeable** — the gap is local, both interpretations fit the stated intent, and a wrong
guess is cheap to reverse. Then:
1. Choose the most reversible interpretation (the one that adds the least new surface:
   no new APIs, schemas, or flags beyond what the task requires).
2. State the assumption in a task comment *before or alongside* the work, and repeat it
   in the PR description: "Spec did not state X; assumed Y because Z."

**Unbridgeable** — the ambiguity changes scope, architecture, data models, or user-facing
contracts, or two readings lead to materially different work. Then do not guess: report
the task back for refinement through your outcome tool, naming the specific open decision
and the interpretations you considered. A bounced task is cheap; a confidently wrong
implementation costs a full review-and-redo cycle.

The test between the two: if a reviewer rejecting your interpretation would mean redoing
most of the work, it was unbridgeable.

## Invariant

Every assumption that shaped the implementation appears in the task comments and the PR
description. An assumption that exists only in the agent's reasoning is a silent pick,
regardless of how reasonable it was.
