# typed-api-contract Specification

## Purpose
TBD - created by archiving change task-15626e43-920e-4638-ad58-bae00b5f7fa7. Update Purpose after archive.
## Requirements
### Requirement: Single executable health contract
The backend MUST define health route metadata and strict request, success, and error schemas in one side-effect-free Zod 3.x contract registry used by runtime validation and OpenAPI generation. `Bun.serve`, CORS handling, SQLite initialization, and the `/api/health` route SHALL remain in place, with dispatch behavior extracted behind a pure testable boundary.

#### Scenario: Startup delegates a health request
- **WHEN** `Bun.serve` receives `GET /api/health` without query parameters
- **THEN** it delegates to the contract-backed dispatcher without moving or replacing SQLite initialization

#### Scenario: Contract payload types have one source
- **WHEN** health request or response types are needed by backend code or generation
- **THEN** they are inferred from or generated from the registered schemas rather than duplicated by hand

### Requirement: Exact health success response
A valid health request MUST return HTTP 200 with JSON content type and the exact v1 payload `{ "data": { "ok": true, "service": "api", "database": { "status": "ok" } } }`. The public response MUST NOT expose the SQLite filesystem path. The dispatcher MUST validate the success body against its declared schema before returning it.

#### Scenario: Valid health response
- **WHEN** a client sends `GET /api/health` with no query parameters
- **THEN** the response is HTTP 200 with JSON content type and exactly the declared v1 success payload

#### Scenario: Invalid handler output
- **WHEN** a health handler constructs a body that does not conform to the declared success schema
- **THEN** runtime response validation fails and the contract test detects the mismatch before an undocumented payload is returned

### Requirement: Deterministic structured errors
The API MUST use the shared JSON envelope `{ "error": { "code", "message", "issues" } }` for malformed health requests, unknown routes, and unsupported methods. Malformed health input MUST map to HTTP 400, unknown routes to HTTP 404, and non-GET methods on the health route to HTTP 405. Validation issues MUST contain only project-owned `path`, `code`, and `message` fields and MUST be sorted lexicographically by path, then code, then message. Every declared error body MUST be runtime-validated before return.

#### Scenario: Unexpected health query parameter
- **WHEN** a client sends `GET /api/health` with one or more query parameters
- **THEN** the response is HTTP 400 with the centralized validation code/message and a deterministic ordered issue for every unexpected query key

#### Scenario: Unknown route
- **WHEN** a client requests an unregistered API route
- **THEN** the response is HTTP 404 with the centralized not-found code/message, an empty issue list, and the shared error envelope

#### Scenario: Unsupported health method
- **WHEN** a client uses a non-GET, non-OPTIONS method on `/api/health`
- **THEN** the response is HTTP 405 with the centralized method-not-allowed code/message, an empty issue list, and the shared error envelope

### Requirement: CORS preflight remains functional
The API MUST preserve the configured CORS headers and functional OPTIONS preflight behavior while introducing contract dispatch.

#### Scenario: Health preflight
- **WHEN** a client sends an OPTIONS preflight request for `/api/health`
- **THEN** the API returns a successful preflight response with the configured allow-origin behavior and existing allowed headers and methods
