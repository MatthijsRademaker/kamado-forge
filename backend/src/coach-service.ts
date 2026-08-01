import { coachResultSchema, type CoachChat, type CoachResult } from "./coach-contract";
import { assembleCoachContext, type ActiveSessionContextSource } from "./coach-context";
import { CoachProviderError, type CoachProvider, type CoachProviderRequest, type CoachTool } from "./coach-provider";

export const COACH_SYSTEM_PROMPT =
  "You are a kamado BBQ cooking coach. Use only the supplied authoritative context for cook facts. Give concise, practical advice. Tool calls are advisory suggestions only and never execute session changes. Do not claim that a step, target, note, timer, or status was changed.";

const suggestionInputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1, maxLength: 120 },
    rationale: { type: "string", minLength: 1, maxLength: 500 },
  },
  required: ["title", "rationale"],
} as const;

export const COACH_TOOLS: readonly CoachTool[] = deepFreeze([
  {
    name: "recommend_next_action",
    description: "Suggest one action for the cook to consider without executing it.",
    inputSchema: suggestionInputSchema,
    outputKind: "next_action",
  },
  {
    name: "highlight_cook_risk",
    description: "Highlight one cooking risk for the cook to consider without changing session state.",
    inputSchema: suggestionInputSchema,
    outputKind: "caution",
  },
]);

interface CoachServiceDependencies {
  readonly contextSource: ActiveSessionContextSource;
  readonly model: string;
  readonly provider: CoachProvider;
}

export interface CoachService {
  ask(chat: CoachChat): Promise<CoachResult>;
}

export function createCoachService({ contextSource, model, provider }: CoachServiceDependencies): CoachService {
  return {
    async ask(chat) {
      const request = deepFreeze<CoachProviderRequest>({
        model,
        chat: structuredClone(chat),
        context: assembleCoachContext(contextSource),
        systemPrompt: COACH_SYSTEM_PROMPT,
        tools: COACH_TOOLS,
      });
      const result = await provider.complete(request);
      const validated = coachResultSchema.safeParse(result);
      if (!validated.success) throw new CoachProviderError("malformed_output");
      return validated.data;
    },
  };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}
