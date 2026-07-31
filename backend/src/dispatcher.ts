import {
  API_ERRORS,
  apiErrorSchema,
  healthRoute,
  healthSuccessSchema,
  normalizeValidationIssues,
  type HealthData,
} from "./contract";

interface ApiDispatcherDependencies {
  readonly getHealth: () => unknown;
}

export function createApiDispatcher({ getHealth }: ApiDispatcherDependencies) {
  return (request: Request): Response => {
    const url = parseRequestUrl(request.url);
    if (!url) {
      return errorResponse(400, API_ERRORS.validation);
    }

    if (url.pathname !== healthRoute.runtimePath) {
      return errorResponse(404, API_ERRORS.notFound);
    }

    if (request.method !== healthRoute.method) {
      return errorResponse(405, API_ERRORS.methodNotAllowed);
    }

    const queryResult = healthRoute.querySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!queryResult.success) {
      return errorResponse(400, API_ERRORS.validation, normalizeValidationIssues(queryResult.error));
    }

    const data = getHealth() as HealthData;
    return validatedJson(healthSuccessSchema, { data }, 200);
  };
}

function parseRequestUrl(requestUrl: string): URL | undefined {
  try {
    return new URL(requestUrl);
  } catch {
    return undefined;
  }
}

function errorResponse(
  status: 400 | 404 | 405,
  error: { readonly code: string; readonly message: string },
  issues: { readonly path: string; readonly code: string; readonly message: string }[] = [],
): Response {
  return validatedJson(apiErrorSchema, { error: { ...error, issues } }, status);
}

function validatedJson(
  schema: { parse(value: unknown): unknown },
  body: unknown,
  status: 200 | 400 | 404 | 405,
): Response {
  return Response.json(schema.parse(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
