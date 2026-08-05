<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: "Nothing here yet",
  },
);
</script>

<template>
  <section
    v-bind="$attrs"
    data-atmosphere="high"
    class="atmosphere-effects rounded-default border border-border-subtle bg-surface p-8 text-center shadow-inset"
  >
    <div class="atmosphere-content grid place-items-center gap-4">
      <slot name="icon">
        <span class="grid size-12 place-items-center rounded-pill border border-border bg-surface-raised text-label text-text-muted" aria-hidden="true">
          —
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
    </div>
  </section>
</template>
