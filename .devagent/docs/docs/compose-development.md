# Compose Development

`compose.yaml` runs mounted-source frontend and backend development services with Docker-managed dependencies and SQLite data. It is a development and E2E topology, not production packaging, immutable application images, or deployment configuration.

## Topology

| Service | Role | Host port | Health check |
| --- | --- | --- | --- |
| `frontend` | Vite dev server; proxies relative `/api` to `backend` | `5173` | `http://127.0.0.1:5173/` |
| `backend` | Bun watch process and API | `3000` | `http://127.0.0.1:3000/api/health` |
| `dependencies` | Lockfile-respecting one-shot Bun install | None | Completes before runtime services start |
| `e2e` | Opt-in Playwright runner | None | Starts only through `e2e` profile |

Both runtime services bind-mount repository source at `/workspace`. `dependencies` owns root `node_modules` in Docker volume `dependencies`, so host dependencies never replace Linux container dependencies. Bun download cache uses `bun-cache`; backend SQLite uses durable `development-data` mounted at `/data` as `/data/app.sqlite`.

Vite keeps `http://localhost:3000` as host-development `/api` proxy default. Compose sets `API_PROXY_TARGET=http://backend:3000`, so browser requests remain relative while Vite resolves API service DNS inside Compose.

## Development lifecycle

Start and wait for frontend and backend health:

```bash
docker compose up -d --wait
```

Inspect services or follow watch output:

```bash
docker compose ps
docker compose logs -f frontend backend
```

Stop services while preserving dependency cache and development SQLite data:

```bash
docker compose down
```

Reset all Compose development state, including persisted SQLite data:

```bash
docker compose down --volumes --remove-orphans
```

Source edits are bind-mounted. Existing Vite and Bun watch commands reload without an application image rebuild.

## Isolated browser E2E lifecycle

Use explicit project name `kamado-e2e`; its services, network, and volumes cannot share default development state:

```bash
docker compose -p kamado-e2e up -d --wait backend frontend
docker compose -p kamado-e2e --profile e2e run --rm --no-deps e2e
docker compose -p kamado-e2e down --volumes --remove-orphans
```

First command waits for backend and frontend health. Second runs full Playwright suite on Compose network with `PLAYWRIGHT_BASE_URL=http://frontend:5173`; it does not start local Vite and returns Playwright exit code. Suite includes browser-origin relative `/api/health` assertion with exact successful health payload. Final command removes only `kamado-e2e` services, network, and volumes.

## Troubleshooting

| Symptom | Check | Fix |
| --- | --- | --- |
| Service never becomes healthy | `docker compose logs backend frontend` | Fix watch-process error, then restart with `docker compose up -d --wait`. |
| Frontend API request fails | `docker compose logs frontend backend` | Confirm `frontend` has `API_PROXY_TARGET=http://backend:3000`; browser code must use relative `/api` paths. |
| Dependency installation is stale or corrupt | `docker compose down --volumes --remove-orphans` | Reset volumes, then restart; first install takes longer. |
| E2E leaves state behind | `docker compose -p kamado-e2e down --volumes --remove-orphans` | Use exact E2E project name; do not run `down --volumes` without `-p kamado-e2e` while preserving development data. |

## Related pages

- [Tech Stack](./tech-stack.md) — frontend, backend, persistence, and verification boundaries.
- [Architecture Diagrams](./architecture.mdx) — product topology source of truth.
