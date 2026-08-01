<script setup lang="ts">
import { computed, ref } from "vue";
import { ArrowRight, CalendarDays, Flame } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useActivateSessionMutation, useActiveSessionQuery, useEligibleSessionsQuery } from "@/api/sessions";
import _EmptyState from "@/components/EmptyState.vue";
import _ErrorState from "@/components/ErrorState.vue";
import _LoadingState from "@/components/LoadingState.vue";
import _StatusIndicator from "@/components/StatusIndicator.vue";
import { Button as _Button } from "@/components/ui/button";

const activeQuery = useActiveSessionQuery();
const noActiveSession = computed(() => activeQuery.status.value === "success" && activeQuery.data.value === null);
const eligibleQuery = useEligibleSessionsQuery(noActiveSession);
const activateMutation = useActivateSessionMutation();
const router = useRouter();
const activationError = ref("");

const activeSession = computed(() => activeQuery.data.value);
const eligibleSessions = computed(() => eligibleQuery.data.value ?? []);

defineOptions({
  components: {
    ArrowRight,
    Button: _Button,
    CalendarDays,
    EmptyState: _EmptyState,
    ErrorState: _ErrorState,
    Flame,
    LoadingState: _LoadingState,
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
  <div class="today-page mx-auto grid max-w-5xl gap-6">
    <header class="grid gap-2 border-b border-border-subtle pb-5">
      <p class="font-label text-caption tracking-[0.2em] text-accent uppercase">Today at the kamado</p>
      <h1 class="font-display text-heading-xl tracking-[0.02em] uppercase sm:text-display-title">Today</h1>
      <p class="max-w-2xl text-ui text-text-muted">One authoritative next move, whether the grill is cold or the cook is underway.</p>
    </header>

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

    <article
      v-else-if="activeSession"
      class="relative grid overflow-hidden rounded-roomy border border-border-subtle bg-surface p-6 shadow-elevated sm:p-8"
    >
      <span class="absolute inset-y-0 left-0 w-1 bg-accent" aria-hidden="true"></span>
      <div class="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div class="grid gap-3">
          <StatusIndicator
            label="Fire status"
            :value="activeSession.status === 'PAUSED' ? 'Paused' : 'Running'"
            :status="activeSession.status === 'PAUSED' ? 'warning' : 'success'"
          />
          <div>
            <p class="font-label text-caption tracking-[0.18em] text-text-muted uppercase">Active session</p>
            <h2 class="mt-1 font-display text-heading-xl tracking-[0.02em] uppercase sm:text-display-title">
              {{ activeSession.plan?.title ?? 'Cook in progress' }}
            </h2>
            <p class="mt-2 text-ui text-text-muted">{{ activeSession.currentStep?.title }} · durable progress is ready to continue.</p>
          </div>
        </div>
        <Button as-child size="lg" class="min-h-11">
          <RouterLink :to="{ name: 'live', params: { sessionId: activeSession.id } }">
            Continue cook <ArrowRight aria-hidden="true" />
          </RouterLink>
        </Button>
      </div>
    </article>

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
      v-else-if="eligibleSessions.length === 0"
      title="No cook on the fire"
      description="Create and save a cooking-day plan, then return here to choose it explicitly."
      class="min-h-[22rem] border-dashed bg-[radial-gradient(circle_at_top,rgb(228_81_26_/_0.12),transparent_50%)]"
    >
      <template #icon>
        <span class="grid size-16 place-items-center rounded-full border border-accent/50 bg-accent/10 text-accent" aria-hidden="true"><Flame class="size-8" /></span>
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
        v-for="session in eligibleSessions"
        :key="session.id"
        class="grid gap-5 rounded-roomy border border-border-subtle bg-surface p-6 shadow-inset sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <div>
          <StatusIndicator label="Session" value="Draft ready" status="info" />
          <h3 class="mt-4 font-display text-heading-xl uppercase">{{ session.title }}</h3>
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
</template>
