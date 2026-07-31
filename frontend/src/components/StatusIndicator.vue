<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    value?: string | number;
    status?: "success" | "warning" | "danger" | "info" | "neutral";
  }>(),
  {
    status: "neutral",
  },
);
</script>

<template>
  <output
    class="inline-flex w-fit items-center gap-2 rounded-pill border px-3 py-1 text-ui"
    :class="[
      status === 'success' && 'border-feedback-success text-feedback-success',
      status === 'warning' && 'border-feedback-warning text-feedback-warning',
      status === 'danger' && 'border-feedback-danger text-feedback-danger',
      status === 'info' && 'border-feedback-info text-feedback-info',
      status === 'neutral' && 'border-border text-text-muted',
    ]"
    :data-status="status"
    :aria-label="`${label}: ${value ?? status}`"
  >
    <span
      class="size-2 rounded-pill bg-current"
      aria-hidden="true"
    ></span>
    <span class="font-label uppercase">{{ label }}</span>
    <span class="text-text"><slot>{{ value }}</slot></span>
  </output>
</template>
