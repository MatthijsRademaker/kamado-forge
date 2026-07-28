import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const port = Number(process.env.PORT ?? 3000);

const json = (body: unknown, init?: ResponseInit) =>
  Response.json(body, {
    headers: {
      "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "http://localhost:5173",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      ...init?.headers,
    },
    status: init?.status,
    statusText: init?.statusText,
  });

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, service: "llm-native-api" });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      const { message } = (await request.json()) as { message?: string };

      if (!message) {
        return json({ error: "message is required" }, { status: 400 });
      }

      const completion = await openai.responses.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
        input: message,
      });

      return json({ output: completion.output_text });
    }

    return json({ error: "not found" }, { status: 404 });
  },
});

console.log(`LLM API listening on http://localhost:${port}`);
