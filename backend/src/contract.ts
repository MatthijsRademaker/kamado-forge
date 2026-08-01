import { z, type ZodError } from "./schema";
import {
  sessionIdParamsSchema,
  sessionListSuccessSchema,
  sessionSuccessSchema,
  sessionWriteSchema,
} from "./session-contract";

const identitySchema = z.string().min(1);
const draftDateSchema = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]);

const plannedDomeTargetSchema = z
  .object({
    value: z.number().int().min(150).max(700).nullable(),
    unit: z.literal("F"),
  })
  .strict()
  .openapi("PlannedDomeTarget");

const plannedFoodTargetSchema = z
  .object({
    value: z.number().int().min(32).max(212).nullable(),
    unit: z.literal("F"),
  })
  .strict()
  .openapi("PlannedFoodTarget");

const sessionPlanStepSchema = z
  .object({
    id: identitySchema,
    title: z.string(),
    durationMinutes: z.number().int().min(1).max(1440),
    instructions: z.string(),
  })
  .strict()
  .openapi("SessionPlanStep");

const sessionPlanPhaseSchema = z
  .object({
    id: identitySchema,
    title: z.string(),
    technique: z.string(),
    transitionGuidance: z.string(),
    steps: z.array(sessionPlanStepSchema),
  })
  .strict()
  .openapi("SessionPlanPhase");

export const sessionPlanSchema = z
  .object({
    id: identitySchema,
    title: z.string(),
    date: draftDateSchema,
    phases: z.array(sessionPlanPhaseSchema),
    plannedDomeTarget: plannedDomeTargetSchema,
    plannedFoodTarget: plannedFoodTargetSchema,
    setup: z.string(),
    ventFireGuidance: z.string(),
    prepNotes: z.string(),
  })
  .strict()
  .openapi("SessionPlan");

const healthQuerySchema = z.object({}).strict().openapi("HealthQuery");

const databaseHealthSchema = z
  .object({
    status: z.literal("ok"),
  })
  .strict()
  .openapi("DatabaseHealth");

const healthDataSchema = z
  .object({
    ok: z.literal(true),
    service: z.literal("api"),
    database: databaseHealthSchema,
  })
  .strict()
  .openapi("HealthDataV1");

export const healthSuccessSchema = z
  .object({
    data: healthDataSchema,
  })
  .strict()
  .openapi("HealthSuccessV1");

const validationIssueSchema = z
  .object({
    path: z.string(),
    code: z.string(),
    message: z.string(),
  })
  .strict()
  .openapi("ValidationIssue");

export const apiErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        issues: z.array(validationIssueSchema),
      })
      .strict(),
  })
  .strict()
  .openapi("ApiError");

export const API_ERRORS = {
  validation: {
    code: "VALIDATION_ERROR",
    message: "Request validation failed",
  },
  notFound: {
    code: "NOT_FOUND",
    message: "Route not found",
  },
  methodNotAllowed: {
    code: "METHOD_NOT_ALLOWED",
    message: "Method not allowed",
  },
  sessionNotFound: {
    code: "SESSION_NOT_FOUND",
    message: "Cooking session not found",
  },
} as const;

export const healthRoute = {
  method: "GET",
  runtimePath: "/api/health",
  openApiPath: "/health",
  operationId: "getHealth",
  querySchema: healthQuerySchema,
  responses: {
    200: healthSuccessSchema,
    400: apiErrorSchema,
    404: apiErrorSchema,
    405: apiErrorSchema,
  },
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
} as const;

export const apiRouteRegistry = [
  healthRoute,
  createSessionRoute,
  listSessionsRoute,
  getSessionRoute,
  updateSessionRoute,
  deleteSessionRoute,
] as const;

export { sessionWriteSchema };
export type HealthData = z.infer<typeof healthDataSchema>;
type ValidationIssue = z.infer<typeof validationIssueSchema>;
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
