---
description: "Contract for .pi/agents frontmatter fields including difficulty-based model and thinking routes. Read before editing agent definitions or the parser and document schema."
paths:
  - ".pi/agents/**"
  - "src/swarm-extension/src/parser.ts"
  - "src/manager/agentdefinitions/**"
---

# Agent Definition Fields — Protected Frontmatter Contract

This file defines the contract for `.pi/agents/*.md` frontmatter fields. All agents (worker, architect, lead-dev) MUST respect this contract when reading or modifying any agent definition file.

## Source of Truth

The canonical frontmatter field set is defined in two places that MUST agree:

| Layer | Location | Fields |
|---|---|---|
| Pi runtime (TypeScript) | `src/swarm-extension/src/parser.ts` → `FRONTMATTER_FIELDS` | `name`, `description`, `model`, `modelEasy`, `modelModerate`, `modelComplex`, `thinking`, `thinkingEasy`, `thinkingModerate`, `thinkingComplex`, `tools`, `skills`, `systemPromptMode` |
| Backend (Go) | `src/manager/agentdefinitions/document.go` | Top-level model and thinking scalars plus swarm metadata |

## Required Fields (MUST be present)

| Field | Purpose |
|---|---|
| `name` | Agent identifier matching the filename (e.g., `swarm-worker`) |
| `description` | Human-readable description |
| `model` | Default model reference in `provider/model` form |
| `tools` | Gate-keyed tool map (`dev`, `refinement`, `review`) |
| `skills` | Comma-separated skill list |
| `systemPromptMode` | `append` or `replace` |

## Optional Fields — Runtime Critical

These fields are **optional** (absent route = corresponding base-field fallback), but **removing them silently changes runtime behavior**.

| Field | When it activates | Runtime effect |
|---|---|---|
| `modelEasy` | `DEV_SWARM_TASK_DIFFICULTY=Easy` | Overrides the model for easy-difficulty tasks |
| `modelModerate` | `DEV_SWARM_TASK_DIFFICULTY=Moderate` | Overrides the model for moderate-difficulty tasks |
| `modelComplex` | `DEV_SWARM_TASK_DIFFICULTY=Complex` | Overrides the model for complex-difficulty tasks |
| `thinking` | Always (if present) | Base thinking level (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`) |
| `thinkingEasy` | `DEV_SWARM_TASK_DIFFICULTY=Easy` | Overrides base thinking for easy tasks |
| `thinkingModerate` | `DEV_SWARM_TASK_DIFFICULTY=Moderate` | Overrides base thinking for moderate tasks |
| `thinkingComplex` | `DEV_SWARM_TASK_DIFFICULTY=Complex` | Overrides base thinking for complex tasks |

### Routing Logic

The function `resolveEffectiveRoute` in `src/swarm-extension/extensions/index.ts` resolves both values from one validated difficulty:

```
If DEV_SWARM_TASK_DIFFICULTY is absent → { model, thinking }
If difficulty is "Easy"               → { modelEasy ?? model, thinkingEasy ?? thinking }
If difficulty is "Moderate"           → { modelModerate ?? model, thinkingModerate ?? thinking }
If difficulty is "Complex"            → { modelComplex ?? model, thinkingComplex ?? thinking }
```

A thinking override is valid without a matching model override. When no base or routed thinking value exists, runtime leaves Pi's current/default level unchanged. After model activation, runtime applies configured thinking and fails startup if `pi.getThinkingLevel()` differs, rather than accepting Pi's clamp silently.

Removing a difficulty field restores its independent base `model` or `thinking` fallback. **This changes which model or thinking level executes the task.**

## Hard Rules

### Rule 1: DO NOT remove difficulty route fields

The fields `modelEasy`, `modelModerate`, `modelComplex`, `thinkingEasy`, `thinkingModerate`, and `thinkingComplex` are **never dead code, never stale config, and never cruft to be cleaned up**. Even when they match the corresponding base value, they express explicit intent about difficulty-based routing and serve as documentation for operators.

**A change that removes, clears, or comments out any of these fields is a breaking change and is forbidden UNLESS the task explicitly asks to change route configuration.**

### Rule 2: When in doubt, preserve

If you are modifying an agent definition file for an unrelated purpose (e.g., updating skills, tools, description, or swarm metadata) and you are uncertain whether a frontmatter field is needed — **preserve it**. Do not strip fields you don't understand. The runtime depends on them.

### Rule 3: Table formatting is not a reason to rewrite

When viewing or editing agent definition files, do not reformat content outside the scope of your change. The agent definition markdown body is not a documentation page — it is a runtime asset consumed character-by-character as a system prompt. Unnecessary reformatting creates noise and risks accidental field alteration.

### Rule 4: Changes to these files MUST be explicit in the PR description

Any PR that modifies `.pi/agents/*.md` files MUST describe exactly which fields changed and why. A commit message like "chore: commit task artifacts" that silently drops difficulty route fields is a defect.

## Validation

The swarm extension (`src/swarm-extension/src/parser.ts`) validates that required fields are present on startup. However, it does NOT validate that optional fields are preserved — removal is a silent behavioral change. The guard against accidental removal is this rule file.
