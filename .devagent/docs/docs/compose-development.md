# Compose Development

`compose.yaml` provides mounted-source development services and a separate isolated full-stack E2E topology. Development SQLite is durable; E2E SQLite exists only inside its ephemeral backend container.

## Development topology

| Service | Role | Host port | State |
| --- | --- | --- | --- |
| `frontend` | Vite dev server; proxies relative `/api` to `backend` | `5173` | Mounted source |
| `backend` | Bun API/watch process | `3000` | `development-data` SQLite volume |
| `dependencies` | Frozen-lockfile Bun install | None | Shared dependency/cache volumes |

```bash
docker compose up -d --wait
docker compose logs -f frontend backend
docker compose down
```

`API_PROXY_TARGET=http://backend:3000` keeps browser requests relative. `DATABASE_PATH=/data/app.sqlite` points development at the durable `development-data` volume.

## Isolated browser verification

The `e2e` profile uses separate `backend-e2e` and `frontend-e2e` services:

- `backend-e2e` stores SQLite at `/tmp/kamado-e2e.sqlite` inside an ephemeral container;
- `frontend-e2e` proxies `/api` to `backend-e2e`;
- `e2e` runs Playwright against `http://frontend-e2e:5173` with one worker;
- teardown removes containers, network, and volumes.

`scripts/test` assigns a unique Compose project, starts the profile, returns the Playwright exit code, and always tears the project down. Each run therefore starts from an empty database while still proving persistence across browser reloads inside that run.

```bash
scripts/test
```

For focused manual E2E execution:

```bash
COMPOSE_PROJECT_NAME=kamado-e2e docker compose --profile e2e up --abort-on-container-exit --exit-code-from e2e e2e
docker compose -p kamado-e2e --profile e2e down --volumes --remove-orphans
```

Do not point browser acceptance tests at the durable development `backend` service. Shared data makes create/eligible/active assertions order-dependent and can hide persistence defects.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| API service is unhealthy | `docker compose logs backend-e2e` | Fix contract or migration failure; do not bypass health gating. |
| Browser cannot load Compose host | Vite `server.allowedHosts` | Keep `frontend-e2e` allowed for the isolated profile. |
| Frontend API request fails | `docker compose logs frontend-e2e backend-e2e` | Confirm `API_PROXY_TARGET=http://backend-e2e:3000`. |
| E2E state leaks | Compose project/teardown output | Use a unique project and `down --volumes --remove-orphans`. |

## Related pages

- [Durable Cooking-Session API](./cooking-session-api.md) — behavior exercised by full-stack tests.
- [Architecture Diagrams](./architecture.mdx) — product and local runtime topology.
- [Tech Stack](./tech-stack.md) — repository tooling boundaries.
