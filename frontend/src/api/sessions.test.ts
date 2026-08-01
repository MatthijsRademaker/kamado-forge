import { afterEach, describe, expect, test } from "bun:test";
import { PiniaColada, useQueryCache } from "@pinia/colada";
import { createPinia } from "pinia";
import { createApp, effectScope } from "vue";
import { client } from "./generated/client.gen";
import type { ApiError, CookingSession, CookingSessionWrite, LiveCookSession } from "./generated/types.gen";
import {
  sessionKeys,
  sessionMutationInvalidation,
  useActivateSessionMutation,
  useActiveSessionQuery,
  useAddSessionNoteMutation,
  useAdvanceSessionMutation,
  useCancelSessionMutation,
  useCompleteSessionMutation,
  useCreateSessionMutation,
  useEligibleSessionsQuery,
  usePauseSessionMutation,
  useResumeSessionMutation,
  useReturnSessionMutation,
  useSessionDetailQuery,
  useSessionListQuery,
  useUpdateSessionMutation,
} from "@/api/sessions";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  client.setConfig({ baseUrl: "/api" });
});

describe("session cache topology", () => {
  test("uses stable parameterized identities for list, draft detail, live detail, active, and eligible queries", () => {
    expect(sessionKeys.list({ scope: "all" })).toEqual(sessionKeys.list({ scope: "all" }));
    expect(sessionKeys.list({ scope: "all" })).not.toEqual(sessionKeys.eligible());
    expect(sessionKeys.detail("session-a", "draft")).toEqual(["sessions", "detail", "draft", "session-a"]);
    expect(sessionKeys.detail("session-a", "live")).toEqual(["sessions", "detail", "live", "session-a"]);
    expect(sessionKeys.detail("session-a", "live")).not.toEqual(sessionKeys.detail("session-b", "live"));
    expect(sessionKeys.active()).toEqual(["sessions", "active"]);
    expect(sessionKeys.eligible()).toEqual(["sessions", "eligible"]);
  });

  test("declares every authoritative query affected by each mutation", () => {
    expect(sessionMutationInvalidation.create()).toEqual([sessionKeys.list({ scope: "all" }), sessionKeys.eligible()]);
    expect(sessionMutationInvalidation.update("session-a")).toEqual([
      sessionKeys.list({ scope: "all" }),
      sessionKeys.eligible(),
      sessionKeys.detail("session-a", "draft"),
    ]);
    for (const mutation of [
      "activate",
      "advance",
      "return",
      "pause",
      "resume",
      "note",
      "cancel",
      "complete",
    ] as const) {
      expect(sessionMutationInvalidation[mutation]("session-a")).toEqual([
        sessionKeys.list({ scope: "all" }),
        sessionKeys.eligible(),
        sessionKeys.active(),
        sessionKeys.detail("session-a", "draft"),
        sessionKeys.detail("session-a", "live"),
      ]);
    }
  });
});

const draftInput: CookingSessionWrite = {
  title: "Saturday cook",
  cookingDate: "2026-08-08",
  plannedDomeRange: { minF: 225, maxF: 275 },
  plannedFoodTargetF: 130,
  setupGuidance: "Set up for two zones.",
  deflectorGuidance: "Use the half-moon deflector.",
  heatZoneGuidance: "Keep the right side direct.",
  ventGuidance: "Bottom vent one finger, top vent quarter open.",
  prepNotes: "Dry brine overnight.",
  phases: [
    {
      title: "Prepare",
      technique: "Fire building",
      transitionGuidance: "Wait for clean smoke.",
      steps: [{ title: "Light", instructions: "Light one starter.", durationMinutes: 20 }],
    },
  ],
};

const session: CookingSession = {
  ...draftInput,
  id: "11111111-1111-4111-8111-111111111111",
  status: "draft",
  createdAt: "2026-08-08T12:00:00.000Z",
  updatedAt: "2026-08-08T12:00:00.000Z",
  phases: draftInput.phases.map((phase) => ({
    ...phase,
    id: "22222222-2222-4222-8222-222222222222",
    steps: phase.steps.map((step) => ({ ...step, id: "33333333-3333-4333-8333-333333333333" })),
  })),
};

const liveSession: LiveCookSession = {
  id: session.id,
  status: "ACTIVE",
  activatedAt: "2026-08-08T12:05:00.000Z",
  plan: session,
  currentStep: {
    id: "44444444-4444-4444-8444-444444444444",
    ordinal: 0,
    title: "Light",
    instructions: "Light one starter.",
    durationMinutes: 20,
    execution: {
      id: "55555555-5555-4555-8555-555555555555",
      ordinal: 0,
      actualStartedAt: "2026-08-08T12:05:00.000Z",
      actualFinishedAt: null,
      cancelledAt: null,
      notes: [],
    },
  },
  nextStep: null,
  executionHistory: [],
};

describe("session generated-client composables", () => {
  test("exposes typed list, eligible, and explicit no-active query results", async () => {
    client.setConfig({ baseUrl: "http://app.test/api" });
    setControlledFetch(async (request) => {
      if (request.url.endsWith("/live-sessions/active")) return new Response(null, { status: 204 });
      if (request.url.endsWith(`/sessions/${session.id}`)) return Response.json({ data: session });
      return Response.json({ data: [session] });
    });
    const fixture = createComposableFixture(() => ({
      list: useSessionListQuery(),
      detail: useSessionDetailQuery(() => session.id),
      eligible: useEligibleSessionsQuery(),
      active: useActiveSessionQuery(),
    }));

    try {
      await fixture.value.list.refetch(true);
      await fixture.value.detail.refetch(true);
      await fixture.value.eligible.refetch(true);
      await fixture.value.active.refetch(true);

      expect(fixture.value.list.data.value).toEqual([session]);
      expect(fixture.value.detail.data.value).toEqual(session);
      expect(fixture.value.eligible.data.value).toEqual([session]);
      expect(fixture.value.active.data.value).toBeNull();
    } finally {
      fixture.dispose();
    }
  });

  test("exposes generated structured errors without replacing them", async () => {
    const apiError: ApiError = {
      error: {
        code: "ACTIVE_SESSION_CONFLICT",
        message: "Another cooking session is active",
        issues: [],
      },
    };
    client.setConfig({ baseUrl: "http://app.test/api" });
    setControlledFetch(async () => Response.json(apiError, { status: 409 }));
    const fixture = createComposableFixture(() => ({
      queryCache: useQueryCache(),
      mutation: useActivateSessionMutation(),
    }));
    const invalidations: unknown[][] = [];
    fixture.value.queryCache.$onAction(({ name, args }) => {
      if (name === "invalidateQueries") invalidations.push(args);
    });

    try {
      await expect(fixture.value.mutation.mutateAsync({ sessionId: session.id })).rejects.toEqual(apiError);
      expect(fixture.value.mutation.error.value).toEqual(apiError);
      expect(invalidations).toEqual(
        sessionMutationInvalidation.activate(session.id).map((key) => [{ key, exact: true }, "all"]),
      );
    } finally {
      fixture.dispose();
    }
  });

  test("invalidates affected queries when draft and note mutation responses may be stale", async () => {
    const apiError: ApiError = {
      error: {
        code: "CONFLICT",
        message: "The mutation result is unknown",
        issues: [],
      },
    };
    client.setConfig({ baseUrl: "http://app.test/api" });
    setControlledFetch(async () => Response.json(apiError, { status: 409 }));
    const fixture = createComposableFixture(() => {
      const queryCache = useQueryCache();
      return {
        queryCache,
        create: useCreateSessionMutation(),
        update: useUpdateSessionMutation(),
        note: useAddSessionNoteMutation(),
      };
    });
    const invalidations: unknown[][] = [];
    const stopActionListener = fixture.value.queryCache.$onAction(({ name, args }) => {
      if (name === "invalidateQueries") invalidations.push(args);
    });

    try {
      const mutations = [
        { name: "create", variables: draftInput, expected: sessionMutationInvalidation.create() },
        {
          name: "update",
          variables: { sessionId: session.id, input: draftInput },
          expected: sessionMutationInvalidation.update(session.id),
        },
        {
          name: "note",
          variables: { sessionId: session.id, note: "Clean smoke." },
          expected: sessionMutationInvalidation.note(session.id),
        },
      ] as const;

      for (const mutation of mutations) {
        invalidations.length = 0;
        await expect(fixture.value[mutation.name].mutateAsync(mutation.variables as never)).rejects.toEqual(apiError);
        expect(invalidations).toEqual(mutation.expected.map((key) => [{ key, exact: true }, "all"]));
      }
    } finally {
      stopActionListener();
      fixture.dispose();
    }
  });

  test("invalidates and refetches the declared keys after every successful mutation", async () => {
    client.setConfig({ baseUrl: "http://app.test/api" });
    setControlledFetch(async (request) =>
      Response.json({ data: request.url.endsWith("/sessions") && request.method === "POST" ? session : liveSession }),
    );
    const fixture = createComposableFixture(() => {
      const queryCache = useQueryCache();
      return {
        queryCache,
        create: useCreateSessionMutation(),
        update: useUpdateSessionMutation(),
        activate: useActivateSessionMutation(),
        advance: useAdvanceSessionMutation(),
        return: useReturnSessionMutation(),
        pause: usePauseSessionMutation(),
        resume: useResumeSessionMutation(),
        note: useAddSessionNoteMutation(),
        cancel: useCancelSessionMutation(),
        complete: useCompleteSessionMutation(),
      };
    });
    const invalidations: unknown[][] = [];
    const stopActionListener = fixture.value.queryCache.$onAction(({ name, args }) => {
      if (name === "invalidateQueries") invalidations.push(args);
    });

    try {
      const mutations = [
        { name: "create", variables: draftInput, expected: sessionMutationInvalidation.create() },
        {
          name: "update",
          variables: { sessionId: session.id, input: draftInput },
          expected: sessionMutationInvalidation.update(session.id),
        },
        {
          name: "activate",
          variables: { sessionId: session.id },
          expected: sessionMutationInvalidation.activate(session.id),
        },
        {
          name: "advance",
          variables: { sessionId: session.id },
          expected: sessionMutationInvalidation.advance(session.id),
        },
        {
          name: "return",
          variables: { sessionId: session.id },
          expected: sessionMutationInvalidation.return(session.id),
        },
        {
          name: "pause",
          variables: { sessionId: session.id },
          expected: sessionMutationInvalidation.pause(session.id),
        },
        {
          name: "resume",
          variables: { sessionId: session.id },
          expected: sessionMutationInvalidation.resume(session.id),
        },
        {
          name: "note",
          variables: { sessionId: session.id, note: "Clean smoke." },
          expected: sessionMutationInvalidation.note(session.id),
        },
        {
          name: "cancel",
          variables: { sessionId: session.id },
          expected: sessionMutationInvalidation.cancel(session.id),
        },
        {
          name: "complete",
          variables: { sessionId: session.id },
          expected: sessionMutationInvalidation.complete(session.id),
        },
      ] as const;

      for (const mutation of mutations) {
        invalidations.length = 0;
        await fixture.value[mutation.name].mutateAsync(mutation.variables as never);
        expect(invalidations).toEqual(mutation.expected.map((key) => [{ key, exact: true }, "all"]));
      }
    } finally {
      stopActionListener();
      fixture.dispose();
    }
  });
});

function setControlledFetch(handler: (request: Request) => Promise<Response>): void {
  const controlledFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    return handler(request);
  };
  controlledFetch.preconnect = originalFetch.preconnect;
  globalThis.fetch = controlledFetch;
}

function createComposableFixture<T>(factory: () => T) {
  const app = createApp({ render: () => null });
  app.use(createPinia());
  app.use(PiniaColada);
  const scope = effectScope();
  const value = app.runWithContext(() => scope.run(factory));
  if (!value) throw new Error("Session composable fixture could not be created");
  return { value, dispose: () => scope.stop() };
}
