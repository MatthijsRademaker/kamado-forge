# Swarm extensions

This directory contains project-scoped Pi extensions.

Infrastructure extensions (`outcome-tools.ts` and `room-tools.ts`) are baked into the Docker image at `/home/devuser/.pi/agent/extensions/` and are not stored in the workspace. See `.pi/rules/pi-extensions.md` for placement and packaging rules.

Primary-agent configuration and scryrs Pi tracing now load from the `@swarm/swarm-extension` package, not from legacy project-local extension files.
