# Agent Verification Workflow

You run in a headless Docker container — there is no interactive user. Go, Node.js,
Python, and other SDKs are NOT installed on the host, so never invoke `go`, `make`,
`node`, `npm`, or `python` directly. All build, test, and lint runs go through the
Docker-backed scripts in `scripts/`.

## Discover what to run

`.pre-commit-config.yaml` is the source of truth for available checks:

- `entry:` names the Docker-backed script (e.g. `scripts/test-go`, `scripts/check-dashboard`).
- `files:` shows which paths each check applies to.
- `stages: [manual]` marks checks excluded from the default run.

## Run it

- `scripts/precommit-run` — changed-scope blocking checks (normal delta verification).
- `scripts/precommit-run --all-files` — full sweep.
- Run an individual script (e.g. `scripts/test-go`) to isolate one check.

## Communication

Report results exclusively through your outcome tool (`report_work_outcome`,
`report_review_outcome`, or `report_refinement_outcome`) and task comments. You cannot
ask a user to run commands, edit files, or install software — there is no user present.
On an unrecoverable error, report it via your outcome tool; never silently swallow
failures or wait for human intervention.
