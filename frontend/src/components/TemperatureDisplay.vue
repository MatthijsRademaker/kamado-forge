<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    value?: number | null;
    unit?: string;
    min?: number;
    max?: number;
  }>(),
  {
    unit: "°",
    min: 0,
    max: 100,
  },
);

const _hasReading = computed(() => props.value !== undefined && props.value !== null && Number.isFinite(props.value));
const lowerBound = computed(() => props.min);
const upperBound = computed(() => Math.max(props.max, lowerBound.value));
const boundedValue = computed(() =>
  Math.min(Math.max(props.value ?? lowerBound.value, lowerBound.value), upperBound.value),
);
const _fillPercentage = computed(() => {
  const range = upperBound.value - lowerBound.value;

  return range === 0 ? 100 : ((boundedValue.value - lowerBound.value) / range) * 100;
});
</script>

<template>
  <section data-atmosphere="flat" class="grid gap-3 rounded-default border border-border-subtle bg-surface-raised p-4">
    <div class="flex items-baseline justify-between gap-4">
      <span class="font-label text-label uppercase text-text-muted">{{ label }}</span>
      <output class="font-heading text-heading-lg text-text" :aria-label="label">
        <slot>{{ _hasReading ? `${value} ${unit}` : "Awaiting reading" }}</slot>
      </output>
    </div>
    <div
      v-if="_hasReading"
      data-slot="temperature-gauge"
      class="h-2 w-full overflow-hidden rounded-pill bg-core"
      role="progressbar"
      :aria-label="label"
      :aria-valuemin="lowerBound"
      :aria-valuemax="upperBound"
      :aria-valuenow="boundedValue"
    >
      <span
        data-slot="temperature-gauge-indicator"
        class="block h-full rounded-pill bg-accent"
        :style="{ width: `${_fillPercentage}%` }"
      ></span>
    </div>
    <div
      v-else
      data-slot="temperature-gauge"
      class="h-2 w-full overflow-hidden rounded-pill bg-core"
      role="progressbar"
      :aria-label="`${label}: awaiting reading`"
      aria-valuetext="Awaiting reading"
    >
      <span class="block h-full w-1/3 animate-pulse rounded-pill bg-accent"></span>
    </div>
  </section>
</template>
