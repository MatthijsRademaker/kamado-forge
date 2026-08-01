import { z } from "./schema";
import { sessionIdParamsSchema, sessionReadSchema } from "./session-contract";

const requiredTextSchema = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0, { message: "Text must not be blank" });
const opaqueIdSchema = z.string().uuid();
const utcTimestampSchema = z.string().datetime({ offset: false });
const liveCookErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        issues: z.array(z.object({ path: z.string(), code: z.string(), message: z.string() }).strict()),
      })
      .strict(),
  })
  .strict()
  .openapi("ApiError");
const liveCookErrorResponses = {
  400: liveCookErrorSchema,
  404: liveCookErrorSchema,
  405: liveCookErrorSchema,
  409: liveCookErrorSchema,
} as const;

const plannedStepFields = {
  ordinal: z.number().int().min(0),
  title: requiredTextSchema,
  instructions: requiredTextSchema,
  durationMinutes: z.number().int().min(1).max(1440),
};
const liveCookSessionStepFields = { id: opaqueIdSchema, ...plannedStepFields };

const liveCookQuerySchema = z.object({}).strict().openapi("LiveCookQuery");

const liveCookCommandBodySchema = z
  .object({ note: requiredTextSchema.optional() })
  .strict()
  .openapi("LiveCookCommandRequest");

const liveCookNoteBodySchema = z.object({ note: requiredTextSchema }).strict().openapi("LiveCookNoteRequest");

const liveSessionStatusSchema = z.enum(["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).openapi("LiveCookSessionStatus");

const sessionStepSchema = z.object(liveCookSessionStepFields).strict().openapi("LiveCookSessionStep");

const stepNoteSchema = z
  .object({
    id: opaqueIdSchema,
    ordinal: z.number().int().min(0),
    content: requiredTextSchema,
    createdAt: utcTimestampSchema,
  })
  .strict()
  .openapi("LiveCookStepNote");

const executionSchema = z
  .object({
    id: opaqueIdSchema,
    ordinal: z.number().int().min(0),
    actualStartedAt: utcTimestampSchema,
    actualFinishedAt: utcTimestampSchema.nullable(),
    cancelledAt: utcTimestampSchema.nullable(),
    elapsedSeconds: z.number().int().min(0),
    notes: z.array(stepNoteSchema),
  })
  .strict()
  .openapi("LiveCookExecution");

const executionVisitSchema = executionSchema
  .extend({ step: sessionStepSchema })
  .strict()
  .openapi("LiveCookExecutionVisit");

const nullableCurrentStepSchema = z
  .object({ ...liveCookSessionStepFields, execution: executionSchema })
  .strict()
  .nullable()
  .openapi("LiveCookCurrentStep");
const nullableNextStepSchema = z.object(liveCookSessionStepFields).strict().nullable().openapi("LiveCookNextStep");
const liveCookProgressSchema = z
  .object({
    currentStepOrdinal: z.number().int().min(0),
    totalSteps: z.number().int().min(1),
    percent: z.number().int().min(0).max(100),
  })
  .strict()
  .openapi("LiveCookProgress");

const liveCookProjectionSchema = z
  .object({
    id: opaqueIdSchema,
    status: liveSessionStatusSchema,
    activatedAt: utcTimestampSchema,
    projectedAt: utcTimestampSchema,
    plan: sessionReadSchema,
    currentStep: nullableCurrentStepSchema,
    nextStep: nullableNextStepSchema,
    progress: liveCookProgressSchema,
    executionHistory: z.array(executionVisitSchema),
  })
  .strict()
  .openapi("LiveCookSession");

export const liveCookSuccessSchema = z
  .object({ data: liveCookProjectionSchema })
  .strict()
  .openapi("LiveCookSessionSuccess");

export const activateCookingSessionRoute = {
  method: "POST",
  runtimePath: "/api/sessions/:sessionId/activate",
  openApiPath: "/sessions/{sessionId}/activate",
  operationId: "activateCookingSession",
  summary: "Activate a persisted cooking session",
  querySchema: liveCookQuerySchema,
  paramsSchema: sessionIdParamsSchema,
  bodySchema: liveCookCommandBodySchema,
  responses: {
    200: liveCookSuccessSchema,
    ...liveCookErrorResponses,
  },
} as const;

const noNoteCommandBodySchema = z.object({}).strict().openapi("LiveCookStatusCommandRequest");

export const getLiveCookingSessionRoute = {
  method: "GET",
  runtimePath: "/api/live-sessions/:sessionId",
  openApiPath: "/live-sessions/{sessionId}",
  operationId: "getLiveCookingSession",
  summary: "Get a live or terminal cooking session",
  querySchema: liveCookQuerySchema,
  paramsSchema: sessionIdParamsSchema,
  responses: { 200: liveCookSuccessSchema, ...liveCookErrorResponses },
} as const;

export const addLiveCookingSessionNoteRoute = {
  method: "POST",
  runtimePath: "/api/live-sessions/:sessionId/notes",
  openApiPath: "/live-sessions/{sessionId}/notes",
  operationId: "addLiveCookingSessionNote",
  summary: "Add a note to the current cooking step",
  querySchema: liveCookQuerySchema,
  paramsSchema: sessionIdParamsSchema,
  bodySchema: liveCookNoteBodySchema,
  responses: { 200: liveCookSuccessSchema, ...liveCookErrorResponses },
} as const;

function cookingSessionCommandRoute(action: "advance" | "return" | "pause" | "resume" | "complete" | "cancel") {
  const acceptsNote = action === "advance" || action === "return" || action === "complete" || action === "cancel";
  return {
    method: "POST",
    runtimePath: `/api/live-sessions/:sessionId/${action}`,
    openApiPath: `/live-sessions/{sessionId}/${action}`,
    operationId: `${action}CookingSession`,
    summary: `${action[0]?.toUpperCase()}${action.slice(1)} the cooking session`,
    querySchema: liveCookQuerySchema,
    paramsSchema: sessionIdParamsSchema,
    bodySchema: acceptsNote ? liveCookCommandBodySchema : noNoteCommandBodySchema,
    responses: { 200: liveCookSuccessSchema, ...liveCookErrorResponses },
  } as const;
}

export const cookingSessionCommandRoutes = {
  advance: cookingSessionCommandRoute("advance"),
  return: cookingSessionCommandRoute("return"),
  pause: cookingSessionCommandRoute("pause"),
  resume: cookingSessionCommandRoute("resume"),
  complete: cookingSessionCommandRoute("complete"),
  cancel: cookingSessionCommandRoute("cancel"),
} as const;

export const findActiveCookingSessionRoute = {
  method: "GET",
  runtimePath: "/api/live-sessions/active",
  openApiPath: "/live-sessions/active",
  operationId: "findActiveCookingSession",
  summary: "Find the active cooking session",
  querySchema: liveCookQuerySchema,
  responses: { 200: liveCookSuccessSchema, 204: null, ...liveCookErrorResponses },
  responseDescriptions: { 204: "No active cooking session" },
} as const;

export type LiveCookAction = keyof typeof cookingSessionCommandRoutes;
export type LiveCookCommand = z.infer<typeof liveCookCommandBodySchema>;
export type LiveCookProjection = z.infer<typeof liveCookProjectionSchema>;
