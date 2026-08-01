import { CoachConfigurationError, resolveCoachConfiguration, type CoachEnvironment } from "./coach-config";
import { createCoachService, type CoachService } from "./coach-service";
import { createApiDispatcher } from "./dispatcher";
import { createOpenAiCoachProvider, type CoachFetch } from "./openai-coach-provider";
import { createLiveCookRepository } from "./persistence/live-cook-repository";
import { createSessionRepository } from "./persistence/session-repository";
import {
  bootstrapPersistence,
  type BootstrapPersistenceOptions,
  type PersistenceContext,
} from "./persistence/bootstrap";

interface ApiServerOptions {
  readonly port: number;
  fetch(request: Request): Response | Promise<Response>;
}

type ApiServerFactory = (options: ApiServerOptions) => unknown;
type PersistenceBootstrap = (options: BootstrapPersistenceOptions) => PersistenceContext;

interface StartApiOptions {
  readonly port: number;
  readonly databasePath: string;
  readonly coachFetch?: CoachFetch;
  readonly corsOrigin?: string;
  readonly environment?: CoachEnvironment;
  readonly bootstrap?: PersistenceBootstrap;
  readonly serve?: ApiServerFactory;
}

export function startApi({
  port,
  databasePath,
  coachFetch = globalThis.fetch,
  corsOrigin,
  environment = {
    COACH_PROVIDER: process.env.COACH_PROVIDER,
    COACH_MODEL: process.env.COACH_MODEL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  bootstrap = bootstrapPersistence,
  serve = defaultServe,
}: StartApiOptions) {
  const persistence = bootstrap({ databasePath });
  const liveCookRepository = createLiveCookRepository(persistence);
  const coachService = createConfiguredCoachService({
    coachFetch,
    contextSource: Object.freeze({ findActive: () => liveCookRepository.findActive() }),
    environment,
  });
  const dispatch = createApiDispatcher({
    coachService,
    getHealth: () => ({ ok: true, service: "api", database: { status: "ok" } }),
    liveCookRepository,
    sessionRepository: createSessionRepository(persistence),
  });
  const server = serve({
    port,
    fetch(request) {
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), corsOrigin);
      }

      const response = dispatch(request);
      return response instanceof Response
        ? withCors(response, corsOrigin)
        : response.then((resolved) => withCors(resolved, corsOrigin));
    },
  });

  return { persistence, server };
}

const defaultServe: ApiServerFactory = (options) => Bun.serve(options);

function createConfiguredCoachService({
  coachFetch,
  contextSource,
  environment,
}: {
  readonly coachFetch: CoachFetch;
  readonly contextSource: { findActive: ReturnType<typeof createLiveCookRepository>["findActive"] };
  readonly environment: CoachEnvironment;
}): CoachService {
  try {
    const configuration = resolveCoachConfiguration(environment);
    return createCoachService({
      contextSource,
      model: configuration.model,
      provider: createOpenAiCoachProvider({ apiKey: configuration.apiKey, fetch: coachFetch }),
    });
  } catch (error) {
    if (!(error instanceof CoachConfigurationError)) throw error;
    return {
      async ask() {
        throw error;
      },
    };
  }
}

function withCors(response: Response, corsOrigin: string | undefined): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");

  if (corsOrigin) {
    headers.set("Access-Control-Allow-Origin", corsOrigin);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
