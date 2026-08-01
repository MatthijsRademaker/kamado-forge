import { apiErrorSchema } from "./api-error";
import { z } from "./schema";

const requiredTextSchema = z.string().trim().min(1);
const contextTextSchema = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0);
const questionSchema = requiredTextSchema.max(2_000);
const utcTimestampSchema = z.string().datetime({ offset: false });

export const coachRequestSchema = z.object({ question: questionSchema }).strict().openapi("CoachQuestionRequest");

const noCoachContextSchema = z.object({ kind: z.literal("none") }).strict();
const activeCoachContextSchema = z
  .object({
    kind: z.literal("active"),
    sessionId: z.string().uuid(),
    sessionTitle: contextTextSchema,
    sessionStatus: z.enum(["ACTIVE", "PAUSED"]),
    phaseTitle: contextTextSchema,
    stepOrdinal: z.number().int().min(0),
    stepTitle: contextTextSchema,
    projectedAt: utcTimestampSchema,
  })
  .strict();

export const coachContextSchema = z
  .discriminatedUnion("kind", [noCoachContextSchema, activeCoachContextSchema])
  .openapi("CoachContext");

export const coachProviderOutputSchema = z
  .object({
    answer: requiredTextSchema,
    guidance: z.array(requiredTextSchema),
    warnings: z.array(requiredTextSchema),
    suggestedFollowUps: z.array(requiredTextSchema),
  })
  .strict()
  .openapi("CoachProviderOutput");

const coachResultSchema = coachProviderOutputSchema
  .extend({ contextUsed: coachContextSchema })
  .strict()
  .openapi("CoachResult");

export const coachSuccessSchema = z.object({ data: coachResultSchema }).strict().openapi("CoachSuccess");

const coachQuerySchema = z.object({}).strict().openapi("CoachQuery");

export const coachRoute = {
  method: "POST",
  runtimePath: "/api/coach",
  openApiPath: "/coach",
  operationId: "askCoach",
  summary: "Ask the context-aware cooking coach",
  querySchema: coachQuerySchema,
  bodySchema: coachRequestSchema,
  responses: {
    200: coachSuccessSchema,
    400: apiErrorSchema,
    405: apiErrorSchema,
    429: apiErrorSchema,
    502: apiErrorSchema,
    503: apiErrorSchema,
    504: apiErrorSchema,
  },
} as const;

export type CoachContext = z.infer<typeof coachContextSchema>;
export type CoachProviderOutput = z.infer<typeof coachProviderOutputSchema>;
export type CoachResult = z.infer<typeof coachResultSchema>;
