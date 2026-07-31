---
name: llm-native-mcp
description: Use when designing LLM-native backend APIs, OpenAI calls, or MCP integrations for this Bun project. Covers tool-shaped APIs, provider boundaries, prompt/input hygiene, and MCP server readiness.
---

# LLM Native MCP

## Backend Defaults

- Runtime: Bun.
- API entrypoint: `server/index.ts`.
- OpenAI boundary: keep provider calls server-side only; never expose API keys to Vue.
- MCP dependency: `@modelcontextprotocol/sdk` is available for future MCP servers/tools.

## Rules

- Shape backend routes like tools: explicit input schema, clear output shape, and deterministic errors.
- Keep model/provider selection in environment variables.
- Validate request bodies before calling model providers.
- Return structured JSON rather than prose-only server responses.
- Keep prompts, system instructions, and tool definitions close to the backend code that executes them.
- For MCP servers, use the repository `mcp-builder` skill before implementation.
