<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    description?: string;
  }>(),
  {
    label: "Loading",
  },
);
</script>

<template>
  <section
    class="grid place-items-center gap-4 rounded-default border border-border-subtle bg-surface p-8 text-center shadow-inset"
    aria-busy="true"
    aria-live="polite"
    v-bind="$attrs"
  >
    <slot name="indicator">
      <span class="size-8 animate-spin rounded-pill border-2 border-border border-t-accent" aria-hidden="true"></span>
    </slot>
    <div class="grid gap-2">
      <p class="font-heading text-heading-lg uppercase text-text">{{ label }}</p>
      <p v-if="description" class="max-w-prose text-ui text-text-muted">{{ description }}</p>
      <slot />
    </div>
    <footer v-if="$slots.action" class="flex flex-wrap justify-center gap-3">
      <slot name="action" />
    </footer>
  </section>
</template>
