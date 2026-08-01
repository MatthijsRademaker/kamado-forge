<script setup lang="ts">
import { ArrowRight, CalendarDays, Flame, Pause } from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";
import EmptyState from "@/components/EmptyState.vue";
import StatusIndicator from "@/components/StatusIndicator.vue";
import { Button } from "@/components/ui/button";
import { useSessionFlow } from "@/features/session/context";

defineOptions({
  components: { ArrowRight, Button, CalendarDays, EmptyState, Flame, Pause, StatusIndicator },
});

const flow = useSessionFlow();
const _route = useRoute();
const router = useRouter();

async function _startCook(): Promise<void> {
  flow.startCook();
  await router.push({ name: "live", query: { fixture: "active-running" } });
}
</script>

<template>
  <div class="today-page mx-auto grid max-w-5xl gap-6">
    <header class="grid gap-2 border-b border-border-subtle pb-5">
      <p class="font-label text-caption tracking-[0.2em] text-accent uppercase">Today at the kamado</p>
      <h1 class="font-display text-heading-xl tracking-[0.02em] uppercase sm:text-display-title">Today</h1>
      <p class="max-w-2xl text-ui text-text-muted">One clear next move, whether the grill is cold or the cook is underway.</p>
    </header>

    <EmptyState
      v-if="flow.state.kind === 'no-session'"
      title="No cook on the fire"
      description="Build a cooking-day plan, then come back when you are ready to light the charcoal."
      class="min-h-[22rem] border-dashed bg-[radial-gradient(circle_at_top,rgb(228_81_26_/_0.12),transparent_50%)]"
    >
      <template #icon>
        <span class="grid size-16 place-items-center rounded-full border border-accent/50 bg-accent/10 text-accent" aria-hidden="true">
          <Flame class="size-8" />
        </span>
      </template>
      <template #action>
        <Button as-child size="lg" class="min-h-11">
          <RouterLink :to="{ name: 'plan' }"><CalendarDays aria-hidden="true" /> Plan the next cook</RouterLink>
        </Button>
      </template>
    </EmptyState>

    <article v-else-if="flow.state.kind === 'draft' && flow.state.plan" class="grid overflow-hidden rounded-roomy border border-border-subtle bg-surface shadow-elevated md:grid-cols-[1fr_auto]">
      <div class="grid gap-5 p-6 sm:p-8">
        <StatusIndicator label="Session" value="Draft ready" status="info" />
        <div class="grid gap-2">
          <h2 class="font-display text-heading-xl tracking-[0.02em] uppercase sm:text-display-title">{{ flow.state.plan.title }}</h2>
          <p class="text-ui text-text-muted">{{ flow.steps.value.length }} guided moves · {{ flow.state.plan.phases.length }} fire phases</p>
        </div>
        <dl class="grid grid-cols-2 gap-3">
          <div class="rounded-default border border-border-subtle bg-core p-4">
            <dt class="font-label text-caption tracking-[0.14em] text-text-muted uppercase">Planned dome</dt>
            <dd class="font-heading text-heading-xl text-accent">{{ flow.state.plan.plannedDomeTarget.value }}°F</dd>
          </div>
          <div class="rounded-default border border-border-subtle bg-core p-4">
            <dt class="font-label text-caption tracking-[0.14em] text-text-muted uppercase">Planned food</dt>
            <dd class="font-heading text-heading-xl text-accent">{{ flow.state.plan.plannedFoodTarget.value }}°F</dd>
          </div>
        </dl>
      </div>
      <div class="flex items-end border-t border-border-subtle bg-neutral-obsidian p-6 md:border-t-0 md:border-l">
        <Button size="lg" class="min-h-11 w-full md:w-auto" @click="_startCook">Start cook <ArrowRight aria-hidden="true" /></Button>
      </div>
    </article>

    <article v-else-if="flow.state.kind === 'active' && flow.state.plan" class="relative grid overflow-hidden rounded-roomy border border-border-subtle bg-surface p-6 shadow-elevated sm:p-8">
      <span class="absolute inset-y-0 left-0 w-1 bg-accent" aria-hidden="true"></span>
      <div class="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div class="grid gap-3">
          <StatusIndicator label="Fire status" :value="flow.state.running ? 'Running' : 'Paused'" :status="flow.state.running ? 'success' : 'warning'" />
          <div>
            <p class="font-label text-caption tracking-[0.18em] text-text-muted uppercase">Active session · Step {{ flow.state.stepIndex + 1 }} of {{ flow.steps.value.length }}</p>
            <h2 class="mt-1 font-display text-heading-xl tracking-[0.02em] uppercase sm:text-display-title">Cook in progress</h2>
            <p class="mt-2 text-ui text-text-muted">{{ flow.currentStep.value?.title }} · {{ flow.progressPercent.value }}% through the guided moves</p>
          </div>
        </div>
        <Button as-child size="lg" class="min-h-11">
          <RouterLink :to="{ name: 'live', query: _route.query }">
            <Pause v-if="!flow.state.running" aria-hidden="true" />
            {{ flow.state.running ? 'Continue cook' : 'Resume cook' }}
            <ArrowRight aria-hidden="true" />
          </RouterLink>
        </Button>
      </div>
    </article>
  </div>
</template>
