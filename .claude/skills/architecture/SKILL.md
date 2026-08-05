---
name: architecture
description: Architecture practice rules for architect agents. Covers LikeC4 as the required diagramming tool, `.devagent/architecture/` as the storage location, product-first modeling scope, Swarm-as-tool constraint, and source-of-truth policy. Use this when creating or reviewing architecture documentation, system diagrams, or LikeC4 model files.
---

# Architecture Practice

This skill defines the architecture practice rules that all architect agents must follow. It covers tool choice, storage location, modeling scope, and source-of-truth policy — the *what and where to model*, not *how to write LikeC4 syntax* (see the `likec4-dsl` skill for DSL syntax, CLI commands, and validation).

## Rules

### 1. LikeC4 is the required diagramming tool

All architecture diagrams MUST be written in LikeC4 DSL (`.c4` / `.likec4` files). Do not describe architecture in prose-only or use ad-hoc ASCII diagrams, Mermaid, PlantUML, or other tools for structural documentation.

Load the `likec4-dsl` skill for LikeC4 DSL syntax, CLI commands, validation workflows, and reference material. This skill does NOT duplicate that content.

### 2. Diagrams are stored in `.devagent/architecture/`

All architecture model files, specifications, views, and deployment diagrams MUST be created or updated in `.devagent/architecture/`. This is the single, canonical location for architecture documentation.

Do not create LikeC4 files or architecture diagrams in other directories (e.g., `docs/`, `src/`, or temporary locations).

### 3. Model the user's product, not the Swarm runtime

The subject of architecture documentation is the **user's product** — the system being built by the development team. Architecture diagrams describe the user's system components, boundaries, data flows, and deployment topology.

Do NOT model the Swarm runtime internals (manager, workers, flow controller, agent dispatch, task queues, gRPC channels). These are implementation details of the development toolchain, not the product being delivered.

### 4. Swarm is the delivery/runtime tool only

Swarm is mentioned only as the delivery and runtime tool — the platform the team uses to build and deploy the product. Swarm components are NEVER the subject of architecture diagrams. Think of Swarm as analogous to a CI/CD pipeline: it builds and runs the product, but the product's architecture documentation does not describe the CI/CD system.

### 5. Source of truth: `.devagent/architecture/` diagrams

The latest `.devagent/architecture/` diagrams are the source of truth for the current system architecture. Before designing changes, review the existing diagrams to understand the current state. After implementing changes, update the diagrams to reflect the new state.

Architecture documentation must stay accurate and current — stale diagrams are worse than no diagrams.

### 6. Generated views must be wired into docs

Generated LikeC4 views MUST be referenced in `.devagent/docs/docs/architecture.mdx`. After creating or modifying C4 files, update `architecture.mdx` so its `<likec4-view>` embeds use the actual view IDs from `.devagent/architecture/views/`, then verify the docs build passes.

## Skill Boundaries

- **DO** load the `likec4-dsl` skill for LikeC4 DSL syntax, CLI commands, validation, and reference material
- **DO NOT** duplicate LikeC4 DSL syntax, CLI commands, validation workflows, or reference material here
- **DO NOT** add project setup instructions, file templates, or diagram examples — those belong in the project's actual `.devagent/architecture/` files
