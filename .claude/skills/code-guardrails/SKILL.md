---
name: code-guardrails
description: Use this when configuring code-quality guardrails for an existing or scaffolded project. Covers Docker-backed verification scripts, pre-commit integration, formatter/linter/typecheck/dead-code tooling, build/test/check commands, version-pinning support files, bounded validation, and fail-loud behavior. Use during Code Guardrails onboarding. Does not create product features or initial project skeletons.
---

# Code Guardrails

## Boundary

This skill owns verification infrastructure only. It runs after stack intake/scaffold.

Use when:

- Code Guardrails onboarding step is active.
- Repository needs Docker-backed `scripts/check`, `scripts/test`, `scripts/build`.
- Repository needs `.pre-commit-config.yaml`, `scripts/install-hooks`, `scripts/precommit-run`, or version-pinning support files.
- Formatter, linter, typecheck, dead-code, test, or build commands need wiring into bounded scripts.

Do not use when:

- Repository needs initial skeleton only. Use `greenfield-project-setup`.
- User asks for product features, demo pages, business logic, routes, or domain code.
- You cannot validate required commands; fail loudly instead of reporting success.

## Required Behavior

1. Inspect existing conventions first.
   - Manifests: `go.mod`, `package.json`, `Cargo.toml`, `pyproject.toml`, etc.
   - Existing `scripts/`, `.pre-commit-config.yaml`, CI files, Makefile, Dockerfile.
   - Existing formatter/linter/typecheck/test/build commands.

2. Extend, do not replace, brownfield conventions.
   - Keep existing working commands when possible.
   - Add missing bounded behavior via scripts.
   - Avoid wholesale rewrites of established tooling.

3. Configure Docker-backed verification.
   - `scripts/check`: formatting/lint/typecheck/dead-code where supported.
   - `scripts/test`: test suite or explicit no-tests success for true greenfield skeletons.
   - `scripts/build`: build/typecheck/syntax validation appropriate to stack.
   - Scripts must not require host SDKs.
   - Pin images/tool versions in `scripts/.versions` or equivalent support file when needed.

4. Configure pre-commit.
   - `.pre-commit-config.yaml` calls repository scripts.
   - `scripts/install-hooks` installs hooks.
   - `scripts/precommit-run` runs hooks reproducibly, preferably Docker-backed.

5. Validate before completion.
   - Run `scripts/check`.
   - Run `scripts/test`.
   - Run `scripts/build`.
   - Run `scripts/precommit-run --all-files` when practical.
   - If any required command fails, surface failure and leave step incomplete.

## Stack Guidance

### Go

- Format: `gofmt`/`go fmt`.
- Static checks: `go vet`, `golangci-lint` when accepted by repo.
- Typecheck/build: `go test ./...`, `go build ./...`.
- Dead code: `golangci-lint` `unused`/`deadcode`-class checks where supported.

### Node.js / TypeScript

- Format: Prettier or existing formatter.
- Lint: ESLint or existing linter.
- Typecheck: `tsc --noEmit` for TypeScript.
- Dead code: `knip`, `ts-prune`, or established repo tool where appropriate.
- Build/test: package-manager scripts through Docker.

### Python

- Format/lint: Ruff preferred unless repo already uses Black/Flake8/isort.
- Typecheck: mypy/pyright when repo uses typing or user wants it.
- Dead code: vulture where appropriate.
- Build/test: pytest/build/compileall per repo shape.

### Rust

- Format: `cargo fmt --check`.
- Lint/dead code: `cargo clippy -- -D warnings`.
- Test/build: `cargo test`, `cargo build`.

## Failure Rules

- Do not hide missing Docker, failing commands, unsupported stack decisions, or broken hooks.
- Do not replace failure with warning if requirement says guardrail must exist.
- Do not claim completion until required scripts pass.
- Do not implement product behavior to make tests pass.
