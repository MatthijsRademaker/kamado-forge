<script setup lang="ts">
import { computed } from "vue";

/**
 * The radial temperature gauge from section 7 of `designs/design-system.png` and
 * the "Live conditions" panel in `designs/fire-management.png`: a 240° ember arc
 * over a charcoal track, with the reading set large in ember at the centre.
 */
const props = withDefaults(
  defineProps<{
    label: string;
    max: number;
    min: number;
    value: number;
    unit?: string;
  }>(),
  {
    unit: "°F",
  },
);

/** Geometry for a 240° arc centred at (100, 100) with radius 80. */
const ARC_LENGTH = 335.1;

const _fraction = computed(() => {
  const range = props.max - props.min;
  if (range <= 0) return 0;

  return Math.min(Math.max((props.value - props.min) / range, 0), 1);
});

const _dashOffset = computed(() => ARC_LENGTH * (1 - _fraction.value));
</script>

<template>
  <figure
    data-atmosphere="flat"
    class="grid justify-items-center gap-1"
    role="img"
    :aria-label="`${label}: ${value}${unit}`"
  >
    <div class="relative w-full max-w-56">
      <svg viewBox="0 0 200 160" class="w-full" aria-hidden="true">
        <path
          d="M 30.7 140 A 80 80 0 1 1 169.3 140"
          fill="none"
          stroke="var(--color-neutral-pewter)"
          stroke-linecap="round"
          stroke-width="10"
        />
        <path
          d="M 30.7 140 A 80 80 0 1 1 169.3 140"
          fill="none"
          stroke="var(--color-accent)"
          stroke-linecap="round"
          stroke-width="10"
          :stroke-dasharray="ARC_LENGTH"
          :stroke-dashoffset="_dashOffset"
        />
      </svg>

      <figcaption class="absolute inset-x-0 top-[38%] grid justify-items-center gap-1">
        <span class="font-heading text-[2.5rem] leading-none tracking-[0.02em] text-accent">{{ value }}{{ unit }}</span>
        <span class="font-label text-caption tracking-[0.18em] text-neutral-mist uppercase">{{ label }}</span>
      </figcaption>
    </div>

    <div class="flex w-full max-w-56 justify-between font-label text-caption tracking-[0.1em] text-neutral-mist uppercase">
      <span>{{ min }}{{ unit }}</span>
      <span>{{ max }}{{ unit }}</span>
    </div>
  </figure>
</template>
