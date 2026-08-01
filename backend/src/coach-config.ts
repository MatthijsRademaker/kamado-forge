export interface CoachEnvironment {
  readonly COACH_PROVIDER?: string;
}

type CoachProviderMode = "disabled" | "fake";

export function resolveCoachProviderMode(environment: CoachEnvironment): CoachProviderMode {
  switch (environment.COACH_PROVIDER) {
    case undefined:
    case "disabled":
      return "disabled";
    case "fake":
      return "fake";
    default:
      throw new Error(`Unsupported COACH_PROVIDER: ${environment.COACH_PROVIDER}`);
  }
}
