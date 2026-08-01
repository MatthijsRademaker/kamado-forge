import { apiErrorSchema, type ValidationIssue } from "./api-error";
import { coachRoute } from "./coach-contract";
import { z, type ZodError } from "./schema";
import {
  activateCookingSessionRoute,
  addLiveCookingSessionNoteRoute,
  cookingSessionCommandRoutes,
  findActiveCookingSessionRoute,
  getLiveCookingSessionRoute,
} from "./live-cook-contract";
import {
  sessionIdParamsSchema,
  sessionListSuccessSchema,
  sessionSuccessSchema,
  sessionWriteSchema,
} from "./session-contract";

const healthQuerySchema = z.object({}).strict().openapi("HealthQuery");
const databaseHealthSchema = z
  .object({ status: z.literal("ok") })
  .strict()
  .openapi("DatabaseHealth");
const healthDataSchema = z
  .object({ ok: z.literal(true), service: z.literal("api"), database: databaseHealthSchema })
  .strict()
  .openapi("HealthDataV1");
export const healthSuccessSchema = z.object({ data: healthDataSchema }).strict().openapi("HealthSuccessV1");

export const API_ERRORS = {
  validation: { code: "VALIDATION_ERROR", message: "Request validation failed" },
  notFound: { code: "NOT_FOUND", message: "Route not found" },
  methodNotAllowed: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
  liveCookNotFound: { code: "NOT_FOUND", message: "Cooking session not found" },
  invalidDraft: { code: "INVALID_DRAFT", message: "Live-cook draft cannot be activated" },
  invalidTransition: { code: "INVALID_TRANSITION", message: "Live-cook command is not permitted in the current state" },
  activeSessionConflict: { code: "ACTIVE_SESSION_CONFLICT", message: "Another live-cook session is already active" },
  sessionNotFound: { code: "SESSION_NOT_FOUND", message: "Cooking session not found" },
  coachProviderDisabled: { code: "COACH_PROVIDER_DISABLED", message: "Coach provider is not configured" },
  coachProviderTimeout: { code: "COACH_PROVIDER_TIMEOUT", message: "Coach provider timed out" },
  coachProviderUnavailable: { code: "COACH_PROVIDER_UNAVAILABLE", message: "Coach provider is unavailable" },
  coachProviderRateLimited: {
    code: "COACH_PROVIDER_RATE_LIMITED",
    message: "Coach provider rate limit reached",
  },
  coachProviderInvalidOutput: {
    code: "COACH_PROVIDER_INVALID_OUTPUT",
    message: "Coach provider returned invalid output",
  },
} as const;

export const healthRoute = {
  method: "GET",
  runtimePath: "/api/health",
  openApiPath: "/health",
  operationId: "getHealth",
  querySchema: healthQuerySchema,
  responses: { 200: healthSuccessSchema, 400: apiErrorSchema, 404: apiErrorSchema, 405: apiErrorSchema },
} as const;

const sessionQuerySchema = z.object({}).strict().openapi("CookingSessionQuery");

export const createSessionRoute = {
  method: "POST",
  runtimePath: "/api/sessions",
  openApiPath: "/sessions",
  operationId: "createCookingSession",
  summary: "Create a draft cooking session",
  querySchema: sessionQuerySchema,
  bodySchema: sessionWriteSchema,
  responses: { 201: sessionSuccessSchema, 400: apiErrorSchema, 405: apiErrorSchema },
} as const;

export const listSessionsRoute = {
  method: "GET",
  runtimePath: "/api/sessions",
  openApiPath: "/sessions",
  operationId: "listCookingSessions",
  summary: "List draft cooking sessions",
  querySchema: sessionQuerySchema,
  responses: { 200: sessionListSuccessSchema, 400: apiErrorSchema, 405: apiErrorSchema },
} as const;

export const listEligibleSessionsRoute = {
  method: "GET",
  runtimePath: "/api/sessions/eligible",
  openApiPath: "/sessions/eligible",
  operationId: "listEligibleCookingSessions",
  summary: "List cooking sessions eligible for activation",
  querySchema: sessionQuerySchema,
  responses: { 200: sessionListSuccessSchema, 400: apiErrorSchema, 405: apiErrorSchema },
} as const;

export const getSessionRoute = {
  method: "GET",
  runtimePath: "/api/sessions/{sessionId}",
  openApiPath: "/sessions/{sessionId}",
  operationId: "getCookingSession",
  summary: "Get a draft cooking session",
  querySchema: sessionQuerySchema,
  paramsSchema: sessionIdParamsSchema,
  responses: { 200: sessionSuccessSchema, 400: apiErrorSchema, 404: apiErrorSchema, 405: apiErrorSchema },
} as const;

export const updateSessionRoute = {
  method: "PUT",
  runtimePath: "/api/sessions/{sessionId}",
  openApiPath: "/sessions/{sessionId}",
  operationId: "updateCookingSession",
  summary: "Replace a draft cooking session",
  querySchema: sessionQuerySchema,
  paramsSchema: sessionIdParamsSchema,
  bodySchema: sessionWriteSchema,
  responses: { 200: sessionSuccessSchema, 400: apiErrorSchema, 404: apiErrorSchema, 405: apiErrorSchema },
} as const;

export const deleteSessionRoute = {
  method: "DELETE",
  runtimePath: "/api/sessions/{sessionId}",
  openApiPath: "/sessions/{sessionId}",
  operationId: "deleteCookingSession",
  summary: "Delete a draft cooking session",
  querySchema: sessionQuerySchema,
  paramsSchema: sessionIdParamsSchema,
  responses: { 204: null, 400: apiErrorSchema, 404: apiErrorSchema, 405: apiErrorSchema },
  responseDescriptions: { 204: "Draft cooking session deleted" },
} as const;

export const apiRouteRegistry = [
  healthRoute,
  coachRoute,
  createSessionRoute,
  listSessionsRoute,
  listEligibleSessionsRoute,
  getSessionRoute,
  updateSessionRoute,
  deleteSessionRoute,
  activateCookingSessionRoute,
  findActiveCookingSessionRoute,
  getLiveCookingSessionRoute,
  addLiveCookingSessionNoteRoute,
  ...Object.values(cookingSessionCommandRoutes),
] as const;

export { apiErrorSchema, sessionWriteSchema };
export type HealthData = z.infer<typeof healthDataSchema>;
type ValidationContext = "body" | "path" | "query";

export function normalizeValidationIssues(error: ZodError, context: ValidationContext = "query"): ValidationIssue[] {
  const issues = error.issues.flatMap((issue): ValidationIssue[] => {
    if (issue.code === "unrecognized_keys") {
      const parentPath = issue.path.length > 0 ? `.${issue.path.join(".")}` : "";
      return issue.keys.map((key) => ({
        path: `${context}${parentPath}.${key}`,
        code: `unexpected_${context === "query" ? "query_parameter" : context === "path" ? "path_parameter" : "body_field"}`,
        message: context === "query" ? `Unexpected query parameter: ${key}` : `Unexpected ${context} field: ${key}`,
      }));
    }
    const suffix = issue.path.length > 0 ? `.${issue.path.join(".")}` : "";
    return [
      {
        path: `${context}${suffix}`,
        code: `invalid_${context === "query" ? "query_parameter" : context === "path" ? "path_parameter" : "body_field"}`,
        message: `Invalid ${context} value`,
      },
    ];
  });
  return issues.sort(
    (left, right) =>
      compareLexicographically(left.path, right.path) ||
      compareLexicographically(left.code, right.code) ||
      compareLexicographically(left.message, right.message),
  );
}

function compareLexicographically(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
