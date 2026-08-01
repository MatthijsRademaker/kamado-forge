import { z } from "./schema";

const requiredTextSchema = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0, { message: "Text must not be blank" });
const opaqueIdSchema = z.string().uuid();
const utcTimestampSchema = z.string().datetime({ offset: false });

const cookingDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(isRealCalendarDate, { message: "Invalid calendar date" });

const domeTemperatureSchema = z.number().int().min(150).max(700);
const foodTemperatureSchema = z.number().int().min(32).max(212);

const plannedDomeRangeSchema = z
  .object({
    minF: domeTemperatureSchema,
    maxF: domeTemperatureSchema,
  })
  .strict()
  .superRefine(({ minF, maxF }, context) => {
    if (minF > maxF) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["minF"],
        message: "Minimum dome temperature must not exceed maximum",
      });
    }
  })
  .openapi("PlannedDomeRange");

const sessionStepFields = {
  title: requiredTextSchema,
  instructions: requiredTextSchema,
  durationMinutes: z.number().int().min(1).max(1440),
};

const sessionStepWriteSchema = z.object(sessionStepFields).strict().openapi("CookingSessionStepWrite");

const sessionPhaseWriteSchema = z
  .object({
    title: requiredTextSchema,
    technique: requiredTextSchema,
    transitionGuidance: requiredTextSchema,
    steps: z.array(sessionStepWriteSchema).min(1),
  })
  .strict()
  .openapi("CookingSessionPhaseWrite");

export const sessionWriteSchema = z
  .object({
    title: requiredTextSchema,
    cookingDate: cookingDateSchema,
    plannedDomeRange: plannedDomeRangeSchema,
    plannedFoodTargetF: foodTemperatureSchema.optional(),
    setupGuidance: requiredTextSchema,
    deflectorGuidance: requiredTextSchema,
    heatZoneGuidance: requiredTextSchema,
    ventGuidance: requiredTextSchema,
    prepNotes: requiredTextSchema,
    phases: z.array(sessionPhaseWriteSchema).min(1),
  })
  .strict()
  .openapi("CookingSessionWrite");

const sessionStepReadSchema = z
  .object({ ...sessionStepFields, id: opaqueIdSchema })
  .strict()
  .openapi("CookingSessionStep");

const sessionPhaseReadSchema = sessionPhaseWriteSchema
  .omit({ steps: true })
  .extend({
    id: opaqueIdSchema,
    steps: z.array(sessionStepReadSchema).min(1),
  })
  .strict()
  .openapi("CookingSessionPhase");

export const sessionReadSchema = sessionWriteSchema
  .omit({ phases: true })
  .extend({
    id: opaqueIdSchema,
    status: z.literal("draft"),
    createdAt: utcTimestampSchema,
    updatedAt: utcTimestampSchema,
    phases: z.array(sessionPhaseReadSchema).min(1),
  })
  .strict()
  .openapi("CookingSession");

export const sessionIdParamsSchema = z.object({ sessionId: opaqueIdSchema }).strict().openapi("CookingSessionIdParams");

export const sessionSuccessSchema = z.object({ data: sessionReadSchema }).strict().openapi("CookingSessionSuccess");

export const sessionListSuccessSchema = z
  .object({ data: z.array(sessionReadSchema) })
  .strict()
  .openapi("CookingSessionListSuccess");

export type SessionWrite = z.infer<typeof sessionWriteSchema>;
export type SessionRead = z.infer<typeof sessionReadSchema>;

function isRealCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year === 0) return false;

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
