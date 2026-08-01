import { describe, expect, test } from "bun:test";
import { CoachProviderError, type CoachProviderRequest } from "./coach-provider";
import { COACH_SYSTEM_PROMPT, COACH_TOOLS } from "./coach-service";
import { createOpenAiCoachProvider } from "./openai-coach-provider";

const request: CoachProviderRequest = {
  model: "gpt-configured-model",
  chat: [{ role: "user", content: "Should I adjust the vent?" }],
  context: { version: 1, activeSession: null },
  systemPrompt: COACH_SYSTEM_PROMPT,
  tools: COACH_TOOLS,
};

describe("OpenAI coach provider", () => {
  test("uses the configured model and maps vendor output to provider-owned data", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const provider = createOpenAiCoachProvider({
      apiKey: "server-secret",
      async fetch(url: string | URL | Request, init?: RequestInit) {
        calls.push({ url: String(url), init: init ?? {} });
        return Response.json({
          id: "vendor-response-id",
          output: [
            {
              type: "message",
              content: [{ type: "output_text", text: "Keep the vent steady for ten minutes." }],
            },
            {
              type: "function_call",
              name: "recommend_next_action",
              arguments: JSON.stringify({
                title: "Wait for stability",
                rationale: "Ceramic heat responds slowly.",
              }),
            },
          ],
        });
      },
    });

    const result = await provider.complete(request);

    expect(result).toEqual({
      message: "Keep the vent steady for ten minutes.",
      suggestions: [
        {
          kind: "next_action",
          title: "Wait for stability",
          rationale: "Ceramic heat responds slowly.",
        },
      ],
    });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.openai.com/v1/responses");
    expect(calls[0]?.init.method).toBe("POST");
    expect(calls[0]?.init.headers).toEqual({
      authorization: "Bearer server-secret",
      "content-type": "application/json",
    });
    let requestBody: unknown;
    try {
      requestBody = JSON.parse(String(calls[0]?.init.body));
    } catch (error) {
      throw new Error("OpenAI adapter sent invalid JSON", { cause: error });
    }
    expect(requestBody).toEqual({
      model: "gpt-configured-model",
      instructions: `${COACH_SYSTEM_PROMPT}\n\nAuthoritative context (JSON):\n${JSON.stringify(request.context)}`,
      input: [{ role: "user", content: "Should I adjust the vent?" }],
      tools: COACH_TOOLS.map(({ name, description, inputSchema }) => ({
        type: "function",
        name,
        description,
        parameters: inputSchema,
        strict: true,
      })),
    });
    expect(JSON.stringify(result)).not.toContain("vendor-response-id");
  });

  test("rejects tool arguments that can override the declared suggestion kind", async () => {
    const provider = createOpenAiCoachProvider({
      apiKey: "server-secret",
      fetch: async () =>
        Response.json({
          output: [
            {
              type: "message",
              content: [{ type: "output_text", text: "Keep the vent steady." }],
            },
            {
              type: "function_call",
              name: "recommend_next_action",
              arguments: JSON.stringify({
                kind: "caution",
                title: "Wait for stability",
                rationale: "Ceramic heat responds slowly.",
              }),
            },
          ],
        }),
    });

    await expect(provider.complete(request)).rejects.toMatchObject({
      kind: "malformed_output",
    });
  });

  test("maps rejection, transport failure, and malformed success to typed failures", async () => {
    const fixtures = [
      {
        kind: "rejected",
        fetch: async () => new Response("upstream secret body", { status: 429 }),
      },
      {
        kind: "unavailable",
        fetch: async () => {
          throw new Error("network URL and secret detail");
        },
      },
      {
        kind: "malformed_output",
        fetch: async () => Response.json({ id: "vendor-id", output: [] }),
      },
    ] as const;

    for (const fixture of fixtures) {
      const provider = createOpenAiCoachProvider({ apiKey: "server-secret", fetch: fixture.fetch });

      try {
        await provider.complete(request);
        throw new Error("Expected provider failure");
      } catch (error) {
        expect(error).toBeInstanceOf(CoachProviderError);
        expect((error as CoachProviderError).kind).toBe(fixture.kind);
        expect(String(error)).not.toContain("secret");
        expect(String(error)).not.toContain("vendor-id");
      }
    }
  });
});
