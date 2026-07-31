import { createApiDispatcher } from "./dispatcher";
import {
  bootstrapPersistence,
  type BootstrapPersistenceOptions,
  type PersistenceContext,
} from "./persistence/bootstrap";

interface ApiServerOptions {
  readonly port: number;
  fetch(request: Request): Response;
}

type ApiServerFactory = (options: ApiServerOptions) => unknown;
type PersistenceBootstrap = (options: BootstrapPersistenceOptions) => PersistenceContext;

interface StartApiOptions {
  readonly port: number;
  readonly databasePath: string;
  readonly corsOrigin?: string;
  readonly bootstrap?: PersistenceBootstrap;
  readonly serve?: ApiServerFactory;
}

export function startApi({
  port,
  databasePath,
  corsOrigin,
  bootstrap = bootstrapPersistence,
  serve = defaultServe,
}: StartApiOptions) {
  const persistence = bootstrap({ databasePath });
  const dispatch = createApiDispatcher({
    getHealth: () => ({ ok: true, service: "api", database: { status: "ok" } }),
  });
  const server = serve({
    port,
    fetch(request) {
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), corsOrigin);
      }

      return withCors(dispatch(request), corsOrigin);
    },
  });

  return { persistence, server };
}

const defaultServe: ApiServerFactory = (options) => Bun.serve(options);

function withCors(response: Response, corsOrigin: string | undefined): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (corsOrigin) {
    headers.set("Access-Control-Allow-Origin", corsOrigin);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
