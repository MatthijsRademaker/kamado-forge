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
  200: "Successful response",
  201: "Draft cooking session created",
  204: "Draft cooking session deleted",
  400: "Malformed request",
  404: "Resource not found",
  405: "Method not allowed",
};

type RouteRequest = NonNullable<RouteConfig["request"]>;
type RouteParameterSchema = NonNullable<RouteRequest["query"]>;

interface DocumentedRoute {
  readonly method: string;
  readonly openApiPath: string;
  readonly operationId: string;
  readonly summary?: string;
  readonly querySchema: RouteParameterSchema;
  readonly paramsSchema?: RouteParameterSchema;
  readonly bodySchema?: ZodType;
  readonly responses: Readonly<Record<number, ZodType | null>>;
}

export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();

  registry.register("SessionPlan", sessionPlanSchema);

  for (const route of apiRouteRegistry as readonly DocumentedRoute[]) {
    const request: RouteRequest = { query: route.querySchema };
    if (route.paramsSchema) request.params = route.paramsSchema;
    if (route.bodySchema) {
      request.body = { required: true, content: { [JSON_CONTENT_TYPE]: { schema: route.bodySchema } } };
    }

    registry.registerPath({
      method: route.method.toLowerCase() as RouteConfig["method"],
      path: route.openApiPath,
      operationId: route.operationId,
      summary: route.summary ?? "Check API health",
      request,
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
      version: "2.0.0",
    },
    servers: [{ url: "/api" }],
  });
}

function response(description: string, schema: ZodType | null): ResponseConfig {
  if (!schema) return { description };

  return {
    description,
    content: {
      [JSON_CONTENT_TYPE]: { schema },
    },
  };
}
