import type { CoachResult } from "./coach-contract";
import { CoachProviderError, type CoachProvider, type CoachProviderRequest } from "./coach-provider";

type FakeCoachProviderMode = "success" | "rejected" | "network" | "timeout" | "malformed_output";

interface FakeCoachProviderOptions {
  readonly mode?: FakeCoachProviderMode;
  readonly result?: CoachResult;
}

interface FakeCoachProvider extends CoachProvider {
  readonly requests: CoachProviderRequest[];
}

const stableResult: CoachResult = {
  message: "Make one small adjustment and wait for the kamado to respond.",
  suggestions: [],
};

export function createFakeCoachProvider({
  mode = "success",
  result = stableResult,
}: FakeCoachProviderOptions = {}): FakeCoachProvider {
  const requests: CoachProviderRequest[] = [];

  return {
    requests,
    async complete(request) {
      requests.push(request);
      switch (mode) {
        case "success":
          return structuredClone(result);
        case "rejected":
          throw new CoachProviderError("rejected");
        case "network":
        case "timeout":
          throw new CoachProviderError("unavailable");
        case "malformed_output":
          return { message: "", suggestions: [] };
        default:
          throw new Error(`Unhandled fake coach provider mode: ${mode}`);
      }
    },
  };
}
