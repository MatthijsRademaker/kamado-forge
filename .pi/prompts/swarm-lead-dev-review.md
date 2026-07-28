---
description: review implementation direction and advise on approach
swarm: true
agent_types:
  - swarm-lead-dev
---

Review implementation direction and provide actionable technical guidance.

## Scope Discipline

- Treat current task prompt, task ID, review-context dossier from `swarm-agent task review-context --json`, and current branch/PR diff as complete review scope.
- Do not pull in unrelated tasks, experiments, evaluations, historical repo work, or broader process concerns unless directly needed to assess this task.
- Ground every concern, recommendation, and verdict in current task requirements, review-context dossier, diff, or repository files inspected specifically for this task.
- If observation cannot be tied back to this task, exclude it from verdict.

## Required review-context dossier

1. Run `swarm-agent task review-context --json` before grading review work.
2. Treat dossier as shared durable evidence: task metadata, durable comments, git/PR facts, feedback ledger, and warnings.
3. Reconcile prior durable feedback against current diff and inspected files before repeating or escalating it.
4. Do not re-block on stale, already-addressed, superseded, contradicted, or out-of-scope historical feedback without fresh evidence.
5. If dossier includes warnings, note limitation and continue with current task/code evidence.

## Diff scope authority

1. Review scope is the merge-base three-dot comparison `<base_sha>...HEAD`, using dossier `git.base_ref` and `git.base_sha`. Run `git diff <base_sha>...HEAD` literally with the dossier-resolved base; dossier `git.changed_files` and `git.diff_summary` are supporting evidence.
2. Never compute review scope with a two-dot comparison such as `git diff origin/main..HEAD`. Against a moving base, a two-dot diff reports commits already merged into the base as changes on this branch, manufacturing false scope bleed, false deletions, and false unrelated-file findings.
3. When any source disagrees with dossier `git` facts, dossier wins. Re-read `git.changed_files` and reconcile before reporting.
4. Never infer merge or integration state from a diff. Read it only from `gh pr view <number> --json mergeable,mergeStateStatus`.
5. Before reporting any scope, size, or unrelated-change finding, cite `git.diff_summary` and the specific `git.changed_files` entries that support it.

Responsibilities:

- Evaluate proposed or implemented approach for correctness and maintainability
- Identify risks, edge cases, and missing considerations
- Recommend specific technical improvements
- Reference relevant code patterns, conventions, and libraries from codebase

Review process:

1. Run `swarm-agent task review-context --json` and understand task context from prompt plus dossier.
2. Inspect codebase for relevant conventions and patterns.
3. Use dossier feedback ledger to identify prior technical concerns that need fresh verification against current code.
4. Assess implementation plan or result.
5. Produce structured output.

Output format (MUST use this exact structure):

```json
{
  "summary": "concise assessment of approach",
  "risks": ["risk one", "risk two"],
  "recommendations": ["specific suggestion one", "specific suggestion two"],
  "references": ["relevant files or docs"]
}
```

- Do not include `outcome` property in JSON output; binary review outcome is derived by runtime from tool grade as `approved` or `needs_work`.
- Grade at or above `DEV_SWARM_REVIEW_THRESHOLD` when approach is sound and no fresh blocking evidence remains after prior-feedback reconciliation; runtime derives `approved`.
- Grade below `DEV_SWARM_REVIEW_THRESHOLD` when changes to approach are required; runtime derives `needs_work`.
- After producing review output, call `report_review_outcome` tool with `grade` only, exactly once. This writes terminal outcome artifact required by swarm runtime.
- Assistant JSON is review evidence only; it is never terminal outcome authority.
