# docker-compose-development Specification

## Purpose

TBD - created by archiving change docker-compose-dev-e2e. Update Purpose after archive.

## Requirements

### Requirement: Live mounted-source Compose development stack

The repository MUST provide root Docker Compose configuration that starts frontend and backend as separate live-development services from current workspace source. It MUST bind-mount project source for both services, keep container-installed dependencies outside host `node_modules`, publish frontend and backend host ports, and run backend SQLite against a Docker-managed durable development volume. Source edits MUST be observed by existing Vite and Bun watch processes without rebuilding an application image.

#### Scenario: Developer starts Compose development

- **WHEN** developer starts default Compose services from repository root
- **THEN** frontend and backend start from bind-mounted workspace source, frontend is reachable on documented host port, backend is reachable on documented host port, and backend creates or reuses SQLite state in Compose-managed development storage

#### Scenario: Developer changes mounted source

- **WHEN** developer changes frontend or backend source while corresponding Compose development service is running
- **THEN** existing Vite or Bun development watcher observes change without requiring an application image rebuild

### Requirement: Compose frontend routes API through service discovery

The Vite development server MUST retain `http://localhost:3000` as its default `/api` proxy target for host development and MUST allow Compose to supply backend service target through server-side configuration. Browser-facing application requests MUST remain relative `/api` requests; Compose frontend MUST proxy them to backend service hostname rather than frontend-container localhost.

#### Scenario: Host development uses default proxy target

- **WHEN** frontend development server starts without Compose proxy-target configuration
- **THEN** `/api` proxy targets `http://localhost:3000`

#### Scenario: Compose frontend proxies to backend service

- **WHEN** Compose frontend receives `/api/health`
- **THEN** it forwards request to Compose backend service and returns backend's declared health response

### Requirement: Isolated health-gated Compose E2E execution

The Compose topology MUST offer opt-in browser E2E execution that waits for healthy backend and frontend services, targets frontend through Compose service networking, and returns Playwright result as command exit status. E2E execution MUST cover existing browser suite plus frontend-proxied `/api/health` successful response. Playwright MUST support externally supplied base URL for Compose execution and MUST NOT launch competing Vite server in that mode.

#### Scenario: E2E stack becomes ready

- **WHEN** Compose E2E profile starts
- **THEN** E2E runner does not execute before backend health endpoint and frontend served URL report healthy

#### Scenario: Browser proves proxy route

- **WHEN** E2E browser visits frontend service
- **THEN** browser-origin request to relative `/api/health` returns HTTP 200 and exact declared health success payload through frontend proxy

#### Scenario: E2E process reports failure

- **WHEN** any Playwright test fails during Compose E2E execution
- **THEN** documented Compose E2E command returns non-zero status

### Requirement: E2E data never shares development state

Default Compose development lifecycle MUST retain file-backed SQLite state in its named volume. Documented Compose E2E lifecycle MUST use explicit separate Compose project identity and remove that project's volumes on teardown, so E2E database state cannot read from or write to default development database volume.

#### Scenario: E2E starts with isolated database storage

- **WHEN** developer runs documented Compose E2E command after using default Compose development stack
- **THEN** E2E backend uses a distinct Compose-managed SQLite volume from default development backend

#### Scenario: E2E teardown removes test state

- **WHEN** developer runs documented E2E teardown command
- **THEN** E2E Compose services, network, and project-scoped database volume are removed without removing default development volume

### Requirement: Compose workflow documentation is maintained

Project developer documentation MUST contain a dedicated Compose guide, registered in documentation navigation and taxonomy, that describes topology, service names, host ports, source/dependency/data mounts, normal development lifecycle, isolated E2E lifecycle, reset, and troubleshooting. Guide MUST state that Compose provides mounted-source development and is not production deployment packaging.

#### Scenario: Developer follows documented normal lifecycle

- **WHEN** developer reads Compose guide
- **THEN** guide provides exact commands to start, inspect, stop, and reset development stack and explains persistence consequences

#### Scenario: Developer follows documented E2E lifecycle

- **WHEN** developer reads Compose guide
- **THEN** guide provides exact isolated project-scoped command to run E2E tests and exact teardown command that removes only E2E state
