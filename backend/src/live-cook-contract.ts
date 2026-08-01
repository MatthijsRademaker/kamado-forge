import { z } from "./schema";

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

const plannedStepWriteSchema = z
  .object({
    ordinal: z.number().int().min(0),
    title: requiredTextSchema,
    instructions: requiredTextSchema,
    durationMinutes: z.number().int().min(1).max(1440),
  })
  .strict()
  .openapi("LiveCookPlannedStepWrite");

export const createLiveDraftBodySchema = z
  .object({
    steps: z.array(plannedStepWriteSchema).min(1),
  })
  .strict()
  .superRefine(({ steps }, context) => {
    for (const [index, step] of steps.entries()) {
      if (step.ordinal !== index) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps", index, "ordinal"],
          message: "Step ordinals must be contiguous and ordered from zero",
        });
      }
    }
  })
  .openapi("CreateLiveDraftRequest");

const plannedStepReadSchema = plannedStepWriteSchema
  .extend({ id: opaqueIdSchema })
  .strict()
  .openapi("LiveCookPlannedStep");

const liveDraftSchema = z
  .object({
    id: opaqueIdSchema,
    createdAt: utcTimestampSchema,
    steps: z.array(plannedStepReadSchema).min(1),
  })
  .strict()
  .openapi("LiveCookDraft");

export const liveDraftSuccessSchema = z.object({ data: liveDraftSchema }).strict().openapi("LiveCookDraftSuccess");

const liveCookQuerySchema = z.object({}).strict().openapi("LiveCookQuery");

export const createLiveDraftRoute = {
  method: "POST",
  runtimePath: "/api/drafts",
  openApiPath: "/drafts",
  operationId: "createLiveCookDraft",
  summary: "Create an ordered live-cook draft",
  querySchema: liveCookQuerySchema,
  bodySchema: createLiveDraftBodySchema,
  responses: {
    201: liveDraftSuccessSchema,
    ...liveCookErrorResponses,
  },
} as const;

const liveCookCommandBodySchema = z
  .object({ note: requiredTextSchema.optional() })
  .strict()
  .openapi("LiveCookCommandRequest");

const liveSessionStatusSchema = z.enum(["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]).openapi("LiveCookSessionStatus");

const sessionStepSchema = plannedStepReadSchema.openapi("LiveCookSessionStep");

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
    notes: z.array(stepNoteSchema),
  })
  .strict()
  .openapi("LiveCookExecution");

const executionVisitSchema = executionSchema
  .extend({ step: sessionStepSchema })
  .strict()
  .openapi("LiveCookExecutionVisit");

const currentStepSchema = sessionStepSchema
  .extend({ execution: executionSchema })
  .strict()
  .openapi("LiveCookCurrentStep");

const liveCookProjectionSchema = z
  .object({
    id: opaqueIdSchema,
    status: liveSessionStatusSchema,
    activatedAt: utcTimestampSchema,
    currentStep: currentStepSchema.nullable(),
    nextStep: sessionStepSchema.nullable(),
    executionHistory: z.array(executionVisitSchema),
  })
  .strict()
  .openapi("LiveCookSession");

export const liveCookSuccessSchema = z
  .object({ data: liveCookProjectionSchema })
  .strict()
  .openapi("LiveCookSessionSuccess");

const liveDraftIdParamsSchema = z.object({ draftId: opaqueIdSchema }).strict().openapi("LiveCookDraftIdParams");

export const activateLiveDraftRoute = {
  method: "POST",
  runtimePath: "/api/drafts/:draftId/activate",
  openApiPath: "/drafts/{draftId}/activate",
  operationId: "activateLiveCookDraft",
  summary: "Activate a live-cook draft",
  querySchema: liveCookQuerySchema,
  paramsSchema: liveDraftIdParamsSchema,
  bodySchema: liveCookCommandBodySchema,
  responses: {
    200: liveCookSuccessSchema,
    ...liveCookErrorResponses,
  },
} as const;

const noNoteCommandBodySchema = z.object({}).strict().openapi("LiveCookStatusCommandRequest");

function liveSessionCommandRoute(action: "advance" | "return" | "pause" | "resume" | "complete" | "cancel") {
  const acceptsNote = action === "advance" || action === "return" || action === "complete" || action === "cancel";
  return {
    method: "POST",
    runtimePath: `/api/live-session/${action}`,
    openApiPath: `/live-session/${action}`,
    operationId: `${action}LiveCookSession`,
    summary: `${action[0]?.toUpperCase()}${action.slice(1)} the live-cook session`,
    querySchema: liveCookQuerySchema,
    bodySchema: acceptsNote ? liveCookCommandBodySchema : noNoteCommandBodySchema,
    responses: { 200: liveCookSuccessSchema, ...liveCookErrorResponses },
  } as const;
}

export const getActiveLiveSessionRoute = {
  method: "GET",
  runtimePath: "/api/live-session",
  openApiPath: "/live-session",
  operationId: "getActiveLiveCookSession",
  summary: "Get the active live-cook session",
  querySchema: liveCookQuerySchema,
  responses: { 200: liveCookSuccessSchema, ...liveCookErrorResponses },
} as const;
export const advanceLiveSessionRoute = liveSessionCommandRoute("advance");
export const returnLiveSessionRoute = liveSessionCommandRoute("return");
export const pauseLiveSessionRoute = liveSessionCommandRoute("pause");
export const resumeLiveSessionRoute = liveSessionCommandRoute("resume");
export const completeLiveSessionRoute = liveSessionCommandRoute("complete");
export const cancelLiveSessionRoute = liveSessionCommandRoute("cancel");

export const liveSessionCommandRoutes = {
  advance: advanceLiveSessionRoute,
  return: returnLiveSessionRoute,
  pause: pauseLiveSessionRoute,
  resume: resumeLiveSessionRoute,
  complete: completeLiveSessionRoute,
  cancel: cancelLiveSessionRoute,
} as const;

export type LiveCookAction = keyof typeof liveSessionCommandRoutes;
export type CreateLiveDraft = z.infer<typeof createLiveDraftBodySchema>;
export type LiveCookCommand = z.infer<typeof liveCookCommandBodySchema>;
export type LiveCookDraft = z.infer<typeof liveDraftSchema>;
export type LiveCookProjection = z.infer<typeof liveCookProjectionSchema>;
