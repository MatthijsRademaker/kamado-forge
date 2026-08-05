<script setup lang="ts">
import { BookOpen, Clock, Flame } from "lucide-vue-next";
import ForgePhoto from "@/components/ForgePhoto.vue";

/**
 * The guide card from `designs/learn-books.png` and section 4 of
 * `designs/design-system.png`: photograph on top, ember category eyebrow, Bebas
 * title, description, then a hairline-separated meta footer. The progress bar is
 * the treatment from `designs/kamado-learn-chat-page.png`, shown only when the
 * caller supplies a completion figure.
 */
withDefaults(
  defineProps<{
    category: string;
    description: string;
    image: string;
    lessons: number;
    minutes: number;
    title: string;
    percentComplete?: number | null;
  }>(),
  {
    percentComplete: null,
  },
);

defineOptions({
  components: { BookOpen, Clock, Flame, ForgePhoto },
});
</script>

<template>
  <article
    class="group grid overflow-hidden rounded-default border border-border-subtle bg-surface transition duration-fast hover:border-accent/60 hover:shadow-elevated"
  >
    <ForgePhoto :src="image" class="aspect-[16/10] w-full">
      <template #watermark>
        <Flame class="size-16 stroke-[0.75] text-neutral-steel/50" />
      </template>
    </ForgePhoto>

    <div class="grid content-start gap-2 p-5">
      <p class="font-label text-caption tracking-[0.16em] text-accent uppercase">{{ category }}</p>
      <h3 class="font-heading text-heading-lg leading-none tracking-[0.04em] uppercase">{{ title }}</h3>
      <p class="text-ui leading-relaxed text-text-muted">{{ description }}</p>
    </div>

    <footer class="mt-auto grid gap-3 border-t border-border-subtle px-5 py-4">
      <div class="flex items-center gap-5 font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">
        <span class="flex items-center gap-2">
          <BookOpen aria-hidden="true" class="size-4 stroke-[1.5]" />
          {{ lessons }} lessons
        </span>
        <span class="flex items-center gap-2">
          <Clock aria-hidden="true" class="size-4 stroke-[1.5]" />
          {{ minutes }} min
        </span>
      </div>

      <div v-if="percentComplete !== null" class="grid gap-1.5">
        <p class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">
          {{ percentComplete }}% complete
        </p>
        <div
          class="h-1 overflow-hidden rounded-pill bg-neutral-pewter"
          role="progressbar"
          :aria-label="`${title} progress`"
          :aria-valuenow="percentComplete"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span class="block h-full rounded-pill bg-accent" :style="{ width: `${percentComplete}%` }" />
        </div>
      </div>
    </footer>
  </article>
</template>

