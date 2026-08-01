import {
  API_ERRORS,
  apiErrorSchema,
  createSessionRoute,
  deleteSessionRoute,
  getSessionRoute,
  healthRoute,
  healthSuccessSchema,
  listSessionsRoute,
  normalizeValidationIssues,
  updateSessionRoute,
  type HealthData,
} from "./contract";
import type { SessionRepository } from "./persistence/session-repository";
import { sessionSuccessSchema, sessionWriteSchema } from "./session-contract";

interface ApiDispatcherDependencies {
  readonly getHealth: () => unknown;
  readonly sessionRepository?: SessionRepository;
}

export function createApiDispatcher({ getHealth, sessionRepository }: ApiDispatcherDependencies) {
  return (request: Request): Response | Promise<Response> => {
    const url = parseRequestUrl(request.url);
    if (!url) return errorResponse(400, API_ERRORS.validation);

    if (url.pathname === healthRoute.runtimePath) {
      return dispatchHealth(request, url, getHealth);
    }

    if (url.pathname === createSessionRoute.runtimePath) {
      return dispatchSessionCollection(request, url, requireSessionRepository(sessionRepository));
    }

    const itemMatch = /^\/api\/sessions\/([^/]+)$/.exec(url.pathname);
    if (itemMatch) {
      return dispatchSessionItem(
        request,
        url,
        decodePathSegment(itemMatch[1] ?? ""),
        requireSessionRepository(sessionRepository),
      );
    }

    return errorResponse(404, API_ERRORS.notFound);
  };
}

function dispatchHealth(request: Request, url: URL, getHealth: () => unknown): Response {
  if (request.method !== healthRoute.method) return errorResponse(405, API_ERRORS.methodNotAllowed);

  const queryResult = healthRoute.querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!queryResult.success) {
    return errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(queryResult.error, "query"));
  }

  const data = getHealth() as HealthData;
  return validatedJson(healthSuccessSchema, { data }, 200);
}

async function dispatchSessionCollection(request: Request, url: URL, repository: SessionRepository): Promise<Response> {
  const queryError = validateQuery(url);
  if (queryError) return queryError;

  if (request.method === listSessionsRoute.method) {
    const sessions = await repository.list();
    return validatedJson(listSessionsRoute.responses[200], { data: sessions }, 200);
  }
  if (request.method === createSessionRoute.method) {
    const body = await parseSessionBody(request);
    if (body instanceof Response) return body;

    const session = await repository.create(body);
    return validatedJson(createSessionRoute.responses[201], { data: session }, 201);
  }

  return errorResponse(405, API_ERRORS.methodNotAllowed);
}

async function dispatchSessionItem(
  request: Request,
  url: URL,
  sessionId: string,
  repository: SessionRepository,
): Promise<Response> {
  const queryError = validateQuery(url);
  if (queryError) return queryError;

  const paramsResult = getSessionRoute.paramsSchema.safeParse({ sessionId });
  if (!paramsResult.success) {
    return errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(paramsResult.error, "path"));
  }

  if (request.method === getSessionRoute.method) {
    const session = await repository.get(sessionId);
    return session
      ? validatedJson(sessionSuccessSchema, { data: session }, 200)
      : errorResponse(404, API_ERRORS.sessionNotFound);
  }

  if (request.method === updateSessionRoute.method) {
    const body = await parseSessionBody(request);
    if (body instanceof Response) return body;

    const session = await repository.update(sessionId, body);
    return session
      ? validatedJson(updateSessionRoute.responses[200], { data: session }, 200)
      : errorResponse(404, API_ERRORS.sessionNotFound);
  }

  if (request.method === deleteSessionRoute.method) {
    return (await repository.delete(sessionId))
      ? new Response(null, { status: 204 })
      : errorResponse(404, API_ERRORS.sessionNotFound);
  }

  return errorResponse(405, API_ERRORS.methodNotAllowed);
}

function validateQuery(url: URL): Response | undefined {
  const result = listSessionsRoute.querySchema.safeParse(Object.fromEntries(url.searchParams));
  return result.success
    ? undefined
    : errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(result.error, "query"));
}

async function parseSessionBody(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(400, API_ERRORS.validation, [
      { path: "body", code: "invalid_body", message: "Request body must be valid JSON" },
    ]);
  }

  const result = sessionWriteSchema.safeParse(rawBody);
  return result.success
    ? result.data
    : errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(result.error, "body"));
}

function requireSessionRepository(repository: SessionRepository | undefined): SessionRepository {
  if (!repository) throw new Error("Session repository is required for cooking-session routes");
  return repository;
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseRequestUrl(requestUrl: string): URL | undefined {
  try {
    return new URL(requestUrl);
  } catch {
    return undefined;
  }
}

function errorResponse(
  status: 400 | 404 | 405,
  error: { readonly code: string; readonly message: string },
  issues: { readonly path: string; readonly code: string; readonly message: string }[] = [],
): Response {
  return validatedJson(apiErrorSchema, { error: { ...error, issues } }, status);
}

function validatedJson(
  schema: { parse(value: unknown): unknown },
  body: unknown,
  status: 200 | 201 | 400 | 404 | 405,
): Response {
  return Response.json(schema.parse(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
