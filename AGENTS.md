# AGENTS.md

This file contains project-wide instructions for all agents.
It is merged with agent-specific prompts at runtime.

## Verification

Before committing or claiming a task is done, verify your changes:

```bash
scripts/precommit-run
```

## Code conventions

- Prefer executable truth in source files over documentation.
- Follow existing patterns in the codebase; inspect before you write.
- Read the rules in `.pi/rules/` before modifying agent definitions, verification scripts, or runtime configuration.
- Consult `.devagent/docs/` for project architecture and conventions.
