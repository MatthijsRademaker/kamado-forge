export interface CoachEnvironment {
  readonly COACH_PROVIDER?: string;
  readonly COACH_MODEL?: string;
  readonly OPENAI_API_KEY?: string;
}

interface OpenAiCoachConfiguration {
  readonly provider: "openai";
  readonly model: string;
  readonly apiKey: string;
}

export class CoachConfigurationError extends Error {
  constructor() {
    super("Coach provider configuration is missing or invalid");
    this.name = "CoachConfigurationError";
  }
}

export function resolveCoachConfiguration(environment: CoachEnvironment): OpenAiCoachConfiguration {
  if (
    environment.COACH_PROVIDER !== "openai" ||
    !isConfiguredValue(environment.COACH_MODEL) ||
    !isConfiguredValue(environment.OPENAI_API_KEY)
  ) {
    throw new CoachConfigurationError();
  }

  return {
    provider: "openai",
    model: environment.COACH_MODEL,
    apiKey: environment.OPENAI_API_KEY,
  };
}

function isConfiguredValue(value: string | undefined): value is string {
  return typeof value === "string" && value.length > 0 && value === value.trim();
}
