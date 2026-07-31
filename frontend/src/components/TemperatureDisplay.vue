<script setup lang="ts">
withDefaults(
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
</script>

<template>
  <section class="grid gap-3 rounded-default border border-border-subtle bg-surface-raised p-4">
    <div class="flex items-baseline justify-between gap-4">
      <span class="font-label text-label uppercase text-text-muted">{{ label }}</span>
      <output class="font-heading text-heading-lg text-text" :aria-label="label">
        <slot>{{ value === undefined || value === null ? "Awaiting reading" : `${value} ${unit}` }}</slot>
      </output>
    </div>
    <progress
      v-if="value !== undefined && value !== null"
      class="h-2 w-full overflow-hidden rounded-pill accent-accent [&::-webkit-progress-bar]:bg-core [&::-webkit-progress-value]:bg-accent"
      :aria-label="label"
      :max="max"
      :min="min"
      :value="value"
    >
      {{ value }} {{ unit }}
    </progress>
    <progress
      v-else
      class="h-2 w-full overflow-hidden rounded-pill accent-accent [&::-webkit-progress-bar]:bg-core [&::-webkit-progress-value]:bg-accent"
      :aria-label="`${label}: awaiting reading`"
    >
      Awaiting reading
    </progress>
  </section>
</template>
