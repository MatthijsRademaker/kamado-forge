<script lang="ts">
import { BookOpen, CalendarDays, Flame, MessageCircle, NotebookTabs } from "lucide-vue-next";
import { defineComponent } from "vue";
import { productNavigation } from "@/navigation";

export default defineComponent({
  emits: ["navigate"],
  setup() {
    const icons = {
      book: BookOpen,
      calendar: CalendarDays,
      flame: Flame,
      logbook: NotebookTabs,
      message: MessageCircle,
    };

    return { icons, productNavigation };
  },
});
</script>

<template>
  <nav aria-label="Primary">
    <ul class="space-y-1.5">
      <li
        v-for="item in productNavigation"
        :key="item.routeName"
      >
        <RouterLink
          :to="{ name: item.routeName }"
          :aria-current="$route.name === item.routeName ? 'page' : undefined"
          class="group relative flex min-h-14 items-center gap-4 rounded-tight border border-transparent px-4 font-label text-label tracking-[0.08em] text-neutral-smoke uppercase transition duration-fast hover:bg-surface/70 hover:text-text"
          active-class="nav-ember-active text-text"
          @click="$emit('navigate')"
        >
          <span
            v-if="$route.name === item.routeName"
            data-current-marker
            aria-hidden="true"
            class="absolute inset-y-0 left-0 w-[3px] rounded-compact bg-accent"
          />
          <component
            :is="icons[item.icon]"
            aria-hidden="true"
            class="relative z-1 size-5 shrink-0 stroke-[1.5] group-hover:text-accent"
            :class="$route.name === item.routeName ? 'text-accent' : 'text-neutral-mist'"
          />
          <span class="relative z-1">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
