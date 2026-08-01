import type { CoachContext, CoachProviderOutput } from "./coach-contract";

export interface CoachProviderInput {
  readonly question: string;
  readonly context: CoachContext;
}

export type CoachProviderFailureKind = "disabled" | "timeout" | "unavailable" | "rate_limited" | "invalid_output";

export class CoachProviderError extends Error {
  constructor(readonly kind: CoachProviderFailureKind) {
    super(`Coach provider failure: ${kind}`);
    this.name = "CoachProviderError";
  }
}

export interface CoachProvider {
  complete(input: CoachProviderInput): Promise<unknown>;
}

export function createDisabledCoachProvider(): CoachProvider {
  return {
    async complete(): Promise<CoachProviderOutput> {
      throw new CoachProviderError("disabled");
    },
  };
}
