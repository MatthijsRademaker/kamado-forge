## Why

Local development starts frontend and backend as separate host processes, while browser tests start an isolated Vite server and never exercise backend reachability through the frontend proxy. Developers need one live, mounted-source stack and a repeatable browser-test topology that proves frontend-to-backend wiring without adopting production deployment packaging.

## What Changes

- Add Docker Compose development topology for live mounted-source frontend and backend services.
- Make Vite's server-side `/api` proxy target configurable so host development retains `localhost` behavior and Compose routes to backend service DNS.
- Add an opt-in Compose E2E runner that waits for healthy services and proves frontend-proxied API reachability alongside existing browser coverage.
- Isolate E2E SQLite state from durable developer SQLite state, with documented startup, test, teardown, and reset commands.
- Document Compose topology, service boundaries, ports, source mounts, data lifecycle, and troubleshooting in project developer docs.

## Capabilities

### New Capabilities

- `docker-compose-development`: Live mounted-source Docker Compose development environment with isolated Compose E2E execution and developer documentation.

### Modified Capabilities

- None.

## Impact

- New root Compose configuration and supporting container/development configuration.
- `frontend/vite.config.ts` proxy configuration and Playwright service-target configuration.
- E2E coverage under `e2e/` plus Compose-oriented test command/configuration.
- `.devagent/docs/docs/` developer documentation and its Rspress navigation/taxonomy integration.
- No public API contract, generated client, product UI behavior, production deployment, or existing Docker verification harness replacement.
