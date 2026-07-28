---
description: "Placement and packaging rules for the three Pi extension layers. Read before adding or moving extension tools."
paths:
  - "src/swarm-extension/**"
  - ".pi/extensions/**"
  - "src/docker/pi/extensions/**"
---

# Pi Extension Rules

Swarm has three Pi extension layers. Keep source and packaging aligned.

## Extension placement

- **Shared package:** `src/swarm-extension/`, loaded from `.pi/settings.json`.
  Owns agent parsing, model routing, and tool scoping.
- **Image-global infrastructure:** `src/docker/pi/extensions/`, copied to
  `/home/devuser/.pi/agent/extensions/`. Used only in agent containers.
- **Project-scoped extension:** `.pi/swarm-pi-default-setup/extensions/`,
  materialized into `.pi/extensions/`. Must work in host and external projects.

Do not put image-global infrastructure in `.pi/extensions/`. Add its `COPY` to
`src/Dockerfile` instead. Do not put project-scoped extensions only under
`src/docker/pi/extensions/`.

## Adding extension tools

1. Choose placement from runtime requirements before writing code.
2. Keep one canonical source file for each extension.
3. For image-global extensions, add a Dockerfile copy and image-build smoke check.
4. For project-scoped extensions, update the scaffold source, materialized tree,
   and `src/cli/scaffolding/pi/defaults/`; parity tests must pass.
5. Add each tool name to agent-definition `tools:` frontmatter. This field scopes
   registered tools; it does not install or register extensions.
6. If registration depends on an environment variable, test enabled and disabled
   paths.
7. Update developer docs when extension placement or launch behavior changes.

Pi launches each agent as an independent process. A source file in the repository
is not enough: Pi must discover it in the target extension path, the image must
contain image-global extensions, and registration must happen before
`setActiveTools` scopes the agent.
