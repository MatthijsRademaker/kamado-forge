<script setup lang="ts">
import { computed, ref } from "vue";
import { useNow } from "@vueuse/core";
import { Flame } from "lucide-vue-next";
import { useRoute } from "vue-router";
import {
  useAddSessionNoteMutation,
  useAdvanceSessionMutation,
  useCancelSessionMutation,
  useCompleteSessionMutation,
  useLiveSessionQuery,
  usePauseSessionMutation,
  useResumeSessionMutation,
  useReturnSessionMutation,
} from "@/api/sessions";
import _EmptyState from "@/components/EmptyState.vue";
import _ErrorState from "@/components/ErrorState.vue";
import _LoadingState from "@/components/LoadingState.vue";
import _StatusIndicator from "@/components/StatusIndicator.vue";
import { Button as _Button } from "@/components/ui/button";
import _LiveComposer from "@/features/live/LiveComposer.vue";
import _LiveNowBar from "@/features/live/LiveNowBar.vue";
import _LiveTimeline from "@/features/live/LiveTimeline.vue";
import { deriveLiveTimeline } from "@/features/live/timeline";

const route = useRoute();
const sessionId = computed(() => String(route.params.sessionId ?? ""));
const sessionQuery = useLiveSessionQuery(sessionId);
const pauseMutation = usePauseSessionMutation();
const resumeMutation = useResumeSessionMutation();
const returnMutation = useReturnSessionMutation();
const advanceMutation = useAdvanceSessionMutation();
const noteMutation = useAddSessionNoteMutation();
const cancelMutation = useCancelSessionMutation();
const completeMutation = useCompleteSessionMutation();
const note = ref("");
const actionError = ref("");
const noteError = ref("");
const finishOpen = ref(false);
const cancelOpen = ref(false);
const nowVisible = ref(true);

const now = useNow({ interval: 1000 });
const session = computed(() => sessionQuery.data.value);
const _plan = computed(() => session.value?.plan);
const _currentOrdinal = computed(() => session.value?.progress.currentStepOrdinal ?? 0);
const _terminal = computed(() => session.value?.status === "COMPLETED" || session.value?.status === "CANCELLED");
const _elapsedSeconds = computed(() => {
  const currentSession = session.value;
  const execution = currentSession?.currentStep?.execution ?? currentSession?.executionHistory.at(-1);
  if (!currentSession || !execution) return 0;
  const activeSeconds =
    currentSession.status === "ACTIVE"
      ? Math.max(0, Math.floor((now.value.getTime() - Date.parse(currentSession.projectedAt)) / 1000))
      : 0;
  return execution.elapsedSeconds + activeSeconds;
});
const _timeline = computed(() => {
  const currentSession = session.value;
  if (!currentSession) return null;
  return deriveLiveTimeline(currentSession, {
    elapsedSeconds: _elapsedSeconds.value,
    nowMs: now.value.getTime(),
  });
});
const _actionPending = computed(() =>
  [pauseMutation, resumeMutation, returnMutation, advanceMutation, cancelMutation, completeMutation].some(
    (mutation) => mutation.isLoading.value,
  ),
);

defineOptions({
  components: {
    Button: _Button,
    EmptyState: _EmptyState,
    ErrorState: _ErrorState,
    Flame,
    LiveComposer: _LiveComposer,
    LiveNowBar: _LiveNowBar,
    LiveTimeline: _LiveTimeline,
    LoadingState: _LoadingState,
    StatusIndicator: _StatusIndicator,
  },
});

async function _runAction(action: "pause" | "resume" | "return" | "advance"): Promise<void> {
  actionError.value = "";
  const mutation = {
    pause: pauseMutation,
    resume: resumeMutation,
    return: returnMutation,
    advance: advanceMutation,
  }[action];
  try {
    await mutation.mutateAsync({ sessionId: sessionId.value });
  } catch (error) {
    actionError.value = correctionFor(error);
  }
}

async function _saveNote(): Promise<void> {
  noteError.value = "";
  if (!note.value.trim()) {
    noteError.value = "Write a note before saving it.";
    return;
  }
  try {
    await noteMutation.mutateAsync({ sessionId: sessionId.value, note: note.value });
    note.value = "";
  } catch (error) {
    noteError.value = correctionFor(error);
  }
}

async function _finishCook(): Promise<void> {
  actionError.value = "";
  try {
    await completeMutation.mutateAsync({ sessionId: sessionId.value });
    finishOpen.value = false;
  } catch (error) {
    actionError.value = correctionFor(error);
  }
}

async function _cancelCook(): Promise<void> {
  actionError.value = "";
  try {
    await cancelMutation.mutateAsync({ sessionId: sessionId.value });
    cancelOpen.value = false;
  } catch (error) {
    actionError.value = correctionFor(error);
  }
}

function correctionFor(error: unknown): string {
  if (error && typeof error === "object" && "error" in error) {
    const detail = (error as { error: { code: string; message: string } }).error;
    if (detail.code === "INVALID_TRANSITION")
      return "The server state changed or this move is not allowed. Review the refreshed cook and try a valid action.";
    return `${detail.message} Review the refreshed cook before retrying.`;
  }
  return "The server did not confirm this action. Your visible cook state and entered note were kept; retry when connected.";
}
</script>

<template>
  <LoadingState
    v-if="!session && sessionQuery.isPending.value"
    label="Loading durable cook"
    description="Reading session guidance, progress, and notes from the server."
  />

  <ErrorState
    v-else-if="!session && sessionQuery.error.value"
    title="Cook detail unavailable"
    description="This ID-addressed session could not be loaded. Retry without falling back to fixture state."
  >
    <template #action>
      <Button class="min-h-11" @click="sessionQuery.refetch(true)">Retry cook detail</Button>
      <Button as-child variant="outline" class="min-h-11"><RouterLink :to="{ name: 'today' }">Return to Today</RouterLink></Button>
    </template>
  </ErrorState>

  <EmptyState v-else-if="!session || !_plan || !_timeline" title="Cooking session not found" description="Return to Today to choose an eligible plan.">
    <template #action><Button as-child class="min-h-11"><RouterLink :to="{ name: 'today' }">Return to Today</RouterLink></Button></template>
  </EmptyState>

  <article v-else data-atmosphere="low" class="live-page -mx-4 -mt-6 grid min-w-0 gap-0 sm:-mx-6 sm:-mt-8 lg:-mx-8 lg:-mt-12 xl:-mx-12">
    <header class="border-b border-border-subtle bg-neutral-obsidian px-4 py-3 sm:px-8 lg:px-12">
      <div class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
        <p class="flex min-w-0 items-center gap-2 font-label text-caption tracking-[0.18em] text-accent uppercase">
          <Flame aria-hidden="true" class="size-4 fill-current" /> {{ _terminal ? 'Cook record' : 'Live cook' }}
          <span class="min-w-0 truncate text-neutral-mist">· {{ _plan.title }}</span>
        </p>
        <StatusIndicator label="Session" :value="session.status" :status="session.status === 'ACTIVE' ? 'success' : session.status === 'PAUSED' ? 'warning' : 'neutral'" />
      </div>
    </header>

    <div class="mx-auto grid w-full max-w-6xl gap-4 px-4 pt-5 pb-44 sm:px-8 lg:px-12" :class="_terminal ? 'pb-10' : ''">
      <div
        v-if="sessionQuery.error.value"
        class="rounded-default border border-feedback-danger bg-surface p-4 text-feedback-danger"
        role="alert"
      >
        <p class="font-heading text-heading-lg uppercase">Cook refresh failed</p>
        <p class="text-ui">The last confirmed cook and entered note remain visible.</p>
        <Button type="button" variant="outline" class="mt-3 min-h-11" @click="sessionQuery.refetch(true)">Retry refresh</Button>
      </div>

      <LiveTimeline
        :plan="_plan"
        :timeline="_timeline"
        :live="session.status === 'ACTIVE'"
        @update:now-visible="nowVisible = $event"
      />
    </div>

    <LiveNowBar
      v-if="!_terminal && !nowVisible"
      :session="session"
      :plan="_plan"
      :entry="_timeline.now"
      :action-pending="_actionPending"
      :advancing="advanceMutation.isLoading.value"
      @action="_runAction"
    />

    <LiveComposer
      v-if="!_terminal"
      v-model:finish-open="finishOpen"
      v-model:cancel-open="cancelOpen"
      :session="session"
      :current-ordinal="_currentOrdinal"
      :action-pending="_actionPending"
      :advancing="advanceMutation.isLoading.value"
      :action-error="actionError"
      :note="note"
      :note-error="noteError"
      :note-saving="noteMutation.isLoading.value"
      :finishing="completeMutation.isLoading.value"
      :cancelling="cancelMutation.isLoading.value"
      @action="_runAction"
      @save="_saveNote"
      @finish="_finishCook"
      @cancel="_cancelCook"
      @update:note="note = $event"
    />
  </article>
</template>
