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
  const server = serve({
    port,
    fetch(request) {
      const pathname = pathnameFor(request.url);

      if (!pathname) {
        return json({ error: "invalid request url" }, corsOrigin, { status: 400 });
      }

      if (request.method === "OPTIONS") {
        return json({ ok: true }, corsOrigin);
      }

      if (pathname === "/api/health") {
        return json({ ok: true, service: "api", database: databasePath }, corsOrigin);
      }

      return json({ error: "not found" }, corsOrigin, { status: 404 });
    },
  });

  return { persistence, server };
}

const defaultServe: ApiServerFactory = (options) => Bun.serve(options);

function json(body: unknown, corsOrigin: string | undefined, init?: { status?: number }): Response {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };

  if (corsOrigin) {
    headers["Access-Control-Allow-Origin"] = corsOrigin;
  }

  return Response.json(body, { status: init?.status, headers });
}

function pathnameFor(requestUrl: string): string | undefined {
  try {
    return new URL(requestUrl).pathname;
  } catch {
    return undefined;
  }
}
