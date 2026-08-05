<script setup lang="ts">
import { computed } from "vue";
import type { CookingSession } from "@/api/generated/types.gen";
import { formatDuration, formatPlannedMinutes } from "./format";
import type { NowEntry } from "./timeline";

const props = defineProps<{ entry: NowEntry; plan: CookingSession; live: boolean }>();

const _elapsedLabel = computed(() => formatDuration(props.entry.elapsedSeconds));
const _plannedLabel = computed(() => formatPlannedMinutes(props.entry.plannedDurationMinutes));
const _positionLabel = computed(() => `${props.entry.stepPosition} of ${props.entry.totalSteps}`);
// The only live region on the page. It restates position and timing at minute
// granularity so assistive technology is not read a new value every second.
const _announcement = computed(
  () =>
    `Step ${_positionLabel.value}. ${Math.floor(props.entry.elapsedSeconds / 60)} minutes elapsed of ${props.entry.plannedDurationMinutes} planned.`,
);
</script>

<template>
  <div
    data-testid="live-now"
    data-atmosphere="flat"
    class="atmosphere-effects relative grid gap-3 border-2 border-accent bg-neutral-obsidian px-4 py-5 shadow-inset sm:px-6"
  >
    <div class="atmosphere-content grid gap-3">
      <p class="flex flex-wrap items-center gap-x-2 gap-y-1 font-label text-caption tracking-[0.18em] text-accent uppercase">
        <span>{{ entry.closed ? 'Final step' : 'Current action' }} · {{ _positionLabel }}</span>
        <span v-if="entry.attemptTotal > 1" class="border border-accent/60 px-1.5 py-0.5 text-caption">Attempt {{ entry.attempt }} of {{ entry.attemptTotal }}</span>
      </p>

      <h1 class="display-distress font-display text-[2.45rem] leading-[0.95] tracking-[0.01em] uppercase sm:text-display-title">{{ entry.title }}</h1>
      <p data-testid="current-action" class="max-w-3xl break-words text-[0.9rem] leading-5 text-neutral-smoke sm:text-body">{{ entry.instructions }}</p>

      <p class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span data-testid="step-elapsed" class="font-heading text-heading-xl leading-none uppercase">{{ _elapsedLabel }}</span>
        <span class="text-small text-text-muted">elapsed of {{ _plannedLabel }} planned</span>
      </p>
      <p class="sr-only" role="status" aria-live="polite">{{ live ? _announcement : '' }}</p>

      <div class="grid grid-cols-2 gap-2 sm:max-w-xl sm:gap-3">
        <div data-testid="planned-dome-target" class="min-w-0 border-l-2 border-accent bg-surface/70 px-3 py-2">
          <p class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">Planned dome range</p>
          <p class="break-words font-heading text-[1.5rem] leading-none text-text">{{ plan.plannedDomeRange.minF }}–{{ plan.plannedDomeRange.maxF }}<span class="ml-1 text-label text-accent">°F</span></p>
        </div>
        <div data-testid="planned-food-target" class="min-w-0 border-l-2 border-accent bg-surface/70 px-3 py-2">
          <p class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">Planned food target</p>
          <p class="break-words font-heading text-[1.5rem] leading-none text-text">{{ plan.plannedFoodTargetF ?? '—' }}<span class="ml-1 text-label text-accent">°F</span></p>
        </div>
      </div>
    </div>
  </div>
</template>
