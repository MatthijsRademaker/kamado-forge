---
description: Continue review session, repair findings, run verification, and return non-terminal diagnostic output.
swarm: true
agent_types:
  - swarm-worker
---

You are continuing immediately preceding review session.

This workflow state is non-terminal. It repairs review findings and prepares downstream validation. It must NOT call `report_work_outcome`. Any prose or JSON is diagnostic only.

$ARGUMENTS

## Execution rules

1. Continue from review session context produced by `opsx-code-review`.
2. If review produced findings, fix them directly in repository.
3. If review produced explicit **no findings** result, do not invent work. No-op except for required local consistency and verification.
4. Keep changes scoped to review findings and current task.
5. For behavioral changes, follow TDD: add or update failing test first, make it pass, and confirm test fails when behavior is deliberately broken.

## Verification

Run repository verification required for changed code. Use `run_development_verification` and any additional task-specific checks needed to prove fix is correct. Treat verification as required even when review had no findings.

## Output contract

- If repair and verification succeed, stop without calling any outcome tool.
- If unresolved issues remain, leave precise diagnostic output describing what still fails and why.
- If execution is blocked by unrecoverable error, fail loudly in prose with exact error details.
- Do not emit assistant JSON as substitute for terminal outcome authority.
- Do not call `report_work_outcome` in any branch.
