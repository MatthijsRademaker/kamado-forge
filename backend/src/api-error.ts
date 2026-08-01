import { z } from "./schema";

const validationIssueSchema = z
  .object({ path: z.string(), code: z.string(), message: z.string() })
  .strict()
  .openapi("ValidationIssue");

export const apiErrorSchema = z
  .object({
    error: z.object({ code: z.string(), message: z.string(), issues: z.array(validationIssueSchema) }).strict(),
  })
  .strict()
  .openapi("ApiError");

export type ValidationIssue = z.infer<typeof validationIssueSchema>;
