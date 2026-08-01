import { coachProviderOutputSchema, type CoachProviderOutput, type CoachResult } from "./coach-contract";
import { reduceCoachContext, type CoachContextSource } from "./coach-context";
import { CoachProviderError, type CoachProvider, type CoachProviderInput } from "./coach-provider";

interface CoachServiceDependencies {
  readonly contextSource: CoachContextSource;
  readonly provider: CoachProvider;
}

export interface CoachService {
  ask(question: string): Promise<CoachResult>;
}

export function createCoachService({ contextSource, provider }: CoachServiceDependencies): CoachService {
  return {
    async ask(question) {
      const context = reduceCoachContext(contextSource);
      const input = deepFreeze<CoachProviderInput>({ question, context });
      const result = coachProviderOutputSchema.safeParse(await provider.complete(input));
      if (!result.success) throw new CoachProviderError("invalid_output");
      return { ...cloneOutput(result.data), contextUsed: context };
    },
  };
}

function cloneOutput(output: CoachProviderOutput): CoachProviderOutput {
  return {
    answer: output.answer,
    guidance: [...output.guidance],
    warnings: [...output.warnings],
    suggestedFollowUps: [...output.suggestedFollowUps],
  };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}
