# frontend-data-access Specification

## Purpose
TBD - created by archiving change task-15626e43-920e-4638-ad58-bae00b5f7fa7. Update Purpose after archive.
## Requirements
### Requirement: Frontend server state uses Pinia Colada
The Vue bootstrap MUST install Pinia before Pinia Colada. Pinia SHALL own shared client-controlled state, and Pinia Colada SHALL own API query and mutation state.

#### Scenario: Application bootstrap
- **WHEN** the Vue application is created
- **THEN** Pinia is installed before Pinia Colada and the application mounts with both plugins available

#### Scenario: State ownership decision
- **WHEN** frontend code introduces shared local state or remote API state
- **THEN** it places client-controlled state in Pinia and remote query or mutation state in Pinia Colada

### Requirement: Health uses a generated-client domain composable
The frontend MUST configure the generated fetch client with relative base `/api` and MUST expose health through a domain composable that invokes the generated health operation with a centralized stable query key. Hand-authored frontend code MUST NOT define a duplicate Health DTO or issue a feature-level raw `fetch` for health. The composable MUST expose generated success data and the structured API error type.

#### Scenario: Query health successfully
- **WHEN** the health composable executes against a controlled successful transport response
- **THEN** it requests relative `/api/health` through the generated operation and exposes typed health data under its stable key

#### Scenario: Query health receives an API error
- **WHEN** the generated health operation receives a declared non-2xx response
- **THEN** the composable exposes the typed structured error envelope rather than an untyped schema-library or raw transport error

#### Scenario: Consume health in feature code
- **WHEN** frontend feature code needs health server state
- **THEN** it consumes the domain composable instead of importing generated transport modules directly or calling raw `fetch`

### Requirement: Query keys and mutation invalidation follow shared conventions
The frontend MUST centralize stable domain query keys. A future domain mutation composable MUST invalidate the related centralized query keys after success. This change MUST document and, where reusable helpers exist, test the convention without adding a dummy mutation endpoint or product mutation.

#### Scenario: Define a query key
- **WHEN** the health query is configured
- **THEN** it uses the centralized stable health key rather than an inline component-specific key

#### Scenario: Apply the future mutation convention
- **WHEN** a future product mutation is implemented
- **THEN** its domain composable invalidates related centralized keys after successful completion without moving server state into Pinia

### Requirement: Health data access is proven without UI scope
The frontend MUST test generated health request routing, successful data, and declared error behavior through the installed Pinia and Pinia Colada path without adding or changing a UI page.

#### Scenario: Run frontend integration proof
- **WHEN** the frontend health data-access test runs with controlled fetch responses
- **THEN** it proves plugin setup, generated relative routing, stable key use, and typed success/error behavior while `App.vue` remains a scaffold
