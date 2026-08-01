import { useMutation } from "@pinia/colada";
import { askCoach } from "./generated/sdk.gen";
import type { ApiError, CoachResult } from "./generated/types.gen";

export class CoachApiRequestError extends Error {
  readonly kind = "api" as const;

  constructor(readonly apiError: ApiError) {
    super(apiError.error.message, { cause: apiError });
    this.name = "CoachApiRequestError";
  }
}

export class CoachTransportError extends Error {
  readonly kind = "transport" as const;

  constructor(cause: unknown) {
    super("Coach could not be reached", { cause });
    this.name = "CoachTransportError";
  }
}

export type CoachMutationError = CoachApiRequestError | CoachTransportError;

export function useAskCoachMutation() {
  return useMutation<CoachResult, string, CoachMutationError>({
    mutation: async (question) => {
      try {
        return (await askCoach({ body: { question }, throwOnError: true })).data.data;
      } catch (error) {
        if (isApiError(error)) throw new CoachApiRequestError(error);
        throw new CoachTransportError(error);
      }
    },
  });
}

function isApiError(value: unknown): value is ApiError {
  if (!isRecord(value) || !isRecord(value.error)) return false;
  const { code, issues, message } = value.error;
  return typeof code === "string" && typeof message === "string" && Array.isArray(issues);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
