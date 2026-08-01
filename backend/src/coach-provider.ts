import type { CoachChat, CoachResult, CoachSuggestion } from "./coach-contract";
import type { ContextSnapshotV1 } from "./coach-context";

export interface CoachTool {
  readonly name: "recommend_next_action" | "highlight_cook_risk";
  readonly description: string;
  readonly inputSchema: {
    readonly type: "object";
    readonly additionalProperties: false;
    readonly properties: {
      readonly title: { readonly type: "string"; readonly minLength: 1; readonly maxLength: 120 };
      readonly rationale: { readonly type: "string"; readonly minLength: 1; readonly maxLength: 500 };
    };
    readonly required: readonly ["title", "rationale"];
  };
  readonly outputKind: CoachSuggestion["kind"];
}

export interface CoachProviderRequest {
  readonly model: string;
  readonly chat: CoachChat;
  readonly context: ContextSnapshotV1;
  readonly systemPrompt: string;
  readonly tools: readonly CoachTool[];
}

type CoachProviderFailureKind = "rejected" | "unavailable" | "malformed_output";

export class CoachProviderError extends Error {
  constructor(readonly kind: CoachProviderFailureKind) {
    super(`Coach provider failure: ${kind}`);
    this.name = "CoachProviderError";
  }
}

export interface CoachProvider {
  complete(request: CoachProviderRequest): Promise<CoachResult>;
}
