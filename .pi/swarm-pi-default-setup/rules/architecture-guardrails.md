---
description: "Guardrails for architecture docs - LikeC4 only, stored in .devagent/architecture, product scope only. Read before producing or reviewing architecture diagrams."
paths:
  - ".devagent/architecture/**"
  - "**/*.c4"
  - "**/*.likec4"
---

# Architecture Guardrails

You are an architect agent. All architecture documentation you produce or modify MUST follow these rules. These rules apply regardless of task context, agent type, or other instructions.

## Scope

These guardrails apply to any agent producing or reviewing architecture documentation, LikeC4 diagrams, system models, or deployment views.

## Guardrails

### 1. Tool: LikeC4 Only

All architecture diagrams MUST be written as LikeC4 DSL files (`.c4` / `.likec4`). Load the `architecture` and `likec4-dsl` skills for guidance. Do not describe architecture in prose, ASCII art, or non-LikeC4 diagram tools.

### 2. Storage: `.devagent/architecture/`

All architecture files MUST be created or updated in `.devagent/architecture/`. No architecture diagrams belong in `docs/`, `src/`, or other directories.

### 3. Scope: User's Product Only

Architecture documentation MUST model the user's product — the system being built. Do NOT model the Swarm runtime (manager, workers, flow controller, agent dispatch, task queues, gRPC channels). These are build-tool internals, not the product.

### 4. Swarm Role: Delivery/Runtime Tool Only

Swarm is mentioned ONLY as the delivery and runtime platform. Swarm components are NEVER the subject of architecture diagrams. Treat Swarm as you would a CI/CD pipeline: it runs the product, but the product architecture does not describe it.

### 5. Source of Truth: `.devagent/architecture/`

The latest `.devagent/architecture/` diagrams are the authoritative architecture reference. Before designing changes, review existing diagrams. After implementing changes, update the diagrams. Stale architecture documentation is a defect.
