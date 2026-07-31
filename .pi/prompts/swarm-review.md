---
description: review current task through specialist focus
swarm: true
agent_types:
  - swarm-architect
  - swarm-lead-dev
  - swarm-reviewer
---

Review current task. Run `swarm-agent task review-context --json` before grading.

## Common contract

## Diff scope authority

- Review scope is the merge-base three-dot comparison `<base_sha>...HEAD`. Run `git diff <base_sha>...HEAD` using dossier `git.base_ref` and `git.base_sha`.
- Reconcile prior durable feedback against current diff and files. Do not repeat stale, resolved, superseded, contradicted, or out-of-scope feedback without fresh evidence.
- Dossier `git.base_sha`, `git.changed_files`, and `git.diff_summary` are authoritative; dossier wins. Never compute review scope with a two-dot comparison such as `git diff origin/main..HEAD`.
- Use `gh pr view <number> --json mergeable,mergeStateStatus` for merge state when dossier supplies PR number.
- Never infer merge or integration state from a diff.
- Check every task requirement. Grade at or above `DEV_SWARM_REVIEW_THRESHOLD` only when every requirement is satisfied or not applicable and no blocking evidence remains.
- Return exactly one JSON object. Do not include `outcome`; terminal outcome authority is `report_review_outcome` with grade only, exactly once.

```json
{
  "feedback": "one or two sentence verdict",
  "requirements_checked": [
    {
      "requirement": "task requirement",
      "status": "satisfied|not_satisfied|not_applicable",
      "evidence": "current diff or inspected-file evidence"
    }
  ],
  "issues": [
    {
      "severity": "info|warning|critical",
      "file": "path/to/file",
      "line": 42,
      "category": "security|quality|style|logic|test|alignment|performance",
      "description": "specific defect or risk",
      "suggestion": "concrete correction"
    }
  ]
}
```

- Include exactly one concise requirement record for every stated task requirement.
- Include at most five root-cause issue records. Group related manifestations and name every affected location.
- Every issue needs severity, file, line, category, description, and concrete suggestion. Never omit critical or blocking concerns. Information-only observations do not lower grade.

## Specialist focus

Read `DEV_SWARM_AGENT_DEF_ID` before analysis:

- `swarm-architect`: assess boundaries and dependency direction.
- `swarm-lead-dev`: assess implementation strategy and maintainability.
- `swarm-reviewer`: assess correctness, security, coverage, and merge readiness.
- Any other value: fail loudly. Do not report grade.

Apply selected focus only after common dossier and diff reconciliation.
