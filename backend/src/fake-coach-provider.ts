import type { CoachProviderOutput } from "./coach-contract";
import { CoachProviderError, type CoachProvider, type CoachProviderInput } from "./coach-provider";

type FakeCoachProviderMode = "success" | "timeout" | "unavailable" | "rate_limited" | "invalid_output";

interface FakeCoachProviderOptions {
  readonly mode?: FakeCoachProviderMode;
  readonly output?: CoachProviderOutput;
}

interface FakeCoachProvider extends CoachProvider {
  readonly inputs: CoachProviderInput[];
}

const deterministicOutput: CoachProviderOutput = {
  answer: "Make one small vent adjustment and wait for the kamado to respond.",
  guidance: ["Change only one vent at a time.", "Wait ten minutes before adjusting again."],
  warnings: ["Avoid chasing short thermometer swings."],
  suggestedFollowUps: ["How do I recognize a stable fire?"],
};

export function createFakeCoachProvider({
  mode = "success",
  output = deterministicOutput,
}: FakeCoachProviderOptions = {}): FakeCoachProvider {
  const inputs: CoachProviderInput[] = [];

  return {
    inputs,
    async complete(input) {
      inputs.push(structuredClone(input));
      switch (mode) {
        case "success":
          return structuredClone(output);
        case "timeout":
          throw new CoachProviderError("timeout");
        case "unavailable":
          throw new CoachProviderError("unavailable");
        case "rate_limited":
          throw new CoachProviderError("rate_limited");
        case "invalid_output":
          return { answer: "Incomplete fake output" };
        default:
          throw new Error(`Unhandled fake Coach provider mode: ${mode}`);
      }
    },
  };
}
