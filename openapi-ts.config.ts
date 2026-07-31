import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: process.env.OPENAPI_INPUT ?? "backend/openapi/openapi.json",
  output: {
    path: process.env.OPENAPI_OUTPUT ?? "frontend/src/api/generated",
    format: false,
    lint: false,
  },
  plugins: [{ name: "@hey-api/client-fetch", bundle: false, baseUrl: "/api" }],
});
