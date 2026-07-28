---
description: review a pull request and provide a merge recommendation
swarm: true
agent_types:
  - swarm-reviewer
---

Review current task pull request and produce merge recommendation.

## Scope Discipline

- Treat current task prompt, task ID, review-context dossier from `swarm-agent task review-context --json`, and current branch/PR diff as complete review scope.
- Do not pull in unrelated tasks, experiments, evaluations, historical repo work, or broader backlog/process concerns unless directly needed to assess this task.
- Ground every finding and verdict in current task requirements, review-context dossier, diff, PR metadata, or repository files inspected specifically for this review.
- If observation cannot be tied back to this task, exclude it from verdict.

## Required review-context dossier

1. Run `swarm-agent task review-context --json` before grading.
2. Treat dossier as shared durable evidence: task metadata, durable comments from all authors/sources, current git/PR facts, reconciliation ledger, and warnings.
3. Reconcile each substantive prior feedback item against current diff and inspected files before deciding whether it still blocks.
4. Do not re-block on stale, already-addressed, superseded, contradicted, or out-of-scope historical feedback without fresh current evidence.
5. If dossier includes warnings, note limitation and continue with current task/code evidence.

## Diff scope authority

1. Review scope is the merge-base three-dot comparison `<base_sha>...HEAD`, using dossier `git.base_ref` and `git.base_sha`. Run `git diff <base_sha>...HEAD` literally with the dossier-resolved base; dossier `git.changed_files` and `git.diff_summary` are supporting evidence.
2. Never compute review scope with a two-dot comparison such as `git diff origin/main..HEAD`. Against a moving base, a two-dot diff reports commits already merged into the base as changes on this branch, manufacturing false scope bleed, false deletions, and false unrelated-file findings.
3. When any source disagrees with dossier `git` facts, dossier wins. Re-read `git.changed_files` and reconcile before reporting.
4. Never infer merge or integration state from a diff. Read it only from `gh pr view <number> --json mergeable,mergeStateStatus`.
5. Before reporting any scope, size, or unrelated-change finding, cite `git.diff_summary` and the specific `git.changed_files` entries that support it.

## Pre-review checks

1. Run `swarm-agent task review-context --json` and read returned dossier.
2. Extract PR number from dossier `pr.number` or `task.pr_url` when available.
3. Check merge status with `gh pr view <number> --json mergeable,mergeStateStatus` when PR number is available.
   - If `mergeable` is `CONFLICTING` or `mergeStateStatus` contains `dirty` or `conflicting`:
     record specific conflict state, grade below `DEV_SWARM_REVIEW_THRESHOLD`, and do NOT approve.
4. Run `git diff <base_sha>...HEAD` using the dossier's `git.base_sha` when reviewing the current branch. Do not retrieve review scope with a provider CLI diff command.

## Review criteria

- **Correctness**: Does code correctly implement task requirements?
- **Security**: Any security vulnerabilities, exposed secrets, or unsafe patterns?
- **Maintainability**: Does code follow existing conventions and patterns?
- **Completeness**: Are tests included? Are edge cases handled?
- **Conflicts**: Are merge conflicts present?
- **Feedback reconciliation**: Do prior durable comments remain valid against current code?

## Review process

1. Understand task context from prompt and review-context dossier.
2. Extract every stated requirement, acceptance criterion, and user-facing goal from task description.
3. Use dossier to identify prior durable feedback, repeated concerns, contradictions, and limitations before diff inspection.
4. Inspect the current branch with the dossier-backed `git diff <base_sha>...HEAD` comparison; use dossier `git.changed_files` and `git.diff_summary` as supporting evidence.
5. Map each requirement to current changes. For each requirement, locate specific code or behavior that satisfies it.
6. Examine changed files for quality, security, and style issues.
7. Re-check merge conflicts via `gh pr view --json mergeable,mergeStateStatus` when PR exists.
8. Populate `requirements_checked` array — one entry per requirement.
9. Produce JSON output. Runtime persists review evidence and task comments; do not post GitHub PR comments from this prompt.

## Output format (MUST use this exact structure)

Your ENTIRE response must be single valid JSON object. Do not write text before or after JSON. Do not use markdown fences. Do not include commentary, explanations, or summaries outside JSON.

```json
{
  "feedback": "summary of review assessment",
  "requirements_checked": [
    {
      "requirement": "requirement text from task",
      "status": "satisfied|not_satisfied|not_applicable",
      "evidence": "file path and brief explanation of how this requirement is met or why it is not"
    }
  ],
  "issues": [
    {
      "severity": "info|warning|critical",
      "file": "path/to/file.go",
      "line": 42,
      "category": "security|quality|style|logic|test|alignment|performance",
      "description": "description of issue",
      "suggestion": "how to fix issue"
    }
  ]
}
```

- JSON output must not include `outcome` property; binary review outcome is derived by runtime from tool grade as `approved` or `needs_work`.
- Grade at or above `DEV_SWARM_REVIEW_THRESHOLD` only when every stated requirement has `status: "satisfied"` or `"not_applicable"` and no fresh blocking evidence remains from prior feedback reconciliation; runtime derives `approved`.
- Use grade below `DEV_SWARM_REVIEW_THRESHOLD` when changes are required before merging; runtime derives `needs_work`.
- Merge conflicts always require below-threshold grade with severity `critical`.
- Always include both `requirements_checked` array and `issues` array, even if empty.
- After producing review output, call `report_review_outcome` tool with `grade` only, exactly once. This writes terminal outcome artifact required by swarm runtime.
- Assistant JSON is review evidence only; it is never terminal outcome authority.
