<script setup lang="ts">
import { computed, ref } from "vue";
import { ArrowLeft, ArrowRight, Check, Flame, Pause, Play, X } from "lucide-vue-next";
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
import {
  Dialog as _Dialog,
  DialogClose as _DialogClose,
  DialogContent as _DialogContent,
  DialogDescription as _DialogDescription,
  DialogFooter as _DialogFooter,
  DialogHeader as _DialogHeader,
  DialogTitle as _DialogTitle,
  DialogTrigger as _DialogTrigger,
} from "@/components/ui/dialog";
import { Progress as _Progress } from "@/components/ui/progress";
import { Textarea as _Textarea } from "@/components/ui/textarea";

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

const session = computed(() => sessionQuery.data.value);
const plan = computed(() => session.value?.plan);
const totalSteps = computed(() => plan.value?.phases.flatMap((phase) => phase.steps).length ?? 0);
const currentOrdinal = computed(() => session.value?.currentStep?.ordinal ?? totalSteps.value - 1);
const progressPercent = computed(() =>
  totalSteps.value === 0 ? 0 : Math.round(((currentOrdinal.value + 1) / totalSteps.value) * 100),
);
const terminal = computed(() => session.value?.status === "COMPLETED" || session.value?.status === "CANCELLED");
const actionPending = computed(() =>
  [pauseMutation, resumeMutation, returnMutation, advanceMutation, cancelMutation, completeMutation].some(
    (mutation) => mutation.isLoading.value,
  ),
);
const notes = computed(() => session.value?.executionHistory.flatMap((visit) => visit.notes) ?? []);

defineOptions({
  components: {
    ArrowLeft,
    ArrowRight,
    Button: _Button,
    Check,
    Dialog: _Dialog,
    DialogClose: _DialogClose,
    DialogContent: _DialogContent,
    DialogDescription: _DialogDescription,
    DialogFooter: _DialogFooter,
    DialogHeader: _DialogHeader,
    DialogTitle: _DialogTitle,
    DialogTrigger: _DialogTrigger,
    EmptyState: _EmptyState,
    ErrorState: _ErrorState,
    Flame,
    LoadingState: _LoadingState,
    Pause,
    Play,
    Progress: _Progress,
    StatusIndicator: _StatusIndicator,
    Textarea: _Textarea,
    X,
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

function _formatDuration(startedAt: string | undefined): string {
  if (!startedAt) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
</script>

<template>
  <LoadingState
    v-if="sessionQuery.isPending.value"
    label="Loading durable cook"
    description="Reading session guidance, progress, and notes from the server."
  />

  <ErrorState
    v-else-if="sessionQuery.error.value"
    title="Cook detail unavailable"
    description="This ID-addressed session could not be loaded. Retry without falling back to fixture state."
  >
    <template #action>
      <Button class="min-h-11" @click="sessionQuery.refetch(true)">Retry cook detail</Button>
      <Button as-child variant="outline" class="min-h-11"><RouterLink :to="{ name: 'today' }">Return to Today</RouterLink></Button>
    </template>
  </ErrorState>

  <EmptyState v-else-if="!session || !plan" title="Cooking session not found" description="Return to Today to choose an eligible plan.">
    <template #action><Button as-child class="min-h-11"><RouterLink :to="{ name: 'today' }">Return to Today</RouterLink></Button></template>
  </EmptyState>

  <article v-else class="live-page -mx-4 -mt-6 grid min-w-0 gap-0 sm:-mx-6 sm:-mt-8 lg:-mx-8 lg:-mt-12 xl:-mx-12">
    <section data-testid="live-glance" class="relative grid min-h-[27rem] content-start overflow-hidden border-b border-border-subtle bg-neutral-obsidian px-4 pt-5 pb-6 sm:px-8 lg:min-h-0 lg:px-12 lg:py-9">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgb(228_81_26_/_0.18),transparent_42%)]" aria-hidden="true"></div>
      <div class="relative mx-auto grid w-full max-w-6xl gap-4">
        <div class="flex items-center justify-between gap-3">
          <p class="flex items-center gap-2 font-label text-caption tracking-[0.18em] text-accent uppercase"><Flame aria-hidden="true" class="size-4 fill-current" /> {{ terminal ? 'Cook record' : 'Live cook' }}</p>
          <StatusIndicator label="Session" :value="session.status" :status="session.status === 'ACTIVE' ? 'success' : session.status === 'PAUSED' ? 'warning' : 'neutral'" />
        </div>

        <div class="grid gap-2">
          <p class="font-label text-caption tracking-[0.18em] text-neutral-mist uppercase">{{ terminal ? 'Final state' : `Current action · ${currentOrdinal + 1} of ${totalSteps}` }}</p>
          <h1 class="font-display text-[2.45rem] leading-[0.95] tracking-[0.01em] uppercase sm:text-display-title">{{ terminal ? plan.title : session.currentStep?.title }}</h1>
          <p data-testid="current-action" class="max-w-3xl break-words text-[0.9rem] leading-5 text-neutral-smoke sm:text-body">{{ terminal ? `${session.status.toLowerCase()} cooking session · read-only durable detail` : session.currentStep?.instructions }}</p>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:max-w-xl sm:gap-3">
          <div data-testid="planned-dome-target" class="min-w-0 border-l-2 border-accent bg-surface/70 px-3 py-2.5">
            <p class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">Planned dome range</p>
            <p class="break-words font-heading text-[1.75rem] leading-none text-text">{{ plan.plannedDomeRange.minF }}–{{ plan.plannedDomeRange.maxF }}<span class="ml-1 text-label text-accent">°F</span></p>
          </div>
          <div data-testid="planned-food-target" class="min-w-0 border-l-2 border-accent bg-surface/70 px-3 py-2.5">
            <p class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">Planned food target</p>
            <p class="break-words font-heading text-[1.75rem] leading-none text-text">{{ plan.plannedFoodTargetF ?? '—' }}<span class="ml-1 text-label text-accent">°F</span></p>
          </div>
        </div>
      </div>
    </section>

    <div class="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 sm:px-8 lg:grid-cols-[1.3fr_0.7fr] lg:px-12 lg:py-10">
      <div class="grid min-w-0 gap-5">
        <p v-if="actionError" class="rounded-default border border-feedback-danger bg-surface p-4 text-feedback-danger" role="alert">{{ actionError }}</p>

        <section v-if="!terminal && session.currentStep" class="grid gap-4 rounded-roomy border border-border-subtle bg-surface p-5 shadow-inset">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="font-label text-caption tracking-[0.16em] text-accent uppercase">Step timing</p>
              <h2 class="font-heading text-heading-xl uppercase">{{ _formatDuration(session.currentStep.execution.actualStartedAt) }} elapsed</h2>
            </div>
            <Button v-if="session.status === 'ACTIVE'" size="lg" variant="outline" class="min-h-11" :disabled="actionPending" @click="_runAction('pause')"><Pause aria-hidden="true" /> Pause</Button>
            <Button v-else size="lg" class="min-h-11" :disabled="actionPending" @click="_runAction('resume')"><Play aria-hidden="true" /> Resume</Button>
          </div>
          <div class="grid gap-2">
            <div class="flex justify-between gap-3 text-small text-text-muted"><span>Session progress</span><span>{{ progressPercent }}% · {{ session.currentStep.durationMinutes }} min planned</span></div>
            <Progress :model-value="progressPercent" :max="100" aria-label="Session progress" class="h-3" />
          </div>
        </section>

        <section class="grid gap-4 rounded-roomy border border-border-subtle bg-surface p-5">
          <div class="grid gap-4 sm:grid-cols-2">
            <div><p class="font-label text-label text-accent uppercase">Kamado setup</p><p class="mt-1 text-ui text-text-muted">{{ plan.setupGuidance }}</p></div>
            <div><p class="font-label text-label text-accent uppercase">Vent guidance</p><p class="mt-1 text-ui text-text-muted">{{ plan.ventGuidance }}</p></div>
            <div><p class="font-label text-label text-accent uppercase">Deflector</p><p class="mt-1 text-ui text-text-muted">{{ plan.deflectorGuidance }}</p></div>
            <div><p class="font-label text-label text-accent uppercase">Heat zone</p><p class="mt-1 text-ui text-text-muted">{{ plan.heatZoneGuidance }}</p></div>
          </div>
          <div class="border-t border-border-subtle pt-4">
            <p class="font-label text-caption tracking-[0.14em] text-text-muted uppercase">Next move</p>
            <p class="mt-1 font-heading text-heading-lg uppercase">{{ terminal ? 'This cook is read-only' : session.nextStep?.title ?? 'Finish this cook when the food is ready' }}</p>
          </div>
        </section>

        <section class="grid gap-3 rounded-roomy border border-border-subtle bg-surface p-5">
          <div>
            <p class="font-label text-label uppercase">Persisted notes</p>
            <p class="text-small text-text-muted">Notes are attached to the current execution step and survive reload.</p>
          </div>
          <ul v-if="notes.length" class="grid gap-2">
            <li v-for="persistedNote in notes" :key="persistedNote.id" class="rounded-default border border-border-subtle bg-core p-3 text-ui">{{ persistedNote.content }}</li>
          </ul>
          <p v-else class="text-ui text-text-muted">No notes saved yet.</p>
          <template v-if="!terminal">
            <label for="session-note" class="font-label text-label uppercase">New step note</label>
            <Textarea v-model="note" id="session-note" class="min-h-24" :disabled="noteMutation.isLoading.value" />
            <p v-if="noteError" class="text-small text-feedback-danger" role="alert">{{ noteError }}</p>
            <Button class="min-h-11 justify-self-start" :disabled="noteMutation.isLoading.value" @click="_saveNote">{{ noteMutation.isLoading.value ? 'Saving note…' : 'Save note' }}</Button>
          </template>
        </section>
      </div>

      <aside v-if="!terminal" class="grid content-start gap-5">
        <section class="grid gap-3 rounded-roomy border border-border-subtle bg-neutral-obsidian p-5">
          <p class="font-label text-caption tracking-[0.16em] text-text-muted uppercase">Move through the cook</p>
          <div class="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" class="min-h-11" :disabled="actionPending || currentOrdinal <= 0" @click="_runAction('return')"><ArrowLeft aria-hidden="true" /> Back</Button>
            <Button size="lg" class="min-h-11" :disabled="actionPending || !session.nextStep" @click="_runAction('advance')">Advance <ArrowRight aria-hidden="true" /></Button>
          </div>
        </section>

        <section class="grid gap-3 rounded-roomy border border-border-subtle bg-surface p-5">
          <Dialog v-model:open="finishOpen">
            <DialogTrigger as-child><Button size="lg" class="min-h-11 w-full" :disabled="actionPending || Boolean(session.nextStep)"><Check aria-hidden="true" /> Finish cook</Button></DialogTrigger>
            <DialogContent :show-close-button="false">
              <DialogHeader><DialogTitle>Finish cook?</DialogTitle><DialogDescription>This records final progress and keeps this session available at its current URL.</DialogDescription></DialogHeader>
              <p v-if="actionError" class="rounded-default border border-feedback-danger p-3 text-feedback-danger" role="alert">{{ actionError }}</p>
              <DialogFooter class="gap-2 sm:gap-0"><DialogClose as-child><Button variant="outline" class="min-h-11">Keep cooking</Button></DialogClose><Button class="min-h-11" :disabled="completeMutation.isLoading.value" @click="_finishCook">Confirm finish</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog v-model:open="cancelOpen">
            <DialogTrigger as-child><Button variant="destructive" size="lg" class="min-h-11 w-full" :disabled="actionPending"><X aria-hidden="true" /> Cancel cook</Button></DialogTrigger>
            <DialogContent :show-close-button="false">
              <DialogHeader><DialogTitle>Cancel cook?</DialogTitle><DialogDescription>This records a durable cancelled terminal state.</DialogDescription></DialogHeader>
              <p v-if="actionError" class="rounded-default border border-feedback-danger p-3 text-feedback-danger" role="alert">{{ actionError }}</p>
              <DialogFooter class="gap-2 sm:gap-0"><DialogClose as-child><Button variant="outline" class="min-h-11">Keep cooking</Button></DialogClose><Button variant="destructive" class="min-h-11" :disabled="cancelMutation.isLoading.value" @click="_cancelCook">Confirm cancel</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      </aside>
    </div>
  </article>
</template>
