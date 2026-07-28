---
name: swarm-extension-expert
description: Expert knowledge for the swarm-extension package — the TypeScript Pi runtime layer. Use this when editing swarm-extension code or tests, changing agent-definition parsing (parseAgentFile, FRONTMATTER_FIELDS), model/thinking routing (resolveEffectiveRoute, modelEasy/modelModerate/modelComplex, thinkingEasy/thinkingModerate/thinkingComplex, DEV_SWARM_TASK_DIFFICULTY), or gate-scoped tool resolution (resolveToolsForAgent).
---

# Swarm Extension Expert

## Intent

The swarm-extension package is the Pi runtime layer of the swarm: a TypeScript extension
that Pi loads at session start. It is the odd one out in a Go codebase — it follows
TypeScript conventions, not Go ones, and its correctness is defined by contracts with the
rest of the system rather than by its own internals. It does three things:

1. **Agent-definition parsing and validation** — reads `.pi/agents/*.md`, parses
   frontmatter (`parseAgentFile`), and rejects definitions missing required fields or
   using unknown shapes.
2. **Difficulty-based route resolution** — `resolveEffectiveRoute` picks model and thinking
   for a session from base `model`/`thinking` plus optional `modelEasy` /
   `modelModerate` / `modelComplex` and `thinkingEasy` / `thinkingModerate` /
   `thinkingComplex` overrides, keyed by `DEV_SWARM_TASK_DIFFICULTY`.
3. **Gate-scoped tool resolution** — `resolveToolsForAgent` maps a task's gate (dev,
   refinement, review) to the tool set the agent may use in that session.

## Invariants

- **The frontmatter field set is a two-sided contract.** The fields accepted by the
  TypeScript parser (`FRONTMATTER_FIELDS`) and the Go agent-definition document schema in
  the manager MUST agree. Adding or removing a field on one side only is a defect. Find
  both sides by searching for `FRONTMATTER_FIELDS` (TypeScript) and `modelEasy` (Go).
- **Difficulty route fields are protected runtime configuration.** `modelEasy`,
  `modelModerate`, `modelComplex`, `thinkingEasy`, `thinkingModerate`, and
  `thinkingComplex` are live routing config, never dead code. The full
  contract is in `.pi/rules/agent-definition-fields.md` — read it before touching agent
  definitions or the parser's field handling.
- **Absent override means independent base fallback.** Model routing falls back to `model`;
  thinking routing falls back to `thinking`. Thinking accepts `off`, `minimal`, `low`,
  `medium`, `high`, `xhigh`, and `max`. Runtime verifies exact application after
  `pi.setThinkingLevel()` and fails if Pi clamps the configured value.
- **Every `.pi/agents/*.md` file must parse.** A definition the parser rejects breaks
  agent startup. Parser behavior changes therefore have blast radius over all agent
  definition files, and vice versa.

## Discovery

- Locate the parser and its accepted fields by searching for `parseAgentFile` and
  `FRONTMATTER_FIELDS`; the extension entry point by searching for
  `resolveEffectiveRoute`; tool gating by searching for `resolveToolsForAgent`.
- The package's tests double as executable documentation of the accepted agent-definition
  format — read them before changing parsing or validation behavior.

## Verification

Verify every change through the Docker-backed lane — there is no host Node toolchain:

- `scripts/check-extension` — typechecks the whole package (src, extensions, tests).
- `scripts/test-extension` — runs the package's test suite, including parser validation
  against the agent-definition format.

Both run automatically as blocking pre-commit hooks when swarm-extension files change.
Run them before reporting your outcome; never run npm/node/tsc directly on the host.
