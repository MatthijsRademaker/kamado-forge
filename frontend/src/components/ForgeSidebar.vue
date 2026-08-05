<script setup lang="ts">
import { ChevronDown, Flame } from "lucide-vue-next";
import ForgePhoto from "@/components/ForgePhoto.vue";
import ProductNavigation from "@/components/ProductNavigation.vue";
import { Button } from "@/components/ui/button";
import { placeholderProfile, placeholderProgress, placeholderQuote } from "@/content/placeholder";

defineEmits<{ navigate: [] }>();

defineOptions({
  components: { Button, ChevronDown, Flame, ForgePhoto, ProductNavigation },
});

const levelDots = Array.from({ length: placeholderProfile.levelStepCount }, (_, index) => index);
</script>

<template>
  <div class="relative flex min-h-0 flex-1 flex-col">
    <!-- Deliberately not a link: it would add a focus stop ahead of the
         navigation, and the mobile Sheet must land focus on the first
         destination when it opens. -->
    <div class="grid justify-items-center gap-2 border-b border-border-subtle px-6 py-7">
      <Flame aria-hidden="true" class="size-8 fill-accent stroke-accent" />
      <!-- The left padding offsets the trailing space letter-spacing adds after
           the final glyph, so each word optically centres on the flame above. -->
      <span class="grid justify-items-center gap-1">
        <span class="pl-[0.14em] font-heading text-heading-xl leading-none tracking-[0.14em] uppercase">Kamado</span>
        <span class="pl-[0.42em] font-heading text-heading-lg leading-none tracking-[0.42em] text-accent uppercase">
          Forge
        </span>
      </span>
      <span class="mt-1 h-px w-10 bg-border-subtle" aria-hidden="true" />
      <span class="pl-[0.3em] text-caption tracking-[0.3em] text-neutral-mist uppercase">Master the fire</span>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto px-4 py-6">
      <ProductNavigation @navigate="$emit('navigate')" />

      <section
        aria-label="Your progress"
        data-placeholder="progress"
        class="mt-8 grid gap-4 rounded-default border border-border-subtle bg-surface/60 p-4"
      >
        <p class="font-label text-caption tracking-[0.2em] text-neutral-mist uppercase">Your progress</p>

        <div class="grid gap-2">
          <p class="text-caption text-neutral-mist">Level</p>
          <p class="font-heading text-heading-lg leading-none tracking-[0.06em] uppercase">
            {{ placeholderProfile.level }}
          </p>
          <ul class="flex items-center gap-1.5" aria-hidden="true">
            <li
              v-for="dot in levelDots"
              :key="dot"
              class="size-2 rounded-pill"
              :class="dot < placeholderProfile.levelStep ? 'bg-accent' : 'bg-neutral-pewter'"
            />
          </ul>
        </div>

        <div class="grid gap-2 border-t border-border-subtle pt-3">
          <p class="text-caption text-neutral-mist">Next milestone</p>
          <div class="flex items-baseline justify-between gap-2">
            <p class="text-ui text-text">{{ placeholderProgress.milestone }}</p>
            <p class="font-label text-small text-accent">{{ placeholderProgress.percentComplete }}%</p>
          </div>
          <div
            class="h-1.5 overflow-hidden rounded-pill bg-neutral-pewter"
            role="progressbar"
            :aria-label="`${placeholderProgress.milestone} progress`"
            :aria-valuenow="placeholderProgress.percentComplete"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span class="block h-full rounded-pill bg-accent" :style="{ width: `${placeholderProgress.percentComplete}%` }" />
          </div>
        </div>

        <Button variant="outline" size="sm" class="mt-1 w-full">View progress</Button>
      </section>

      <figure data-placeholder="quote" class="mt-8 grid gap-3 px-1">
        <blockquote class="text-ui leading-relaxed text-text-muted">
          <span aria-hidden="true" class="mr-1 font-display text-heading-lg leading-none text-neutral-steel">“</span>
          {{ placeholderQuote.text }}
        </blockquote>
        <figcaption class="text-caption text-neutral-mist">— {{ placeholderQuote.attribution }}</figcaption>
        <span class="section-hairline" aria-hidden="true" />
        <p class="font-label text-caption tracking-[0.2em] text-accent uppercase">Keep the fire.</p>
      </figure>
    </div>

    <ForgePhoto
      src="/img/sidebar-kamado.jpg"
      class="sidebar-photo-fade pointer-events-none absolute inset-x-0 bottom-16 -z-1 h-56 opacity-40"
    />

    <footer class="relative border-t border-border-subtle bg-neutral-obsidian/80 px-4 py-3 backdrop-blur">
      <button
        type="button"
        data-placeholder="profile"
        class="flex w-full min-h-11 items-center gap-3 rounded-tight px-2 text-left transition duration-fast hover:bg-surface/70"
      >
        <span
          aria-hidden="true"
          class="grid size-9 shrink-0 place-items-center rounded-pill border border-border-subtle bg-surface-raised font-label text-small text-neutral-mist"
        >
          GM
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-caption text-neutral-mist">{{ placeholderProfile.greeting }},</span>
          <span class="block truncate font-heading text-label tracking-[0.06em] text-text uppercase">
            {{ placeholderProfile.name }}
          </span>
        </span>
        <ChevronDown aria-hidden="true" class="size-4 shrink-0 text-neutral-mist" />
      </button>
    </footer>
  </div>
</template>

