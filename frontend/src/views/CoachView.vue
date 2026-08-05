<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { AlertTriangle, ArrowUp, Flame, MessageCircle, RefreshCw, Sparkles, UserRound } from "lucide-vue-next";
import { CoachApiRequestError, CoachTransportError, type CoachMutationError, useAskCoachMutation } from "@/api/coach";
import type { CoachContext, CoachResult } from "@/api/generated/types.gen";
import { useActiveSessionQuery } from "@/api/sessions";
import _LearningStatePanel from "@/components/panels/LearningStatePanel.vue";
import { phaseTitleAtStep } from "@/features/live/timeline";
import { Button as _Button } from "@/components/ui/button";
import { Textarea as _Textarea } from "@/components/ui/textarea";

interface TurnFailure {
  readonly error: CoachMutationError;
  readonly message: string;
  readonly retryable: boolean;
}

interface CoachTurn {
  readonly id: string;
  readonly question: string;
  status: "pending" | "succeeded" | "failed";
  response?: CoachResult;
  failure?: TurnFailure;
}

const activeQuery = useActiveSessionQuery();
const askMutation = useAskCoachMutation();
const composer = ref("");
const composerError = ref("");
const composerRef = ref<{ $el: HTMLTextAreaElement } | null>(null);
const turns = ref<CoachTurn[]>([]);
let nextTurnOrdinal = 0;

const activeSession = computed(() => activeQuery.data.value);
const contextReady = computed(() => activeQuery.status.value === "success");
const pending = computed(() => turns.value.some((turn) => turn.status === "pending"));
const _activePhaseTitle = computed(() =>
  activeSession.value ? phaseTitleAtStep(activeSession.value, activeSession.value.currentStep?.ordinal ?? 0) : "",
);
const _suggestions = computed(() =>
  activeSession.value
    ? [
        `What should I watch for during ${activeSession.value.currentStep?.title ?? "this step"}?`,
        "Should I adjust the vents right now?",
        "What warning signs matter most at this point?",
      ]
    : [
        "How should I build a clean kamado fire?",
        "How long should I wait after changing a vent?",
        "What does clean smoke look like?",
      ],
);

const retryableProviderCodes = new Set([
  "COACH_PROVIDER_TIMEOUT",
  "COACH_PROVIDER_UNAVAILABLE",
  "COACH_PROVIDER_RATE_LIMITED",
  "COACH_PROVIDER_INVALID_OUTPUT",
]);

defineOptions({
  components: {
    AlertTriangle,
    ArrowUp,
    Button: _Button,
    Flame,
    LearningStatePanel: _LearningStatePanel,
    MessageCircle,
    RefreshCw,
    Sparkles,
    Textarea: _Textarea,
    UserRound,
  },
});

async function _submitQuestion(): Promise<void> {
  if (pending.value || !contextReady.value) return;
  const question = composer.value.trim();
  if (!question) {
    composerError.value = "Enter a question before sending.";
    return;
  }

  composerError.value = "";
  composer.value = "";
  const turn: CoachTurn = { id: `coach-turn-${nextTurnOrdinal++}`, question, status: "pending" };
  turns.value.push(turn);
  await sendTurn(turn.id, turn.question);
}

async function _retryTurn(turn: CoachTurn): Promise<void> {
  if (pending.value || turn.status !== "failed" || !turn.failure?.retryable) return;
  updateTurn(turn.id, { status: "pending", failure: undefined, response: undefined });
  await sendTurn(turn.id, turn.question);
}

async function sendTurn(turnId: string, question: string): Promise<void> {
  try {
    const response = await askMutation.mutateAsync(question);
    updateTurn(turnId, { status: "succeeded", response, failure: undefined });
  } catch (error) {
    updateTurn(turnId, {
      status: "failed",
      response: undefined,
      failure: describeFailure(toCoachMutationError(error)),
    });
  }
}

function updateTurn(turnId: string, patch: Partial<Omit<CoachTurn, "id" | "question">>): void {
  const index = turns.value.findIndex(({ id }) => id === turnId);
  if (index < 0) throw new Error(`Coach turn disappeared: ${turnId}`);
  const turn = turns.value[index];
  if (!turn) throw new Error(`Coach turn index disappeared: ${turnId}`);
  turns.value[index] = { ...turn, ...patch };
}

function toCoachMutationError(error: unknown): CoachMutationError {
  if (error instanceof CoachApiRequestError || error instanceof CoachTransportError) return error;
  throw error;
}

function describeFailure(error: CoachMutationError): TurnFailure {
  if (error instanceof CoachTransportError) {
    return {
      error,
      message: "Coach could not be reached. Check your connection and retry.",
      retryable: true,
    };
  }

  const { code, message } = error.apiError.error;
  if (code === "COACH_PROVIDER_DISABLED") {
    return {
      error,
      message: `${message}. Server configuration is required before Coach can answer.`,
      retryable: false,
    };
  }
  return {
    error,
    message,
    retryable: retryableProviderCodes.has(code),
  };
}

async function _applySuggestion(suggestion: string): Promise<void> {
  if (pending.value) return;
  composer.value = suggestion;
  composerError.value = "";
  await nextTick();
  composerRef.value?.$el.focus();
}

function _onComposerKeydown(event: KeyboardEvent): void {
  if (event.key !== "Enter" || (!event.ctrlKey && !event.metaKey)) return;
  event.preventDefault();
  void _submitQuestion();
}

function _contextTitle(context: CoachContext): string {
  return context.kind === "active" ? context.sessionTitle : "No active cook";
}
</script>

<template>
  <div class="mx-auto grid min-w-0 max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
    <section class="grid min-w-0 gap-6">
      <header class="grid gap-3 border-b border-border-subtle pb-5">
        <div class="flex min-w-0 items-center gap-3">
          <span class="grid size-11 shrink-0 place-items-center rounded-pill border border-accent/50 bg-accent/10 text-accent shadow-inset">
            <MessageCircle aria-hidden="true" class="size-5" />
          </span>
          <div class="min-w-0">
            <p class="font-label text-caption tracking-[0.2em] text-accent uppercase">Read the fire</p>
            <h1 class="font-display text-heading-xl tracking-[0.02em] uppercase sm:text-display-title">Coach</h1>
          </div>
        </div>
        <p class="max-w-2xl text-ui text-text-muted">
          Ask one focused kamado question. Coach resolves the live cook again for every send and retry.
        </p>
      </header>

      <section
        aria-label="Current cook context"
        class="min-w-0 overflow-hidden rounded-default border border-border-subtle bg-surface shadow-inset"
      >
        <div class="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 sm:px-5">
          <div class="flex min-w-0 items-center gap-2">
            <Flame aria-hidden="true" class="size-4 shrink-0 text-accent" />
            <h2 class="font-label text-label tracking-[0.08em] uppercase">Current cook context</h2>
          </div>
          <span v-if="activeSession" class="shrink-0 rounded-pill border border-feedback-success/50 px-2 py-1 text-caption text-feedback-success uppercase">
            {{ activeSession.status }}
          </span>
        </div>

        <div v-if="activeQuery.isPending.value" class="p-5 text-ui text-text-muted" aria-live="polite">
          Checking for an active cook…
        </div>
        <div v-else-if="activeQuery.error.value" class="grid gap-3 p-5" role="alert">
          <p class="text-ui text-feedback-danger">Current cook context could not be loaded. Retry before asking.</p>
          <Button class="min-h-11 justify-self-start" variant="outline" @click="activeQuery.refetch(true)">
            <RefreshCw aria-hidden="true" /> Retry context
          </Button>
        </div>
        <div v-else-if="activeSession" class="grid min-w-0 gap-4 p-5 sm:grid-cols-3">
          <div class="min-w-0 sm:col-span-3">
            <p class="text-caption tracking-[0.12em] text-text-muted uppercase">Session</p>
            <p class="mt-1 break-words font-heading text-heading-lg uppercase">{{ activeSession.plan.title }}</p>
          </div>
          <div class="min-w-0">
            <p class="text-caption tracking-[0.12em] text-text-muted uppercase">Status</p>
            <p class="mt-1 break-words text-ui">{{ activeSession.status }}</p>
          </div>
          <div class="min-w-0">
            <p class="text-caption tracking-[0.12em] text-text-muted uppercase">Phase</p>
            <p class="mt-1 break-words text-ui">{{ _activePhaseTitle }}</p>
          </div>
          <div class="min-w-0">
            <p class="text-caption tracking-[0.12em] text-text-muted uppercase">Current step</p>
            <p class="mt-1 break-words text-ui">{{ activeSession.currentStep?.title }}</p>
          </div>
        </div>
        <div v-else class="grid gap-1 p-5">
          <p class="font-heading text-heading-lg uppercase">No active cook</p>
          <p class="text-ui text-text-muted">No active cook context will be used. General kamado questions are still welcome.</p>
        </div>
      </section>

      <section class="grid min-w-0 gap-3" aria-labelledby="suggestions-heading">
        <div class="flex items-center gap-2">
          <Sparkles aria-hidden="true" class="size-4 text-accent" />
          <h2 id="suggestions-heading" class="font-label text-label tracking-[0.08em] uppercase">Questions worth asking</h2>
        </div>
        <div class="flex min-w-0 flex-wrap gap-2">
          <Button
            v-for="suggestion in _suggestions"
            :key="suggestion"
            variant="outline"
            class="h-auto min-h-11 max-w-full justify-start whitespace-normal px-3 py-2 text-left text-ui focus-visible:!outline-2 focus-visible:!outline-focus"
            :disabled="pending || !contextReady"
            @click="_applySuggestion(suggestion)"
          >
            {{ suggestion }}
          </Button>
        </div>
      </section>

      <ol
        aria-label="Coach transcript"
        aria-live="polite"
        class="grid min-w-0 gap-4"
        role="log"
        :class="turns.length === 0 ? 'min-h-28 place-items-center rounded-default border border-dashed border-border-subtle p-6' : ''"
      >
        <li v-if="turns.length === 0" class="text-center text-ui text-text-muted">
          Your transcript begins with the next question and clears when this page reloads.
        </li>
        <li v-for="turn in turns" :key="turn.id" class="grid min-w-0 gap-3">
          <article data-speaker="user" class="ml-auto grid min-w-0 max-w-[92%] gap-2 rounded-default border border-accent/35 bg-accent/10 p-4 sm:max-w-[80%]">
            <p class="flex items-center gap-2 font-label text-label text-accent uppercase">
              <UserRound aria-hidden="true" class="size-4" /> You
            </p>
            <p class="min-w-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{{ turn.question }}</p>
          </article>

          <article
            v-if="turn.status !== 'failed'"
            data-speaker="coach"
            class="grid min-w-0 gap-4 rounded-default border border-border-subtle bg-surface p-4 shadow-inset sm:p-5"
          >
            <p class="flex items-center gap-2 font-label text-label text-accent uppercase">
              <Flame aria-hidden="true" class="size-4" /> Coach
            </p>
            <div v-if="turn.status === 'pending'" class="flex items-center gap-3 text-ui text-text-muted">
              <span class="size-4 animate-spin rounded-pill border-2 border-border border-t-accent" aria-hidden="true"></span>
              Reading the fire and shaping a concise answer…
            </div>
            <template v-else-if="turn.response">
              <p class="min-w-0 break-words text-body [overflow-wrap:anywhere]">{{ turn.response.answer }}</p>

              <section v-if="turn.response.guidance.length" class="grid gap-2" aria-label="Ordered guidance">
                <h3 class="font-label text-label tracking-[0.06em] uppercase">Guidance</h3>
                <ol class="grid gap-2 pl-6 text-ui text-text-muted">
                  <li v-for="(item, index) in turn.response.guidance" :key="`${turn.id}-guidance-${index}`" class="list-decimal break-words [overflow-wrap:anywhere]">
                    {{ item }}
                  </li>
                </ol>
              </section>

              <section
                v-if="turn.response.warnings.length"
                aria-label="Coach warnings"
                class="grid min-w-0 gap-2 rounded-default border border-feedback-warning/60 bg-feedback-warning/10 p-4"
                role="region"
              >
                <h3 class="flex items-center gap-2 font-label text-label text-feedback-warning uppercase">
                  <AlertTriangle aria-hidden="true" class="size-4 shrink-0" /> Warnings
                </h3>
                <ul class="grid gap-2 text-ui">
                  <li v-for="(warning, index) in turn.response.warnings" :key="`${turn.id}-warning-${index}`" class="break-words [overflow-wrap:anywhere]">
                    {{ warning }}
                  </li>
                </ul>
              </section>

              <section
                :aria-label="'Context used for this answer'"
                class="grid min-w-0 gap-2 rounded-default border border-border-subtle bg-core p-4"
                role="region"
              >
                <h3 class="font-label text-label tracking-[0.06em] uppercase">Context used for this answer</h3>
                <p class="break-words text-ui text-text-muted [overflow-wrap:anywhere]">
                  <template v-if="turn.response.contextUsed.kind === 'active'">
                    {{ _contextTitle(turn.response.contextUsed) }} · {{ turn.response.contextUsed.sessionStatus }} ·
                    {{ turn.response.contextUsed.phaseTitle }} · step {{ turn.response.contextUsed.stepOrdinal + 1 }}:
                    {{ turn.response.contextUsed.stepTitle }}
                  </template>
                  <template v-else>No active cook</template>
                </p>
                <dl
                  v-if="turn.response.contextUsed.kind === 'active'"
                  class="grid min-w-0 gap-2 border-t border-border-subtle pt-2 text-caption text-text-muted"
                >
                  <div class="min-w-0">
                    <dt class="font-label uppercase">Session ID</dt>
                    <dd class="break-words [overflow-wrap:anywhere]">{{ turn.response.contextUsed.sessionId }}</dd>
                  </div>
                  <div class="min-w-0">
                    <dt class="font-label uppercase">Projected at</dt>
                    <dd class="break-words [overflow-wrap:anywhere]">{{ turn.response.contextUsed.projectedAt }}</dd>
                  </div>
                </dl>
              </section>

              <section v-if="turn.response.suggestedFollowUps.length" class="grid gap-2" aria-label="Suggested follow-up questions">
                <h3 class="font-label text-label tracking-[0.06em] uppercase">Ask next</h3>
                <div class="flex min-w-0 flex-wrap gap-2">
                  <Button
                    v-for="followUp in turn.response.suggestedFollowUps"
                    :key="followUp"
                    variant="outline"
                    class="h-auto min-h-11 max-w-full whitespace-normal px-3 py-2 text-left text-ui focus-visible:!outline-2 focus-visible:!outline-focus"
                    :disabled="pending"
                    @click="_applySuggestion(followUp)"
                  >
                    {{ followUp }}
                  </Button>
                </div>
              </section>
            </template>
          </article>

          <section v-else-if="turn.failure" class="grid min-w-0 gap-3 rounded-default border border-feedback-danger/70 bg-surface p-4" role="alert">
            <p class="min-w-0 break-words text-ui text-feedback-danger [overflow-wrap:anywhere]">{{ turn.failure.message }}</p>
            <Button
              v-if="turn.failure.retryable"
              variant="outline"
              class="min-h-11 justify-self-start"
              :disabled="pending"
              @click="_retryTurn(turn)"
            >
              <RefreshCw aria-hidden="true" /> Retry question
            </Button>
          </section>
        </li>
      </ol>

      <section class="sticky bottom-3 z-10 grid min-w-0 gap-3 rounded-default border border-accent/60 bg-neutral-obsidian/95 p-3 shadow-elevated backdrop-blur sm:p-4" aria-labelledby="composer-heading">
        <div class="flex items-center justify-between gap-3">
          <h2 id="composer-heading" class="font-label text-label tracking-[0.08em] uppercase">Ask Coach</h2>
          <p class="hidden text-caption text-text-muted sm:block">Enter for a new line · Ctrl/⌘ + Enter to send</p>
        </div>
        <Textarea
          id="coach-question"
          ref="composerRef"
          v-model="composer"
          aria-label="Question for Coach"
          :aria-invalid="Boolean(composerError)"
          :aria-describedby="composerError ? 'coach-composer-error' : 'coach-composer-help'"
          :disabled="pending || !contextReady"
          class="min-h-28 resize-y border-border-subtle bg-surface px-4 py-3 text-body [overflow-wrap:anywhere]"
          placeholder="Ask about airflow, heat, smoke, timing, or the current step…"
          @input="composerError = ''"
          @keydown="_onComposerKeydown"
        />
        <div class="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <p id="coach-composer-help" class="text-caption text-text-muted">Coach receives only this question and the server-owned context summary.</p>
          <Button aria-label="Send question" class="min-h-11 shrink-0" :disabled="pending || !contextReady" @click="_submitQuestion">
            {{ pending ? 'Considering…' : 'Send question' }} <ArrowUp aria-hidden="true" />
          </Button>
        </div>
        <p v-if="composerError" id="coach-composer-error" class="text-ui text-feedback-danger" role="alert">
          {{ composerError }}
        </p>
        <p class="sr-only" role="status" aria-live="polite">
          {{ pending ? 'Coach is considering your question.' : '' }}
        </p>
      </section>
    </section>

    <aside class="grid min-w-0 gap-4 xl:sticky xl:top-28" aria-label="Coach context">
      <LearningStatePanel />

      <section
        data-atmosphere="mid"
        class="atmosphere-effects grid min-w-0 gap-4 rounded-default border border-border-subtle bg-surface p-5"
        aria-label="Coach boundaries"
      >
        <Flame aria-hidden="true" class="atmosphere-content size-7 fill-accent stroke-accent" />
        <div class="atmosphere-content grid gap-2">
          <h2 class="font-heading text-heading-lg tracking-[0.04em] uppercase">Advisory, never autonomous</h2>
          <p class="text-ui text-text-muted">Coach can explain the next move, but it cannot change steps, notes, timing, or cook status.</p>
        </div>
        <ul class="atmosphere-content grid gap-2 border-t border-border-subtle pt-4 text-small text-text-muted">
          <li>One fresh context read per attempt</li>
          <li>No notes or full session DTO sent</li>
          <li>No durable conversation history</li>
        </ul>
      </section>
    </aside>
  </div>
</template>
