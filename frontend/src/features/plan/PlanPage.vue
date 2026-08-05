<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { SessionApiError } from "@/api/sessions";
import {
  useCreateSessionMutation,
  useSessionDetailQuery,
  useSessionListQuery,
  useUpdateSessionMutation,
} from "@/api/sessions";
import _EmptyState from "@/components/EmptyState.vue";
import _ProductAreaView from "@/components/ProductAreaView.vue";

import _ErrorState from "@/components/ErrorState.vue";
import _LoadingState from "@/components/LoadingState.vue";
import { Button as _Button } from "@/components/ui/button";
import {
  createEmptyPlanDraft,
  fromCookingSession,
  fromEditorForm,
  toCookingSessionWrite,
  toEditorForm,
  type PlanEditorForm,
} from "./draft";
import _PlanEditor from "./PlanEditor.vue";

defineOptions({
  components: {
    Button: _Button,
    EmptyState: _EmptyState,
    ErrorState: _ErrorState,
    LoadingState: _LoadingState,
    ProductAreaView: _ProductAreaView,
    PlanEditor: _PlanEditor,
  },
});

const route = useRoute();
const router = useRouter();
const routeSessionId = computed(() => (typeof route.query.sessionId === "string" ? route.query.sessionId : ""));
const sessionsQuery = useSessionListQuery();
const detailQuery = useSessionDetailQuery(routeSessionId, () => routeSessionId.value.length > 0);
const createMutation = useCreateSessionMutation();
const updateMutation = useUpdateSessionMutation();
const editor = ref<PlanEditorForm | null>(null);
const selectedSessionId = ref<string | null>(null);
const saveError = ref<SessionApiError | Error | null>(null);
const savedMessage = ref("");

const sessions = computed(() => sessionsQuery.data.value ?? []);
const _saving = computed(() => createMutation.isLoading.value || updateMutation.isLoading.value);
const _errorIssues = computed(() => (isApiError(saveError.value) ? saveError.value.error.issues : []));
const _errorMessage = computed(() => {
  if (!saveError.value) return "";
  if (isApiError(saveError.value)) return correctiveMessage(saveError.value);
  return "The plan could not be saved. Check the connection and retry; your edits are still here.";
});

watch(
  sessions,
  async (available) => {
    const firstSession = available[0];
    if (editor.value || routeSessionId.value || !firstSession) return;
    await router.replace({ name: "plan", query: { sessionId: firstSession.id } });
  },
  { immediate: true },
);

watch(
  routeSessionId,
  (sessionId) => {
    if (!sessionId || selectedSessionId.value === sessionId) return;
    editor.value = null;
    selectedSessionId.value = null;
    saveError.value = null;
    savedMessage.value = "";
  },
  { immediate: true },
);

watch(
  () => detailQuery.data.value,
  (session) => {
    if (!session || session.id !== routeSessionId.value || selectedSessionId.value === session.id) return;
    editor.value = toEditorForm(fromCookingSession(session));
    selectedSessionId.value = session.id;
  },
  { immediate: true },
);

async function _selectSession(sessionId: string): Promise<void> {
  if (sessionId === selectedSessionId.value) return;
  await router.push({ name: "plan", query: { sessionId } });
}

async function _createDraft(): Promise<void> {
  await router.push({ name: "plan" });
  editor.value = toEditorForm(createEmptyPlanDraft());
  selectedSessionId.value = null;
  saveError.value = null;
  savedMessage.value = "";
}

async function _retryPlanQueries(): Promise<void> {
  const refreshes: Promise<unknown>[] = [sessionsQuery.refetch(true)];
  if (routeSessionId.value) refreshes.push(detailQuery.refetch(true));
  await Promise.all(refreshes);
}

async function _savePlan(form: PlanEditorForm): Promise<void> {
  saveError.value = null;
  savedMessage.value = "";
  const draft = fromEditorForm(form);
  const input = toCookingSessionWrite(draft);

  try {
    const saved = draft.sessionId
      ? await updateMutation.mutateAsync({ sessionId: draft.sessionId, input })
      : await createMutation.mutateAsync(input);
    editor.value = toEditorForm(fromCookingSession(saved));
    selectedSessionId.value = saved.id;
    await router.replace({ name: "plan", query: { sessionId: saved.id } });
    savedMessage.value = `Saved ${new Date(saved.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch (error) {
    saveError.value = error instanceof Error || isApiError(error) ? error : new Error("Unknown save failure");
  }
}

function isApiError(error: unknown): error is SessionApiError {
  if (!error || typeof error !== "object" || !("error" in error)) return false;
  const detail = (error as { error?: unknown }).error;
  return Boolean(detail && typeof detail === "object" && "code" in detail && "issues" in detail);
}

function correctiveMessage(error: SessionApiError): string {
  if (error.error.code === "VALIDATION_ERROR") return "Correct the highlighted planning details and save again.";
  if (error.error.code === "SESSION_NOT_FOUND")
    return "This draft no longer exists. Reload the server drafts, then choose another plan.";
  return `${error.error.message} Your unsaved plan remains editable.`;
}
</script>

<template>
  <div data-atmosphere="low" class="plan-page">
    <!-- The banner is atmosphere, so it burns at the shared `mid` budget even
         though the page it introduces is a `low` working surface. -->
    <ProductAreaView
      eyebrow="Durable cooking-day plan"
      :heading="editor?.title || 'Plan the fire'"
      heading-id="plan-heading"
      heading-scale="record"
      tagline="Set the fire before you light it."
      image="/img/hero-plan.jpg"
    >
      <template #aside>Explicit saves · durable across reloads</template>
    </ProductAreaView>

    <div class="plan-main">
      <LoadingState
        v-if="!editor && (sessionsQuery.isPending.value || (routeSessionId && detailQuery.isPending.value))"
        label="Loading saved plans"
        description="Reading the authoritative cooking-session timeline."
      />

      <ErrorState
        v-else-if="!editor && (sessionsQuery.error.value || detailQuery.error.value)"
        title="Saved plans unavailable"
        description="The server could not load your plans. Nothing has been replaced with fixture data."
      >
        <template #action><Button class="plan-touch-action" @click="_retryPlanQueries">Retry</Button></template>
      </ErrorState>

      <EmptyState
        v-else-if="!editor"
        title="Build your first durable plan"
        description="Create a complete ordered cooking day, then save it before moving to Today."
      >
        <template #action><Button class="plan-touch-action" @click="_createDraft">Create plan</Button></template>
      </EmptyState>

      <section v-else aria-label="Plan workspace">
        <div
          v-if="sessionsQuery.error.value || detailQuery.error.value"
          class="mb-5 rounded-default border border-feedback-danger bg-surface p-5"
          role="alert"
        >
          <p class="font-heading text-heading-lg uppercase">Saved plan refresh failed</p>
          <p class="text-ui text-text-muted">Your editable plan is still here. Retry to refresh server data.</p>
          <Button type="button" variant="outline" class="plan-touch-action mt-3" @click="_retryPlanQueries">Retry refresh</Button>
        </div>

        <div class="plan-workspace-actions">
          <div>
            <p v-if="savedMessage" role="status" class="text-feedback-success">{{ savedMessage }}</p>
            <p v-else>{{ editor.sessionId ? 'Editing a saved server draft.' : 'New plan — not saved yet.' }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button v-if="sessions.length > 0" type="button" variant="outline" class="plan-touch-action" @click="_createDraft">New plan</Button>
            <Button
              v-for="session in sessions"
              :key="session.id"
              type="button"
              variant="outline"
              class="plan-touch-action"
              :aria-pressed="selectedSessionId === session.id"
              @click="_selectSession(session.id)"
            >
              {{ session.title }}
            </Button>
          </div>
        </div>

        <div v-if="saveError" class="mb-5 rounded-default border border-feedback-danger bg-surface p-5" role="alert">
          <p class="font-heading text-heading-lg uppercase">Plan not saved</p>
          <p class="text-ui text-text-muted">{{ _errorMessage }}</p>
          <ul v-if="_errorIssues.length" class="mt-3 list-disc pl-5 text-small text-feedback-danger">
            <li v-for="issue in _errorIssues" :key="`${issue.path}:${issue.code}`">{{ issue.path }} — {{ issue.message }}</li>
          </ul>
        </div>

        <PlanEditor v-model="editor" :saving="_saving" @save="_savePlan" />
      </section>
    </div>
  </div>
</template>

<style scoped>
.plan-page {
  /* A grid rather than a block so the banner's negative margins bleed to the
     viewport edges without collapsing into this element's own box. Nothing may
     clip overflow here either — this box sits inside the shell's `<main>`
     padding, so clipping would crop that bleed back to the text column. */
  display: grid;
  min-width: 0;
  color: var(--color-text);
}
.plan-main { width: 100%; padding-block: 28px; }
.plan-workspace-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; color: var(--color-text-muted); font-size: var(--text-small); }
.plan-touch-action { min-width: 44px; min-height: 44px; }
@media (min-width: 768px) {
  .plan-main { padding-block: 40px 72px; }
}
</style>
