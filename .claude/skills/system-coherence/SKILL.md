---
name: system-coherence
description: Cross-boundary coupling map for this repository — the contracts no compiler enforces. Use this when a change touches shared Go types, proto files, the manager API surface, agent definitions, verification config, or docs/architecture, when work spans more than one subsystem, and always before reporting a task done.
---

# System Coherence

## Intent

This repository is one system expressed in several languages and artifact trees: a Go
backend, a Vue dashboard, a TypeScript Pi extension, agent definitions, docs, and
architecture models. Several contracts between them are enforced by nothing but
discipline. Drift happens when a change lands on one side of a contract and the other
side is never touched. This skill enumerates those contracts as invariants with check
procedures. It exists so that "done" means the whole picture is intact, not just the file
you edited.

## Coupling map — invariants and checks

**1. Proto definitions ↔ generated Go code.**
Invariant: generated code under the shared `gen` package matches the `.proto` sources.
Check: after editing any `.proto` file, run `scripts/generate-proto` and commit the
regenerated output. Never hand-edit generated files (marked with a generated-code header).

**2. Manager HTTP API ↔ dashboard client.**
Invariant: the dashboard's API client is generated from the manager's OpenAPI document;
it must be regenerated when the manager API surface changes.
Check: after changing manager API handlers, request/response types, or routes, regenerate
via the dashboard package's `generate:api` npm script (through the Docker lane, e.g.
`scripts/check-dashboard` catches type breakage). Hand-written interfaces in the older
dashboard API client must be updated to agree — find them by searching the dashboard for
the changed type name.

**3. Agent-definition frontmatter: TypeScript ↔ Go.**
Invariant: the field set accepted by the Pi extension (`FRONTMATTER_FIELDS` in the
swarm-extension parser) and the Go agent-definition document schema (the agent-definitions
document type in the manager) MUST agree.
Check: when adding or removing a frontmatter field, search for `FRONTMATTER_FIELDS` and
for the Go document schema (search for `modelEasy` on the Go side) and change both.
The protected-field rules in `.pi/rules/agent-definition-fields.md` apply.

**4. Agent definitions ↔ extension runtime.**
Invariant: every `.pi/agents/*.md` file must parse and validate against the extension's
parser (`parseAgentFile`) — required fields present, gate-keyed `tools`, known skills.
Check: run `scripts/test-extension` (the parser tests exercise validation), and keep
`.pi/rules/agent-definition-fields.md` satisfied.

**5. Code behavior ↔ `.devagent/docs/`.**
Invariant: documented behavior describes current code. Stale docs are a defect.
Check: when a change alters behavior that is documented (agent types, runtime model,
interfaces, contracts, directory layout), update the affected page under
`.devagent/docs/` in the same change (the docs-writer skill covers how).

**6. System structure ↔ `.devagent/architecture/`.**
Invariant: LikeC4 models reflect the current structure of the product.
Check: when a change adds, removes, or re-wires a component or dependency that appears in
the architecture models, update the `.c4` files in the same change.

**7. Skills ↔ code identifiers.**
Invariant: identifiers referenced by any `SKILL.md` exist in the codebase.
Check: renaming or moving a referenced identifier updates the skill in the same change
(see `.pi/rules/skill-authoring.md`).

## Search before build

Assume the mechanism you need already exists. This codebase already has mechanisms for
task comments, event emission, status transitions, gate hooks, persistence access,
verification, and artifact capture. Before writing a new one:

1. Name the concept, then search for it by likely identifier and by concept keyword.
2. Read how existing callers use the mechanism you find.
3. Extend or reuse it. Build new only after the search comes up genuinely empty — and say
   so in your task comment ("searched for X and Y; no existing mechanism").

A second implementation of an existing mechanism is drift, even when it works.

## Done-sweep — before reporting your outcome

Before calling your outcome tool, walk the coupling map:

1. List which numbered edges above your change touched.
2. For each touched edge, run its check (regenerate, search the counterpart, update the
   artifact).
3. State the swept edges in your task comment — "touched edges 2 and 5; regenerated the
   dashboard client, updated the manager docs page" — so reviewers can verify the sweep
   instead of reconstructing it.

If no edges were touched, say that explicitly. An unstated sweep is indistinguishable
from a skipped one.
