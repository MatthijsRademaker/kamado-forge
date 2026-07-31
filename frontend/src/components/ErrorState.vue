<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: "Unable to continue",
  },
);
</script>

<template>
  <section
    class="grid place-items-center gap-4 rounded-roomy border border-feedback-danger bg-surface p-8 text-center shadow-inset"
    role="alert"
    v-bind="$attrs"
  >
    <slot name="icon">
      <span class="grid size-12 place-items-center rounded-pill border border-feedback-danger bg-core text-label text-feedback-danger" aria-hidden="true">
        !
      </span>
    </slot>
    <div class="grid gap-2">
      <h2 class="font-heading text-heading-lg uppercase text-text">{{ title }}</h2>
      <p v-if="description" class="max-w-prose text-ui text-text-muted">{{ description }}</p>
      <slot />
    </div>
    <footer v-if="$slots.action" class="flex flex-wrap justify-center gap-3">
      <slot name="action" />
    </footer>
  </section>
</template>
