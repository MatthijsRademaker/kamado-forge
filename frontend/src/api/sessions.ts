import { type QueryCache, useMutation, useQuery, useQueryCache } from "@pinia/colada";
import { toValue, type MaybeRefOrGetter } from "vue";
import {
  activateCookingSession,
  addLiveCookingSessionNote,
  advanceCookingSession,
  cancelCookingSession,
  completeCookingSession,
  createCookingSession,
  findActiveCookingSession,
  getLiveCookingSession,
  listCookingSessions,
  listEligibleCookingSessions,
  pauseCookingSession,
  resumeCookingSession,
  returnCookingSession,
  updateCookingSession,
} from "./generated/sdk.gen";
import type { ApiError, CookingSession, CookingSessionWrite, LiveCookSession } from "./generated/types.gen";

interface SessionListParameters {
  readonly scope: "all";
}

type SessionDetailKind = "draft" | "live";
type SessionQueryKey = readonly ["sessions", ...(string | number | boolean | null)[]];

export const sessionKeys = {
  all: ["sessions"] as const,
  list: ({ scope }: SessionListParameters = { scope: "all" }) => ["sessions", "list", scope] as const,
  detail: (sessionId: string, kind: SessionDetailKind) => ["sessions", "detail", kind, sessionId] as const,
  active: () => ["sessions", "active"] as const,
  eligible: () => ["sessions", "eligible"] as const,
};

const liveMutationKeys = (sessionId: string): SessionQueryKey[] => [
  sessionKeys.list(),
  sessionKeys.eligible(),
  sessionKeys.active(),
  sessionKeys.detail(sessionId, "draft"),
  sessionKeys.detail(sessionId, "live"),
];

export const sessionMutationInvalidation = {
  create: (): SessionQueryKey[] => [sessionKeys.list(), sessionKeys.eligible()],
  update: (sessionId: string): SessionQueryKey[] => [
    sessionKeys.list(),
    sessionKeys.eligible(),
    sessionKeys.detail(sessionId, "draft"),
  ],
  activate: liveMutationKeys,
  advance: liveMutationKeys,
  return: liveMutationKeys,
  pause: liveMutationKeys,
  resume: liveMutationKeys,
  note: liveMutationKeys,
  cancel: liveMutationKeys,
  complete: liveMutationKeys,
};

export type { CookingSession, CookingSessionWrite };
export type SessionApiError = ApiError;

export function useSessionListQuery() {
  return useQuery<CookingSession[], SessionApiError>({
    key: sessionKeys.list(),
    query: async () => (await listCookingSessions({ throwOnError: true })).data.data,
  });
}

export function useEligibleSessionsQuery(enabled: MaybeRefOrGetter<boolean> = true) {
  return useQuery<CookingSession[], SessionApiError>({
    key: sessionKeys.eligible(),
    enabled,
    query: async () => (await listEligibleCookingSessions({ throwOnError: true })).data.data,
  });
}

export function useLiveSessionQuery(sessionId: MaybeRefOrGetter<string>) {
  return useQuery<LiveCookSession, SessionApiError>({
    key: () => sessionKeys.detail(toValue(sessionId), "live"),
    query: async () =>
      (
        await getLiveCookingSession({
          throwOnError: true,
          path: { sessionId: toValue(sessionId) },
        })
      ).data.data,
  });
}

export function useActiveSessionQuery() {
  return useQuery<LiveCookSession | null, SessionApiError>({
    key: sessionKeys.active(),
    query: async () => {
      const response = await findActiveCookingSession({ throwOnError: true });
      return response.data?.data ?? null;
    },
  });
}

async function invalidateSessionQueries(queryCache: QueryCache, keys: SessionQueryKey[]): Promise<void> {
  for (const key of keys) await queryCache.invalidateQueries({ key, exact: true }, "all");
}

export function useCreateSessionMutation() {
  const queryCache = useQueryCache();
  return useMutation<CookingSession, CookingSessionWrite, SessionApiError>({
    mutation: async (input) => (await createCookingSession({ body: input, throwOnError: true })).data.data,
    onSuccess: async () => invalidateSessionQueries(queryCache, sessionMutationInvalidation.create()),
  });
}

export function useUpdateSessionMutation() {
  const queryCache = useQueryCache();
  return useMutation<CookingSession, { sessionId: string; input: CookingSessionWrite }, SessionApiError>({
    mutation: async ({ sessionId, input }) =>
      (await updateCookingSession({ body: input, path: { sessionId }, throwOnError: true })).data.data,
    onSuccess: async (_, { sessionId }) =>
      invalidateSessionQueries(queryCache, sessionMutationInvalidation.update(sessionId)),
  });
}

type LiveMutationName = Exclude<keyof typeof sessionMutationInvalidation, "create" | "update" | "note">;
type LiveMutationVariables = { sessionId: string; note?: string };

function useLiveMutation(
  name: LiveMutationName,
  operation: (variables: LiveMutationVariables) => Promise<LiveCookSession>,
) {
  const queryCache = useQueryCache();
  return useMutation<LiveCookSession, LiveMutationVariables, SessionApiError>({
    mutation: operation,
    onSuccess: async (_, { sessionId }) =>
      invalidateSessionQueries(queryCache, sessionMutationInvalidation[name](sessionId)),
    onError: async (_, { sessionId }) =>
      invalidateSessionQueries(queryCache, sessionMutationInvalidation[name](sessionId)),
  });
}

export function useActivateSessionMutation() {
  return useLiveMutation(
    "activate",
    async ({ sessionId, note }) =>
      (
        await activateCookingSession({
          body: note ? { note } : {},
          path: { sessionId },
          throwOnError: true,
        })
      ).data.data,
  );
}

export function useAdvanceSessionMutation() {
  return useLiveMutation("advance", ({ sessionId, note }) =>
    liveCommand(advanceCookingSession, sessionId, note ? { note } : {}),
  );
}

export function useReturnSessionMutation() {
  return useLiveMutation("return", ({ sessionId, note }) =>
    liveCommand(returnCookingSession, sessionId, note ? { note } : {}),
  );
}

export function usePauseSessionMutation() {
  return useLiveMutation(
    "pause",
    async ({ sessionId }) =>
      (await pauseCookingSession({ body: {}, path: { sessionId }, throwOnError: true })).data.data,
  );
}

export function useResumeSessionMutation() {
  return useLiveMutation(
    "resume",
    async ({ sessionId }) =>
      (await resumeCookingSession({ body: {}, path: { sessionId }, throwOnError: true })).data.data,
  );
}

export function useCompleteSessionMutation() {
  return useLiveMutation("complete", ({ sessionId, note }) =>
    liveCommand(completeCookingSession, sessionId, note ? { note } : {}),
  );
}

export function useCancelSessionMutation() {
  return useLiveMutation("cancel", ({ sessionId, note }) =>
    liveCommand(cancelCookingSession, sessionId, note ? { note } : {}),
  );
}

export function useAddSessionNoteMutation() {
  const queryCache = useQueryCache();
  return useMutation<LiveCookSession, { sessionId: string; note: string }, SessionApiError>({
    mutation: async ({ sessionId, note }) =>
      (
        await addLiveCookingSessionNote({
          body: { note },
          path: { sessionId },
          throwOnError: true,
        })
      ).data.data,
    onSuccess: async (_, { sessionId }) =>
      invalidateSessionQueries(queryCache, sessionMutationInvalidation.note(sessionId)),
  });
}

type LiveCommandOperation = (options: {
  body: Record<string, never> | { note?: string };
  path: { sessionId: string };
  throwOnError: true;
}) => Promise<{ data: { data: LiveCookSession } }>;

async function liveCommand(
  operation: LiveCommandOperation,
  sessionId: string,
  body: Record<string, never> | { note?: string },
): Promise<LiveCookSession> {
  return (await operation({ body, path: { sessionId }, throwOnError: true })).data.data;
}
