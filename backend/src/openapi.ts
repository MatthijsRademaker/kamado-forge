import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  type ResponseConfig,
  type RouteConfig,
} from "@asteasolutions/zod-to-openapi";
import type { ZodType } from "zod";
import { apiRouteRegistry, sessionPlanSchema } from "./contract";

const JSON_CONTENT_TYPE = "application/json" as const;
const RESPONSE_DESCRIPTIONS: Readonly<Record<number, string>> = {
  200: "Health status",
  400: "Malformed request",
  404: "Route not found",
  405: "Method not allowed",
};

export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  registry.register("SessionPlan", sessionPlanSchema);

  for (const route of apiRouteRegistry) {
    registry.registerPath({
      method: route.method.toLowerCase() as RouteConfig["method"],
      path: route.openApiPath,
      operationId: route.operationId,
      summary: "Check API health",
      request: { query: route.querySchema },
      responses: Object.fromEntries(
        Object.entries(route.responses).map(([status, schema]) => [
          status,
          response(RESPONSE_DESCRIPTIONS[Number(status)] ?? `Response ${status}`, schema),
        ]),
      ),
    });
  }

  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Kamado API",
      version: "1.0.0",
    },
    servers: [{ url: "/api" }],
  });
}

function response(description: string, schema: ZodType) {
  return {
    description,
    content: {
      [JSON_CONTENT_TYPE]: { schema },
    },
  } as ResponseConfig;
}
