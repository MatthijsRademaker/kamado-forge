import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const port = Number(process.env.PORT ?? 3000);
const databasePath = resolve(process.env.DATABASE_PATH ?? "./data/app.sqlite");
const corsOrigin = process.env.CORS_ORIGIN;

mkdirSync(dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const json = (body: unknown, init?: { status?: number }) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };

  if (corsOrigin) {
    headers["Access-Control-Allow-Origin"] = corsOrigin;
  }

  return Response.json(body, { status: init?.status, headers });
};

const pathnameFor = (requestUrl: string) => {
  if (!URL.canParse(requestUrl)) {
    return undefined;
  }

  return new URL(requestUrl).pathname;
};

Bun.serve({
  port,
  fetch(request: Request) {
    const pathname = pathnameFor(request.url);

    if (!pathname) {
      return json({ error: "invalid request url" }, { status: 400 });
    }

    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }

    if (pathname === "/api/health") {
      return json({ ok: true, service: "api", database: databasePath });
    }

    return json({ error: "not found" }, { status: 404 });
  },
});
