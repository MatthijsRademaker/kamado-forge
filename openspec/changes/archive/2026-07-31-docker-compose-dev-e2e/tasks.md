## 1. Compose development topology

- [x] 1.1 Add root Compose configuration with lockfile-respecting dependency bootstrap, source bind mounts, Docker-managed dependency storage, durable development SQLite volume, published frontend/backend ports, and health checks.
- [x] 1.2 Configure backend and frontend Compose services to run existing watch commands and route frontend server proxy to backend service DNS while preserving host default target.
- [x] 1.3 Validate rendered Compose configuration and confirm mounted-source change detection plus development SQLite persistence lifecycle.

## 2. Compose E2E topology and coverage

- [x] 2.1 Update Playwright configuration to accept externally supplied frontend base URL and skip local Vite startup only in external-service mode.
- [x] 2.2 Add browser E2E coverage that requests relative `/api/health` through frontend and asserts exact successful health contract.
- [x] 2.3 Add opt-in Compose E2E runner profile using service-health dependencies, Compose service-network frontend target, Playwright exit-code propagation, and project-scoped cleanup-compatible storage.
- [x] 2.4 Run isolated project-name Compose E2E lifecycle and prove teardown removes only E2E services, network, and volumes.

## 3. Documentation and verification

- [x] 3.1 Add and register developer Compose guide in `.devagent/docs/docs/` covering topology, ports, mounts, development lifecycle, E2E lifecycle, reset, persistence, and troubleshooting; state production packaging is out of scope.
- [x] 3.2 Build developer documentation and verify navigation/taxonomy and command claims against implementation.
- [x] 3.3 Run applicable Docker-backed project verification, Compose configuration validation, and `scripts/precommit-run`; record docs/verification coupling sweep.

## Verification and coupling sweep

- Edge 5 (code behavior ↔ developer docs): updated and built `compose-development.md`; navigation and generated taxonomy include Compose guide.
- Edge 6 (system structure ↔ LikeC4): not touched; Compose adds a development runtime alternative without changing modeled product components or dependencies.
- Verified `docker compose config --quiet`, isolated Compose E2E lifecycle, Docker-backed docs build, and `scripts/precommit-run`.
