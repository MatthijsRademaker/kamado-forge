<script setup lang="ts">
import { computed, ref } from "vue";
import { ArrowRight, Flame, Hammer, Trophy, Utensils } from "lucide-vue-next";
import ForgeMediaCard from "@/components/ForgeMediaCard.vue";
import ProductAreaView from "@/components/ProductAreaView.vue";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { placeholderBooks, placeholderPaths } from "@/content/placeholder";

const ALL_GUIDES = "All guides";

const activeCategory = ref(ALL_GUIDES);

const _pathIcons = { flame: Flame, grill: Utensils, tools: Hammer, trophy: Trophy };

const _categories = computed(() => [ALL_GUIDES, ...new Set(placeholderBooks.map((book) => book.category))]);
const _visibleBooks = computed(() =>
  activeCategory.value === ALL_GUIDES
    ? placeholderBooks
    : placeholderBooks.filter((book) => book.category === activeCategory.value),
);

defineOptions({
  components: {
    ArrowRight,
    Badge,
    Flame,
    ForgeMediaCard,
    Hammer,
    ProductAreaView,
    Tabs,
    TabsList,
    TabsTrigger,
    Trophy,
    Utensils,
  },
});
</script>

<template>
  <div class="grid min-w-0 gap-10">
    <ProductAreaView
      eyebrow="Build instinct"
      heading="Learn"
      tagline="Knowledge. Practice. Mastery."
      description="The kamado-first library for understanding airflow, ceramic heat, fuel, technique, and the reasoning behind every move."
      image="/img/hero-learn.jpg"
    />

    <section class="grid min-w-0 gap-6" aria-labelledby="guides-heading" data-placeholder="learn-library">
      <div class="flex min-w-0 flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-1">
        <h2 id="guides-heading" class="sr-only">Guides</h2>
        <Tabs v-model="activeCategory">
          <TabsList class="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger
              v-for="category in _categories"
              :key="category"
              :value="category"
              class="h-auto flex-none px-1 pb-2 font-label text-label tracking-[0.1em] text-neutral-mist uppercase"
            >
              {{ category }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ul class="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <li v-for="book in _visibleBooks" :key="book.slug" class="grid min-w-0">
          <ForgeMediaCard
            :category="book.category"
            :description="book.description"
            :image="book.image"
            :lessons="book.lessons"
            :minutes="book.minutes"
            :percent-complete="book.percentComplete"
            :title="book.title"
          />
        </li>
      </ul>
    </section>

    <section class="grid min-w-0 gap-5" aria-labelledby="paths-heading" data-placeholder="learning-paths">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <div class="grid gap-1">
          <h2 id="paths-heading" class="font-heading text-heading-xl tracking-[0.04em] uppercase">Learning paths</h2>
          <p class="text-ui text-text-muted">Follow structured paths to build your skills step by step.</p>
        </div>
        <p class="flex items-center gap-2 font-label text-label tracking-[0.1em] text-accent uppercase">
          View all paths <ArrowRight aria-hidden="true" class="size-4" />
        </p>
      </div>

      <ul class="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <li
          v-for="path in placeholderPaths"
          :key="path.slug"
          class="relative grid justify-items-center gap-3 rounded-default border bg-surface px-5 pt-8 pb-5 text-center"
          :class="path.recommended ? 'border-accent' : 'border-border-subtle'"
        >
          <Badge v-if="path.recommended" class="absolute -top-2.5 left-4 rounded-compact">Recommended</Badge>
          <component :is="_pathIcons[path.icon]" aria-hidden="true" class="size-10 stroke-1 text-neutral-mist" />
          <div class="grid gap-1">
            <h3 class="font-heading text-heading-lg leading-none tracking-[0.04em] uppercase">{{ path.title }}</h3>
            <p class="text-ui text-text-muted">{{ path.tagline }}</p>
          </div>
          <p class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">
            {{ path.guides }} guides · {{ path.hours }}
          </p>
          <div class="mt-auto flex w-full items-center gap-3 pt-2">
            <div
              class="h-1 flex-1 overflow-hidden rounded-pill bg-neutral-pewter"
              role="progressbar"
              :aria-label="`${path.title} progress`"
              :aria-valuenow="path.percentComplete"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <span class="block h-full rounded-pill bg-accent" :style="{ width: `${path.percentComplete}%` }" />
            </div>
            <span class="font-label text-caption text-neutral-mist">{{ path.percentComplete }}%</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

