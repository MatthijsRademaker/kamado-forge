<script setup lang="ts">
import { Anchor, ChevronRight, Clock, Thermometer, Wind } from "lucide-vue-next";
import { placeholderPrinciples } from "@/content/placeholder";

/**
 * The "Fire management principles" rail list from `designs/fire-management.png`:
 * an icon gutter separated by a hairline, an ember title, and body copy.
 *
 * Placeholder content — these principles are not authored in the product yet.
 */
const icons = { anchor: Anchor, clock: Clock, thermometer: Thermometer, wind: Wind };

defineOptions({ components: { Anchor, ChevronRight, Clock, Thermometer, Wind } });
</script>

<template>
  <section
    aria-labelledby="principles-heading"
    data-placeholder="principles"
    class="grid gap-0 overflow-hidden rounded-default border border-border-subtle bg-surface"
  >
    <h2
      id="principles-heading"
      class="border-b border-border-subtle px-5 py-4 font-label text-label tracking-[0.1em] text-neutral-mist uppercase"
    >
      Fire management principles
    </h2>

    <ul>
      <li
        v-for="principle in placeholderPrinciples"
        :key="principle.title"
        class="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border-subtle p-4 last:border-b-0"
      >
        <component :is="icons[principle.icon]" aria-hidden="true" class="size-6 shrink-0 stroke-1 text-neutral-mist" />
        <div class="min-w-0 grid gap-1">
          <h3 class="font-label text-label tracking-[0.04em] text-accent">{{ principle.title }}</h3>
          <p class="text-small leading-relaxed text-text-muted">{{ principle.body }}</p>
        </div>
        <ChevronRight aria-hidden="true" class="size-4 shrink-0 text-neutral-steel" />
      </li>
    </ul>
  </section>
</template>
