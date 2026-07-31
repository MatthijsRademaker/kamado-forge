## Context

The repository is a Bun workspace with a Vite frontend, Bun API, SQLite persistence, and Playwright browser tests. Host development can run frontend and backend independently, but current Playwright configuration starts its own Vite server and only exercises showcase UI. Docker exists only as a verification harness. No Compose runtime topology or developer guide exists.

The new environment must prioritize source bind mounts and hot reload. It must also prove service discovery and Vite's reverse-proxy path without turning this change into production packaging or changing product UI scope.

## Goals / Non-Goals

**Goals:**

- Provide one root Compose topology for live mounted-source API and frontend development.
- Keep host development proxy behavior while routing Compose frontend traffic to Compose API service DNS.
- Provide opt-in browser E2E execution against Compose services, including frontend-proxied `/api/health`.
- Keep development SQLite durable and E2E SQLite isolated by Compose project lifecycle.
- Document topology, commands, ports, persistence, cleanup, and failure diagnosis.

**Non-Goals:**

- Production Dockerfiles, immutable runtime images, image publishing, or deployment manifests.
- Product UI changes or a health-status UI.
- Changes to public API contract, generated SDK, database schema, or existing Docker-backed verification harness.
- Running Compose E2E in every pre-commit invocation.

## Decisions

### One Compose file, live source mounts, container-owned dependencies

Root `compose.yaml` will define API and frontend services from pinned Bun tooling, bind-mount repository source, and keep installed dependencies in a Docker-managed volume. A one-shot dependency-install service, or equivalent ordered bootstrap, will populate that volume from committed `bun.lock` before runtime services start.

This prevents host-platform `node_modules` from contaminating Linux containers while preserving edits and Vite/Bun watch behavior. Building copied-source application images would improve production fidelity but defeats primary devex goal and is deferred.

### Configurable Vite proxy target

`frontend/vite.config.ts` will retain `http://localhost:3000` default proxy behavior and accept an explicit server-side proxy target environment variable. Compose frontend sets target to API service hostname and port.

Browser code continues to use relative `/api` URLs. Exposing API host configuration to browser code or changing generated client base URL would create unnecessary client-facing configuration and is rejected.

### Health-gated Compose E2E profile

Compose will expose E2E runner behind opt-in `e2e` profile. API and frontend declare health checks; E2E depends on healthy runtime services, targets frontend through Compose DNS, and uses Playwright configuration that accepts an externally supplied base URL instead of launching another Vite server.

An E2E assertion will request `/api/health` through browser-origin frontend path and verify declared successful health payload. Existing showcase browser tests remain and run in same E2E runner. Direct API-only checks are insufficient because they do not prove frontend proxy routing.

### Project-scoped data lifecycle

Default `docker compose up` uses named SQLite volume for durable development data. Documented E2E command runs same Compose file with an explicit distinct project name, then tears down with volumes. Compose project scoping gives E2E its own named database volume without duplicating API/frontend service definitions or risking developer data.

Shared persistent E2E data is rejected because test state can leak. In-memory SQLite is rejected because it would not validate configured file-backed persistence bootstrapping.

### Developer documentation is source of operational truth

Add dedicated developer documentation page under `.devagent/docs/docs/`, register it in Rspress navigation/taxonomy, and show host-facing ports, internal service names, source/dependency/data mount ownership, normal lifecycle, isolated E2E lifecycle, reset, and troubleshooting. Include topology diagram. Documentation commands are part of contract, not a README aside.

## Risks / Trade-offs

- [Dependency bootstrap delays first startup] → use lockfile-respecting installation and named cache/volume; document first-run expectation.
- [Bind-mount permissions differ across host platforms] → Docker-managed dependency and SQLite volumes avoid writes into repository; document volume reset.
- [Readiness check false positive or slow boot] → health checks use real API route and served frontend URL; E2E runner waits on Compose health conditions.
- [E2E cleanup omitted] → document project-scoped command with `down --volumes`; E2E volume never shares default project name.
- [Vite proxy target drift] → retain local default and add automated E2E assertion through frontend path.

## Migration Plan

1. Add Compose topology, proxy configurability, externally targeted Playwright mode, and E2E proxy proof.
2. Add developer guide and validate documented normal and E2E lifecycle commands.
3. Developers may continue existing host `bun run dev:*` commands; Compose is additive.
4. Rollback removes Compose assets and restores Vite/Playwright configuration. Named Compose volumes can be removed with documented `down --volumes`; no repository database migration occurs.

## Open Questions

- None. Compose targets live mounted-source development; immutable production packaging remains explicitly deferred.
