---
name: greenfield-project-setup
description: Use this when setting up a greenfield project skeleton from scratch. Covers stack selection, minimal manifests, directory layout, minimal entrypoints required for structural validity, and stack-appropriate .gitignore. Use during Tech Stack Intake & Scaffold onboarding when repository is empty or near-empty. Does not cover verification scripts, formatters/linters/typecheck, dead-code tooling, pre-commit hooks, or CI guardrails.
---

# Greenfield Project Setup

## Boundary

This skill is scaffold-only. Produce smallest viable project structure for selected stack.

Use when:

- Repository is empty or near-empty.
- Tech Stack Intake & Scaffold onboarding needs minimal structure.
- User selected or confirmed primary stack.

Do not use when:

- Repository already has functional stack structure.
- Task is verification, lint, format, typecheck, dead-code, Docker-backed scripts, pre-commit, CI, hooks, or build hardening. Use `code-guardrails` instead.
- User asks for product features, demo routes, domain logic, sample UI, or business behavior.

## Rules

- Inspect first: README, AGENTS.md, existing files, package manifests, docs.
- Ask if stack choice is ambiguous.
- Create only structural files: manifests, directories, minimal entrypoint only when required by stack, `.gitignore`.
- Prefer one primary stack. Do not invent monorepo complexity.
- Do not configure `.pre-commit-config.yaml`, `scripts/check`, `scripts/test`, `scripts/build`, `scripts/install-hooks`, `scripts/precommit-run`, formatter/linter/typecheck/dead-code tooling, or CI.
- Do not run broad verification beyond lightweight syntax/init checks needed to confirm files are valid.

## Supported Skeletons

### Go

```bash
go mod init <module-name>
mkdir -p cmd/<binary-name> internal
```

`cmd/<binary-name>/main.go`:

```go
package main

func main() {}
```

### Node.js / TypeScript

```bash
npm init -y
mkdir -p src
```

`src/index.ts`:

```typescript
export {};
```

`tsconfig.json` when TypeScript selected:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### Python

```bash
mkdir -p src
```

`pyproject.toml`:

```toml
[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.build_meta"

[project]
name = "<project-name>"
version = "0.0.0"
requires-python = ">=3.11"

[tool.setuptools.packages.find]
where = ["src"]
```

`src/__init__.py`:

```python
"""Project package."""
```

### Rust

```bash
cargo init --name <project-name>
```

Use Cargo default `src/main.rs` or `src/lib.rs`.

## `.gitignore` Additions

Add the universal block plus the selected stack's block:

```gitignore
# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```

- Go: `bin/`, `*.exe`, `*.test`, `*.out`, `vendor/`
- Node.js: `node_modules/`, `dist/`, `*.tsbuildinfo`, `.env`, `.env.local`, `.env.*.local`
- Python: `__pycache__/`, `*.py[cod]`, `.venv/`, `venv/`, `*.egg-info/`, `dist/`, `build/`
- Rust: `target/`

## Completion Criteria

- Stack is confirmed.
- Minimal manifests/directories/entrypoints exist for selected stack.
- `.gitignore` contains stack-appropriate structural ignores.
- No guardrail tooling, hooks, CI hardening, or product features created.
