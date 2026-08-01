import { CoachConfigurationError } from "./coach-config";
import { coachRequestSchema, coachRoute, coachSuccessSchema } from "./coach-contract";
import { CoachProviderError } from "./coach-provider";
import type { CoachService } from "./coach-service";
import {
  API_ERRORS,
  apiErrorSchema,
  createSessionRoute,
  deleteSessionRoute,
  getSessionRoute,
  healthRoute,
  healthSuccessSchema,
  listEligibleSessionsRoute,
  listSessionsRoute,
  normalizeValidationIssues,
  updateSessionRoute,
  type HealthData,
} from "./contract";
import {
  activateCookingSessionRoute,
  addLiveCookingSessionNoteRoute,
  cookingSessionCommandRoutes,
  findActiveCookingSessionRoute,
  getLiveCookingSessionRoute,
  liveCookSuccessSchema,
  type LiveCookAction,
} from "./live-cook-contract";
import { LiveCookError, type LiveCookRepository } from "./persistence/live-cook-repository";
import type { SessionRepository } from "./persistence/session-repository";
import { sessionSuccessSchema, sessionWriteSchema, type SessionWrite } from "./session-contract";

interface ApiDispatcherDependencies {
  readonly coachService?: CoachService;
  readonly getHealth: () => unknown;
  readonly liveCookRepository?: LiveCookRepository;
  readonly sessionRepository?: SessionRepository;
}

export function createApiDispatcher({
  coachService,
  getHealth,
  liveCookRepository,
  sessionRepository,
}: ApiDispatcherDependencies) {
  return (request: Request): Response | Promise<Response> => {
    const url = parseRequestUrl(request.url);
    if (!url) return errorResponse(400, API_ERRORS.validation);
    if (url.pathname === healthRoute.runtimePath) return dispatchHealth(request, url, getHealth);
    if (url.pathname === coachRoute.runtimePath) return dispatchCoach(request, url, requireCoachService(coachService));
    if (url.pathname === createSessionRoute.runtimePath)
      return dispatchSessionCollection(request, url, requireSessionRepository(sessionRepository));
    if (url.pathname === listEligibleSessionsRoute.runtimePath)
      return dispatchEligibleSessions(request, url, requireSessionRepository(sessionRepository));

    const sessionActivationMatch = /^\/api\/sessions\/([^/]+)\/activate$/.exec(url.pathname);
    if (sessionActivationMatch)
      return dispatchSessionActivation(
        request,
        url,
        decodePathSegment(sessionActivationMatch[1] ?? ""),
        requireLiveCookRepository(liveCookRepository),
      );

    const sessionMatch = /^\/api\/sessions\/([^/]+)$/.exec(url.pathname);
    if (sessionMatch)
      return dispatchSessionItem(
        request,
        url,
        decodePathSegment(sessionMatch[1] ?? ""),
        requireSessionRepository(sessionRepository),
      );
    if (url.pathname === findActiveCookingSessionRoute.runtimePath)
      return dispatchOptionalActiveSession(request, url, requireLiveCookRepository(liveCookRepository));

    const cookingSessionNoteMatch = /^\/api\/live-sessions\/([^/]+)\/notes$/.exec(url.pathname);
    if (cookingSessionNoteMatch)
      return dispatchCookingSessionNote(
        request,
        url,
        decodePathSegment(cookingSessionNoteMatch[1] ?? ""),
        requireLiveCookRepository(liveCookRepository),
      );
    const cookingSessionCommandMatch =
      /^\/api\/live-sessions\/([^/]+)\/(advance|return|pause|resume|complete|cancel)$/.exec(url.pathname);
    if (cookingSessionCommandMatch)
      return dispatchCookingSessionCommand(
        request,
        url,
        decodePathSegment(cookingSessionCommandMatch[1] ?? ""),
        cookingSessionCommandMatch[2] as LiveCookAction,
        requireLiveCookRepository(liveCookRepository),
      );
    const cookingSessionDetailMatch = /^\/api\/live-sessions\/([^/]+)$/.exec(url.pathname);
    if (cookingSessionDetailMatch)
      return dispatchCookingSessionDetail(
        request,
        url,
        decodePathSegment(cookingSessionDetailMatch[1] ?? ""),
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

async function dispatchCoach(request: Request, url: URL, service: CoachService): Promise<Response> {
  const query = coachRoute.querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!query.success) return errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(query.error, "query"));
  if (request.method !== coachRoute.method) return errorResponse(405, API_ERRORS.methodNotAllowed);
  const body = await parseBody(request, coachRequestSchema);
  if (body instanceof Response) return body;

  try {
    return validatedJson(coachSuccessSchema, { data: await service.ask(body.messages) }, 200);
  } catch (error) {
    return coachProviderErrorResponse(error);
  }
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

async function dispatchEligibleSessions(request: Request, url: URL, repository: SessionRepository): Promise<Response> {
  const queryError = validateQuery(url);
  if (queryError) return queryError;
  if (request.method !== listEligibleSessionsRoute.method) return errorResponse(405, API_ERRORS.methodNotAllowed);
  return validatedJson(listEligibleSessionsRoute.responses[200], { data: await repository.listEligible() }, 200);
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

async function dispatchSessionActivation(
  request: Request,
  url: URL,
  sessionId: string,
  repository: LiveCookRepository,
): Promise<Response> {
  const queryError = validateQuery(url);
  if (queryError) return queryError;
  const params = activateCookingSessionRoute.paramsSchema.safeParse({ sessionId });
  if (!params.success)
    return errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(params.error, "path"));
  if (request.method !== activateCookingSessionRoute.method) return errorResponse(405, API_ERRORS.methodNotAllowed);
  const body = await parseBody(request, activateCookingSessionRoute.bodySchema);
  if (body instanceof Response) return body;
  try {
    return validatedJson(liveCookSuccessSchema, { data: repository.activateSession(sessionId, body) }, 200);
  } catch (error) {
    return liveCookErrorResponse(error);
  }
}

function dispatchCookingSessionDetail(
  request: Request,
  url: URL,
  sessionId: string,
  repository: LiveCookRepository,
): Response {
  const queryError = validateQuery(url);
  if (queryError) return queryError;
  const params = getLiveCookingSessionRoute.paramsSchema.safeParse({ sessionId });
  if (!params.success)
    return errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(params.error, "path"));
  if (request.method !== getLiveCookingSessionRoute.method) return errorResponse(405, API_ERRORS.methodNotAllowed);
  try {
    return validatedJson(liveCookSuccessSchema, { data: repository.get(sessionId) }, 200);
  } catch (error) {
    return liveCookErrorResponse(error);
  }
}

async function dispatchCookingSessionNote(
  request: Request,
  url: URL,
  sessionId: string,
  repository: LiveCookRepository,
): Promise<Response> {
  const queryError = validateQuery(url);
  if (queryError) return queryError;
  const params = addLiveCookingSessionNoteRoute.paramsSchema.safeParse({ sessionId });
  if (!params.success)
    return errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(params.error, "path"));
  if (request.method !== addLiveCookingSessionNoteRoute.method) return errorResponse(405, API_ERRORS.methodNotAllowed);
  const body = await parseBody(request, addLiveCookingSessionNoteRoute.bodySchema);
  if (body instanceof Response) return body;
  if (!body.note) throw new Error("Validated live-cook note body has no note");
  try {
    return validatedJson(liveCookSuccessSchema, { data: repository.addNote(sessionId, body.note) }, 200);
  } catch (error) {
    return liveCookErrorResponse(error);
  }
}

async function dispatchCookingSessionCommand(
  request: Request,
  url: URL,
  sessionId: string,
  action: LiveCookAction,
  repository: LiveCookRepository,
): Promise<Response> {
  const queryError = validateQuery(url);
  if (queryError) return queryError;
  const route = cookingSessionCommandRoutes[action];
  const params = route.paramsSchema.safeParse({ sessionId });
  if (!params.success)
    return errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(params.error, "path"));
  if (request.method !== route.method) return errorResponse(405, API_ERRORS.methodNotAllowed);
  const body = await parseBody(request, route.bodySchema);
  if (body instanceof Response) return body;
  try {
    return validatedJson(liveCookSuccessSchema, { data: repository.command(action, body, sessionId) }, 200);
  } catch (error) {
    return liveCookErrorResponse(error);
  }
}

function dispatchOptionalActiveSession(request: Request, url: URL, repository: LiveCookRepository): Response {
  const queryError = validateQuery(url);
  if (queryError) return queryError;
  if (request.method !== findActiveCookingSessionRoute.method) return errorResponse(405, API_ERRORS.methodNotAllowed);
  const active = repository.findActive();
  return active ? validatedJson(liveCookSuccessSchema, { data: active }, 200) : new Response(null, { status: 204 });
}

function validateQuery(url: URL): Response | undefined {
  const query = findActiveCookingSessionRoute.querySchema.safeParse(Object.fromEntries(url.searchParams));
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

function requireCoachService(service: CoachService | undefined): CoachService {
  if (!service) throw new Error("Coach service is required for coach routes");
  return service;
}

function requireSessionRepository(repository: SessionRepository | undefined): SessionRepository {
  if (!repository) throw new Error("Session repository is required for cooking-session routes");
  return repository;
}

function requireLiveCookRepository(repository: LiveCookRepository | undefined): LiveCookRepository {
  if (!repository) throw new Error("Live-cook repository is required for live-cook routes");
  return repository;
}

async function parseBody<T>(
  request: Request,
  schema: {
    safeParse(value: unknown): { success: true; data: T } | { success: false; error: import("zod").ZodError };
  },
): Promise<T | Response> {
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

function coachProviderErrorResponse(error: unknown): Response {
  if (error instanceof CoachConfigurationError) return errorResponse(503, API_ERRORS.coachConfiguration);
  if (!(error instanceof CoachProviderError)) throw error;
  switch (error.kind) {
    case "rejected":
      return errorResponse(502, API_ERRORS.coachProviderRejected);
    case "unavailable":
      return errorResponse(503, API_ERRORS.coachProviderUnavailable);
    case "malformed_output":
      return errorResponse(502, API_ERRORS.coachProviderInvalidResponse);
    default:
      throw new Error(`Unhandled coach provider failure: ${error.kind}`);
  }
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
  status: 400 | 404 | 405 | 409 | 502 | 503,
  error: { readonly code: string; readonly message: string },
  issues: { readonly path: string; readonly code: string; readonly message: string }[] = [],
): Response {
  return validatedJson(apiErrorSchema, { error: { ...error, issues } }, status);
}

function validatedJson(
  schema: { parse(value: unknown): unknown },
  body: unknown,
  status: 200 | 201 | 400 | 404 | 405 | 409 | 502 | 503,
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
