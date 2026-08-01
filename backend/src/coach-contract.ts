import { apiErrorSchema } from "./api-error";
import { z } from "./schema";

const boundedText = (maximum: number) =>
  z
    .string()
    .min(1)
    .max(maximum)
    .refine((value) => value.length === 0 || value.trim().length > 0, { message: "Text must not be blank" });

const boundedChatContent = z.string().trim().min(1).max(2_000);

const coachMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: boundedChatContent,
  })
  .strict()
  .openapi("CoachChatMessage");

export const coachRequestSchema = z
  .object({ messages: z.array(coachMessageSchema).min(1).max(20) })
  .strict()
  .superRefine(({ messages }, context) => {
    if (messages.at(-1)?.role !== "user") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["messages"],
        message: "The final chat message must be from the user",
      });
    }
    if (messages.reduce((length, message) => length + message.content.length, 0) > 12_000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["messages"],
        message: "Chat content exceeds the total limit",
      });
    }
  })
  .openapi("CoachRequest");

const suggestionFields = {
  title: boundedText(120),
  rationale: boundedText(500),
};

export const coachSuggestionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("next_action"), ...suggestionFields }).strict(),
  z.object({ kind: z.literal("caution"), ...suggestionFields }).strict(),
]);

export const coachResultSchema = z
  .object({
    message: boundedText(4_000),
    suggestions: z.array(coachSuggestionSchema).max(4),
  })
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
    502: apiErrorSchema,
    503: apiErrorSchema,
  },
} as const;

export type CoachChat = z.infer<typeof coachRequestSchema>["messages"];
export type CoachResult = z.infer<typeof coachResultSchema>;
export type CoachSuggestion = z.infer<typeof coachSuggestionSchema>;
