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
import {
  activateLiveDraftRoute,
  createLiveDraftBodySchema,
  createLiveDraftRoute,
  getActiveLiveSessionRoute,
  liveCookSuccessSchema,
  liveDraftSuccessSchema,
  liveSessionCommandRoutes,
  type CreateLiveDraft,
  type LiveCookAction,
} from "./live-cook-contract";
import { LiveCookError, type LiveCookRepository } from "./persistence/live-cook-repository";
import type { SessionRepository } from "./persistence/session-repository";
import { sessionSuccessSchema, sessionWriteSchema, type SessionWrite } from "./session-contract";

interface ApiDispatcherDependencies {
  readonly getHealth: () => unknown;
  readonly liveCookRepository?: LiveCookRepository;
  readonly sessionRepository?: SessionRepository;
}

export function createApiDispatcher({ getHealth, liveCookRepository, sessionRepository }: ApiDispatcherDependencies) {
  return (request: Request): Response | Promise<Response> => {
    const url = parseRequestUrl(request.url);
    if (!url) return errorResponse(400, API_ERRORS.validation);
    if (url.pathname === healthRoute.runtimePath) return dispatchHealth(request, url, getHealth);
    if (url.pathname === createSessionRoute.runtimePath)
      return dispatchSessionCollection(request, url, requireSessionRepository(sessionRepository));

    const sessionMatch = /^\/api\/sessions\/([^/]+)$/.exec(url.pathname);
    if (sessionMatch)
      return dispatchSessionItem(
        request,
        url,
        decodePathSegment(sessionMatch[1] ?? ""),
        requireSessionRepository(sessionRepository),
      );
    if (url.pathname === createLiveDraftRoute.runtimePath)
      return dispatchDraftCreation(request, url, requireLiveCookRepository(liveCookRepository));

    const activationMatch = /^\/api\/drafts\/([^/]+)\/activate$/.exec(url.pathname);
    if (activationMatch)
      return dispatchActivation(
        request,
        url,
        decodePathSegment(activationMatch[1] ?? ""),
        requireLiveCookRepository(liveCookRepository),
      );
    if (url.pathname === getActiveLiveSessionRoute.runtimePath)
      return dispatchActiveSession(request, url, requireLiveCookRepository(liveCookRepository));

    const commandMatch = /^\/api\/live-session\/(advance|return|pause|resume|complete|cancel)$/.exec(url.pathname);
    if (commandMatch)
      return dispatchCommand(
        request,
        url,
        commandMatch[1] as LiveCookAction,
        requireLiveCookRepository(liveCookRepository),
      );
    return errorResponse(404, API_ERRORS.notFound);
  };
}

function dispatchHealth(request: Request, url: URL, getHealth: () => unknown): Response {
  if (request.method !== healthRoute.method) return errorResponse(405, API_ERRORS.methodNotAllowed);
  const query = healthRoute.querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!query.success) return errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(query.error, "query"));
  return validatedJson(healthSuccessSchema, { data: getHealth() as HealthData }, 200);
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
    return validatedJson(createSessionRoute.responses[201], { data: await repository.create(body) }, 201);
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
  const params = getSessionRoute.paramsSchema.safeParse({ sessionId });
  if (!params.success)
    return errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(params.error, "path"));

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

async function dispatchDraftCreation(request: Request, url: URL, repository: LiveCookRepository): Promise<Response> {
  const queryError = validateQuery(url);
  if (queryError) return queryError;
  if (request.method !== createLiveDraftRoute.method) return errorResponse(405, API_ERRORS.methodNotAllowed);
  const body = await parseDraftBody(request);
  if (body instanceof Response) return body;
  return validatedJson(liveDraftSuccessSchema, { data: repository.createDraft(body) }, 201);
}

async function dispatchActivation(
  request: Request,
  url: URL,
  draftId: string,
  repository: LiveCookRepository,
): Promise<Response> {
  const queryError = validateQuery(url);
  if (queryError) return queryError;
  const params = activateLiveDraftRoute.paramsSchema.safeParse({ draftId });
  if (!params.success)
    return errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(params.error, "path"));
  if (request.method !== activateLiveDraftRoute.method) return errorResponse(405, API_ERRORS.methodNotAllowed);
  const body = await parseBody(request, activateLiveDraftRoute.bodySchema);
  if (body instanceof Response) return body;
  try {
    return validatedJson(liveCookSuccessSchema, { data: repository.activateDraft(draftId, body) }, 200);
  } catch (error) {
    return liveCookErrorResponse(error);
  }
}

function dispatchActiveSession(request: Request, url: URL, repository: LiveCookRepository): Response {
  const queryError = validateQuery(url);
  if (queryError) return queryError;
  if (request.method !== getActiveLiveSessionRoute.method) return errorResponse(405, API_ERRORS.methodNotAllowed);
  try {
    return validatedJson(liveCookSuccessSchema, { data: repository.getActive() }, 200);
  } catch (error) {
    return liveCookErrorResponse(error);
  }
}

async function dispatchCommand(
  request: Request,
  url: URL,
  action: LiveCookAction,
  repository: LiveCookRepository,
): Promise<Response> {
  const queryError = validateQuery(url);
  if (queryError) return queryError;
  const route = liveSessionCommandRoutes[action];
  if (request.method !== route.method) return errorResponse(405, API_ERRORS.methodNotAllowed);
  const body = await parseBody(request, route.bodySchema);
  if (body instanceof Response) return body;
  try {
    return validatedJson(liveCookSuccessSchema, { data: repository.command(action, body) }, 200);
  } catch (error) {
    return liveCookErrorResponse(error);
  }
}

function validateQuery(url: URL): Response | undefined {
  const query = getActiveLiveSessionRoute.querySchema.safeParse(Object.fromEntries(url.searchParams));
  return query.success
    ? undefined
    : errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(query.error, "query"));
}

async function parseSessionBody(request: Request): Promise<SessionWrite | Response> {
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

function requireLiveCookRepository(repository: LiveCookRepository | undefined): LiveCookRepository {
  if (!repository) throw new Error("Live-cook repository is required for live-cook routes");
  return repository;
}

async function parseDraftBody(request: Request): Promise<CreateLiveDraft | Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(400, API_ERRORS.validation, [
      { path: "body", code: "invalid_body", message: "Request body must be valid JSON" },
    ]);
  }
  const result = createLiveDraftBodySchema.safeParse(rawBody);
  return result.success
    ? result.data
    : errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(result.error, "body"));
}

async function parseBody(
  request: Request,
  schema: {
    safeParse(
      value: unknown,
    ):
      | { success: true; data: { note?: string; steps?: unknown[] } }
      | { success: false; error: import("zod").ZodError };
  },
) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(400, API_ERRORS.validation, [
      { path: "body", code: "invalid_body", message: "Request body must be valid JSON" },
    ]);
  }
  const result = schema.safeParse(rawBody);
  return result.success
    ? result.data
    : errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(result.error, "body"));
}

function liveCookErrorResponse(error: unknown): Response {
  if (!(error instanceof LiveCookError)) throw error;
  switch (error.code) {
    case "NOT_FOUND":
      return errorResponse(404, API_ERRORS.liveCookNotFound);
    case "INVALID_DRAFT":
      return errorResponse(409, API_ERRORS.invalidDraft);
    case "INVALID_TRANSITION":
      return errorResponse(409, API_ERRORS.invalidTransition);
    case "ACTIVE_SESSION_CONFLICT":
      return errorResponse(409, API_ERRORS.activeSessionConflict);
    default:
      throw new Error(`Unhandled live-cook error code: ${error.code}`);
  }
}

function errorResponse(
  status: 400 | 404 | 405 | 409,
  error: { readonly code: string; readonly message: string },
  issues: { readonly path: string; readonly code: string; readonly message: string }[] = [],
): Response {
  return validatedJson(apiErrorSchema, { error: { ...error, issues } }, status);
}

function validatedJson(
  schema: { parse(value: unknown): unknown },
  body: unknown,
  status: 200 | 201 | 400 | 404 | 405 | 409,
): Response {
  return Response.json(schema.parse(body), { status, headers: { "content-type": "application/json" } });
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
