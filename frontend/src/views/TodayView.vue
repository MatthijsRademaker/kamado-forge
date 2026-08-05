<script setup lang="ts">
import { computed, ref } from "vue";
import { ArrowRight, CalendarDays, Circle, CircleCheckBig, Flame } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useActivateSessionMutation, useActiveSessionQuery, useEligibleSessionsQuery } from "@/api/sessions";
import _EmptyState from "@/components/EmptyState.vue";
import _ErrorState from "@/components/ErrorState.vue";
import _LoadingState from "@/components/LoadingState.vue";
import _ProductAreaView from "@/components/ProductAreaView.vue";
import _StatusIndicator from "@/components/StatusIndicator.vue";
import _LiveConditionsPanel from "@/components/panels/LiveConditionsPanel.vue";
import _PrinciplesPanel from "@/components/panels/PrinciplesPanel.vue";
import _ProTipPanel from "@/components/panels/ProTipPanel.vue";
import { Button as _Button } from "@/components/ui/button";

const activeQuery = useActiveSessionQuery();
const noActiveSession = computed(() => activeQuery.status.value === "success" && activeQuery.data.value === null);
const eligibleQuery = useEligibleSessionsQuery(noActiveSession);
const activateMutation = useActivateSessionMutation();
const router = useRouter();
const activationError = ref("");

const _activeSession = computed(() => activeQuery.data.value);
const _eligibleSessions = computed(() => eligibleQuery.data.value ?? []);

/**
 * Flattens the plan's phases against the session's current step ordinal so each
 * step can be marked done, active, or upcoming. Plan steps carry no ordinal of
 * their own — they are ordered by position — so the walk assigns them.
 */
const _phaseProgress = computed(() => {
  const session = _activeSession.value;
  if (!session) return [];

  const currentOrdinal = session.progress.currentStepOrdinal;
  let ordinal = 0;

  return session.plan.phases.map((phase) => {
    const steps = phase.steps.map((step) => {
      const stepOrdinal = ordinal++;

      return { ...step, active: stepOrdinal === currentOrdinal, done: stepOrdinal < currentOrdinal };
    });

    return {
      ...phase,
      steps,
      active: steps.some((step) => step.active),
      completedSteps: steps.filter((step) => step.done).length,
    };
  });
});

defineOptions({
  components: {
    ArrowRight,
    Button: _Button,
    CalendarDays,
    Circle,
    CircleCheckBig,
    EmptyState: _EmptyState,
    ErrorState: _ErrorState,
    Flame,
    LiveConditionsPanel: _LiveConditionsPanel,
    LoadingState: _LoadingState,
    PrinciplesPanel: _PrinciplesPanel,
    ProductAreaView: _ProductAreaView,
    ProTipPanel: _ProTipPanel,
    StatusIndicator: _StatusIndicator,
  },
});

async function _activateSession(sessionId: string): Promise<void> {
  activationError.value = "";
  try {
    const activated = await activateMutation.mutateAsync({ sessionId });
    await router.push({ name: "live", params: { sessionId: activated.id } });
  } catch (error) {
    activationError.value =
      error && typeof error === "object" && "error" in error
        ? String((error as { error: { message: string } }).error.message)
        : "The cook could not be started. Retry after checking the connection.";
  }
}
</script>

<template>
  <div data-atmosphere="mid" class="today-page grid min-w-0 gap-8">
    <ProductAreaView
      eyebrow="Today at the kamado"
      heading="Today"
      tagline="One fire. One next move."
      description="One authoritative next move, whether the grill is cold or the cook is underway."
      image="/img/hero-today.jpg"
    />

    <div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
      <div class="grid min-w-0 gap-6">
        <LoadingState
          v-if="activeQuery.isPending.value"
          label="Checking the fire"
          description="Looking for the active cooking session before considering saved drafts."
        />

        <ErrorState
          v-else-if="activeQuery.error.value"
          title="Active cook unavailable"
          description="This is a server failure, not an empty cooking day. Retry before starting another cook."
        >
          <template #action><Button class="min-h-11" @click="activeQuery.refetch(true)">Retry active lookup</Button></template>
        </ErrorState>

        <template v-else-if="_activeSession">
        <article
          class="focal-card-rail atmosphere-effects relative grid overflow-hidden rounded-default border border-border-subtle bg-surface p-6 shadow-elevated sm:p-8"
        >
          <div class="atmosphere-content grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div class="grid gap-3">
              <StatusIndicator
                label="Fire status"
                :value="_activeSession.status === 'PAUSED' ? 'Paused' : 'Running'"
                :status="_activeSession.status === 'PAUSED' ? 'warning' : 'success'"
              />
              <div>
                <p class="font-label text-caption tracking-[0.18em] text-text-muted uppercase">Active session</p>
                <h2 class="display-distress mt-1 font-display text-heading-xl tracking-[0.02em] uppercase sm:text-display-title">
                  {{ _activeSession.plan?.title ?? 'Cook in progress' }}
                </h2>
                <p class="mt-2 text-ui text-text-muted">{{ _activeSession.currentStep?.title }} · durable progress is ready to continue.</p>
              </div>
            </div>
            <Button as-child size="lg" class="atmosphere-content min-h-11">
              <RouterLink :to="{ name: 'live', params: { sessionId: _activeSession.id } }">
                Continue cook <ArrowRight aria-hidden="true" />
              </RouterLink>
            </Button>
          </div>
        </article>

        <section
          class="grid gap-0 overflow-hidden rounded-default border border-border-subtle bg-surface"
          aria-labelledby="cook-progress-heading"
        >
          <div class="grid gap-3 border-b border-border-subtle p-5">
            <div class="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="cook-progress-heading" class="font-heading text-heading-lg tracking-[0.04em] uppercase">
                Cook progress
              </h2>
              <p class="font-label text-label tracking-[0.06em] text-accent uppercase">
                Step {{ _activeSession.progress.currentStepOrdinal + 1 }} of {{ _activeSession.progress.totalSteps }}
              </p>
            </div>
            <div
              class="h-1.5 overflow-hidden rounded-pill bg-neutral-pewter"
              role="progressbar"
              aria-label="Cook progress"
              :aria-valuenow="_activeSession.progress.percent"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span class="block h-full rounded-pill bg-accent" :style="{ width: `${_activeSession.progress.percent}%` }" />
            </div>
          </div>

          <ol class="grid">
            <li
              v-for="phase in _phaseProgress"
              :key="phase.id"
              class="grid gap-3 border-b border-border-subtle p-5 last:border-b-0"
            >
              <div class="flex flex-wrap items-baseline justify-between gap-3">
                <h3 class="font-label text-label tracking-[0.06em] uppercase" :class="phase.active ? 'text-accent' : 'text-text'">
                  {{ phase.title }}
                </h3>
                <p class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">
                  {{ phase.completedSteps }}/{{ phase.steps.length }} · {{ phase.technique }}
                </p>
              </div>
              <ul class="grid gap-2">
                <li
                  v-for="step in phase.steps"
                  :key="step.id"
                  class="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-ui"
                >
                  <CircleCheckBig v-if="step.done" aria-hidden="true" class="size-4 text-feedback-success" />
                  <Circle v-else-if="step.active" aria-hidden="true" class="size-4 fill-accent stroke-accent" />
                  <Circle v-else aria-hidden="true" class="size-4 text-neutral-mist/50" />
                  <span :class="step.active ? 'text-text' : 'text-text-muted'">{{ step.title }}</span>
                  <span class="font-label text-caption text-neutral-mist">{{ step.durationMinutes }} min</span>
                </li>
              </ul>
            </li>
          </ol>
        </section>

        <section
          v-if="_activeSession.nextStep"
          class="grid gap-4 rounded-default border border-border-subtle bg-surface p-5 sm:grid-cols-[1fr_auto] sm:items-center"
          aria-labelledby="up-next-heading"
        >
          <div class="grid gap-1">
            <p id="up-next-heading" class="font-label text-caption tracking-[0.16em] text-accent uppercase">Up next</p>
            <h3 class="font-heading text-heading-lg tracking-[0.04em] uppercase">{{ _activeSession.nextStep.title }}</h3>
            <p class="text-ui text-text-muted">
              {{ _activeSession.nextStep.instructions }} · {{ _activeSession.nextStep.durationMinutes }} min
            </p>
          </div>
          <Button as-child variant="outline" class="min-h-11">
            <RouterLink :to="{ name: 'live', params: { sessionId: _activeSession.id } }">
              Open live cook <ArrowRight aria-hidden="true" />
            </RouterLink>
          </Button>
        </section>
        </template>

        <LoadingState
          v-else-if="eligibleQuery.isPending.value"
          label="Loading saved drafts"
          description="No cook is active. Finding plans that are eligible to start."
        />

        <ErrorState
          v-else-if="eligibleQuery.error.value"
          title="Saved drafts unavailable"
          description="The active lookup succeeded, but eligible plans could not be loaded."
        >
          <template #action><Button class="min-h-11" @click="eligibleQuery.refetch(true)">Retry drafts</Button></template>
        </ErrorState>

        <EmptyState
          v-else-if="_eligibleSessions.length === 0"
          title="No cook on the fire"
          description="Create and save a cooking-day plan, then return here to choose it explicitly."
          class="min-h-[22rem] border-dashed"
        >
          <template #icon>
            <span class="grid size-16 place-items-center rounded-pill border border-accent/50 bg-accent/10 text-accent" aria-hidden="true"><Flame class="size-8" /></span>
          </template>
          <template #action>
            <Button as-child size="lg" class="min-h-11"><RouterLink :to="{ name: 'plan' }"><CalendarDays aria-hidden="true" /> Open Plan</RouterLink></Button>
          </template>
        </EmptyState>

        <section v-else class="grid gap-4" aria-labelledby="draft-heading">
          <div>
            <p class="font-label text-caption tracking-[0.18em] text-accent uppercase">Choose the next cook</p>
            <h2 id="draft-heading" class="font-heading text-heading-xl uppercase">Eligible saved plans</h2>
            <p class="text-ui text-text-muted">Starting is explicit. No draft is selected or activated automatically.</p>
          </div>
          <p v-if="activationError" class="rounded-default border border-feedback-danger bg-surface p-4 text-feedback-danger" role="alert">{{ activationError }}</p>
          <article
            v-for="session in _eligibleSessions"
            :key="session.id"
            class="grid gap-5 rounded-default border border-border-subtle bg-surface p-6 shadow-inset sm:grid-cols-[1fr_auto] sm:items-end"
          >
            <div>
              <StatusIndicator label="Session" value="Draft ready" status="info" />
              <h3 class="display-distress mt-4 font-display text-heading-xl uppercase">{{ session.title }}</h3>
              <p class="text-ui text-text-muted">{{ session.phases.length }} phases · {{ session.cookingDate }}</p>
            </div>
            <Button
              size="lg"
              class="min-h-11"
              :disabled="activateMutation.isLoading.value"
              @click="_activateSession(session.id)"
            >
              {{ activateMutation.isLoading.value ? 'Starting…' : 'Start this cook' }} <ArrowRight aria-hidden="true" />
            </Button>
          </article>
        </section>
      </div>

      <aside class="grid min-w-0 gap-4 xl:sticky xl:top-28" aria-label="Fire reference">
        <LiveConditionsPanel />
        <PrinciplesPanel />
        <ProTipPanel />
      </aside>
    </div>
  </div>
</template>
