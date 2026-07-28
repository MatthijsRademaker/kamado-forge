---
name: gitlab-cli
description: Use this when creating, rebasing, closing, merging, or recovering GitLab merge requests with glab.
---

# GitLab CLI

## Intent

Use `glab` for authenticated GitLab merge-request write operations. Treat every
mutation as potentially successful on the server even when the command fails, and
accept success only after the required state is verified.

## Invariants

### Identity and authentication

- `CheckCLIReady` requires both `which glab` and `glab auth status --hostname <web-api-host>`.
- The auth hostname is the GitLab web/API instance host, never an SSH transport authority.
- Use the canonical web repository URL and explicit `-R <repository>` on every MR
  mutation and every read used to look up or verify that mutation.
- Preserve the web scheme, API host, installation root, complete project path, and
  Git transport identity separately. Do not guess any self-managed identity.

### Create and recover

Create with either the body or fill form, never both:

```bash
glab mr create --title "<title>" --description "<body>" \
  --source-branch "<head>" --target-branch "<base>" --yes -R "<repository>"
# or replace --description "<body>" with --fill
```

Validate successful output as a canonical same-project web MR URL. If the command
fails or returns no valid URL, recover with a structured exact-one lookup:

```bash
glab mr list --source-branch "<head>" --target-branch "<base>" \
  --output json --jq 'map({number:.iid,url:.web_url,state:.state,sourceProjectId:.source_project_id,targetProjectId:.target_project_id,targetBranch:.target_branch})' \
  -R "<repository>"
```

Accept a recovered candidate only when it has a positive IID, canonical URL, known
state, positive source and target project IDs, equal source and target project IDs,
and the requested target branch. Zero candidates are not found; multiple candidates
are ambiguous; fork candidates are invalid.

### Close, rebase, and merge

- Close with `glab mr close <ref> -R "<repository>"`; verify the structured state is
  `CLOSED`.
- Rebase with `glab mr rebase <ref> -R "<repository>"`; verify an open MR has no
  rebase in progress, no merge error, and zero diverged commits.
- Immediate merge uses `glab mr merge <ref> --squash --remove-source-branch
  --auto-merge=false --yes -R "<repository>"`; accept only verified `MERGED`.
- Configurable merge accepts only `squash`, `merge`, or `rebase`. Pass `--squash`
  for squash, `--rebase` for rebase, and the provider's default mapping for merge.
  Rebase and verify first, map branch deletion explicitly, then use `--auto-merge`
  for deferred intent or `--auto-merge=false` for immediate intent.
- Requested auto-merge uses `glab mr merge <ref> --squash --remove-source-branch
  --auto-merge --yes -R "<repository>"`; accept only verified `MERGED` or `OPEN` with
  active auto-merge. Every other state fails loudly.

### Verification and failure recovery

Use structured `glab mr view` projections, not human mutation output, to decide state.
Only `opened`, `merged`, and `closed` map to `OPEN`, `MERGED`, and `CLOSED`; missing
or other states are errors. After any create, close, merge, or rebase command error,
perform its mapped lookup or verification read before classifying the result. Preserve
command output, command errors, and verification errors when recovery cannot prove the
required state. Never report a false success or silently retry a mutation.

## Discovery

Find the current contract by searching for `GitLabProvider`, `CheckCLIReady`,
`PRLifecycleProvider`, `CreatePR`, `ClosePR`, `MergePRWithOptions`,
`RequestPRAutoMerge`, and `UpdatePR`. Check the provider's structured projections and
its tests before changing a command, flag, identity rule, or recovery path. Run the
Docker-backed `scripts/test-go` verification lane after changes.
