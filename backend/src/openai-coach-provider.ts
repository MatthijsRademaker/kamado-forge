import { coachResultSchema, coachSuggestionSchema, type CoachResult, type CoachSuggestion } from "./coach-contract";
import { CoachProviderError, type CoachProvider, type CoachProviderRequest } from "./coach-provider";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export type CoachFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface OpenAiCoachProviderOptions {
  readonly apiKey: string;
  readonly fetch?: CoachFetch;
  readonly timeoutMs?: number;
}

export function createOpenAiCoachProvider({
  apiKey,
  fetch: transport = globalThis.fetch,
  timeoutMs = 30_000,
}: OpenAiCoachProviderOptions): CoachProvider {
  return {
    async complete(request) {
      let response: Response;
      try {
        response = await transport(OPENAI_RESPONSES_URL, {
          method: "POST",
          headers: {
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(toOpenAiRequest(request)),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch {
        throw new CoachProviderError("unavailable");
      }

      if (!response.ok) throw new CoachProviderError("rejected");

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new CoachProviderError("malformed_output");
      }
      return fromOpenAiResponse(payload);
    },
  };
}

function toOpenAiRequest(request: CoachProviderRequest) {
  return {
    model: request.model,
    instructions: `${request.systemPrompt}\n\nAuthoritative context (JSON):\n${JSON.stringify(request.context)}`,
    input: request.chat,
    tools: request.tools.map(({ name, description, inputSchema }) => ({
      type: "function",
      name,
      description,
      parameters: inputSchema,
      strict: true,
    })),
  };
}

function fromOpenAiResponse(payload: unknown): CoachResult {
  if (!isRecord(payload) || !Array.isArray(payload.output)) throw new CoachProviderError("malformed_output");

  const messageParts: string[] = [];
  const suggestions: CoachSuggestion[] = [];
  for (const output of payload.output) {
    if (!isRecord(output)) continue;
    if (output.type === "message") {
      if (!Array.isArray(output.content)) throw new CoachProviderError("malformed_output");
      for (const content of output.content) {
        if (isRecord(content) && content.type === "output_text" && typeof content.text === "string") {
          messageParts.push(content.text);
        }
      }
    }
    if (output.type === "function_call") suggestions.push(parseSuggestion(output));
  }

  const result = coachResultSchema.safeParse({ message: messageParts.join("\n").trim(), suggestions });
  if (!result.success) throw new CoachProviderError("malformed_output");
  return result.data;
}

function parseSuggestion(output: Record<string, unknown>): CoachSuggestion {
  if (
    (output.name !== "recommend_next_action" && output.name !== "highlight_cook_risk") ||
    typeof output.arguments !== "string"
  ) {
    throw new CoachProviderError("malformed_output");
  }

  let argumentsValue: unknown;
  try {
    argumentsValue = JSON.parse(output.arguments);
  } catch {
    throw new CoachProviderError("malformed_output");
  }
  if (!isRecord(argumentsValue) || "kind" in argumentsValue) throw new CoachProviderError("malformed_output");

  const suggestion = coachSuggestionSchema.safeParse({
    kind: output.name === "recommend_next_action" ? "next_action" : "caution",
    ...argumentsValue,
  });
  if (!suggestion.success) throw new CoachProviderError("malformed_output");
  return suggestion.data;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
