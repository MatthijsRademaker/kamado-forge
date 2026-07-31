# Implementation Tasks

- [ ] 1. Pin exact Bun-compatible versions of Zod 3.x, `@asteasolutions/zod-to-openapi`, `@hey-api/openapi-ts`, `@hey-api/client-fetch`, Pinia, and Pinia Colada in workspace manifests and `bun.lock`; prove installation and generator execution in the pinned Bun image.
- [ ] 2. Extract a side-effect-free backend contract registry and pure dispatcher while leaving `Bun.serve`, CORS, SQLite creation, and database initialization in the startup adapter.
- [ ] 3. Define strict health input, status-only health data, v1 success, and shared structured error schemas; centralize exact 400/404/405 codes/messages and deterministic issue normalization.
- [ ] 4. Add backend tests for exact valid health, unexpected query keys and issue ordering, unknown routes, unsupported health methods, OPTIONS/CORS, JSON content type, and runtime validation of declared outputs.
- [ ] 5. Generate OpenAPI 3.0.3 from the route registry with `info.version` 1.0.0, relative `/api` server URL, `/health` operation, and all declared response schemas; commit the canonical stable JSON artifact.
- [ ] 6. Configure the pinned Hey API fetch generator, generate the clearly marked TypeScript SDK under `frontend/src/api/generated/`, and ensure generated code is never a hand-editing surface.
- [ ] 7. Add root `generate:api` and temporary-output `check:api` commands; make output timestamp-free and byte-stable, compare only canonical generated trees, and invoke drift checking from `scripts/check`.
- [ ] 8. Register Pinia before Pinia Colada, configure the generated client with relative base `/api`, centralize the health query key, and add a domain health query composable using generated success/error types.
- [ ] 9. Add frontend tests with controlled fetch behavior for the generated health operation and Pinia Colada composable, including relative request routing and typed non-2xx errors, without changing `App.vue`.
- [ ] 10. Document Pinia versus Pinia Colada ownership, generated-code restrictions, domain-composable use, stable query keys, and future mutation invalidation; update LikeC4 source for the generated-client boundary without changing runtime topology.
- [ ] 11. Run generation twice and verify byte-identical output, prove stale artifacts fail `check:api`, and run the complete Docker-backed `scripts/precommit-run` suite.