<script setup lang="ts">
import { BookOpen, ClipboardList, MessageCircle, NotebookText, Sun } from "lucide-vue-next";

const _items = [
  { label: "Today", icon: Sun, available: false },
  { label: "Plan", icon: ClipboardList, available: true },
  { label: "Coach", icon: MessageCircle, available: false },
  { label: "Learn", icon: BookOpen, available: false },
  { label: "Logbook", icon: NotebookText, available: false },
] as const;
</script>

<template>
  <nav class="plan-navigation" aria-label="Primary">
    <a
      v-for="item in _items"
      :key="item.label"
      :href="item.available ? '/plan' : '#'"
      :aria-current="item.available ? 'page' : undefined"
      :aria-disabled="item.available ? undefined : 'true'"
      :class="['plan-navigation__item', item.available && 'plan-navigation__item--active']"
      @click="item.available ? undefined : $event.preventDefault()"
    >
      <component :is="item.icon" aria-hidden="true" />
      <span>{{ item.label }}</span>
    </a>
  </nav>
</template>

<style scoped>
.plan-navigation {
  position: fixed;
  inset: auto 0 0;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-top: 1px solid var(--color-border-subtle);
  background: rgb(13 13 13 / 96%);
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -12px 32px rgb(0 0 0 / 45%);
  backdrop-filter: blur(16px);
}

.plan-navigation__item {
  display: flex;
  min-width: 0;
  min-height: 64px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--color-neutral-mist);
  font-family: var(--font-label);
  font-size: var(--text-caption);
  letter-spacing: 0.04em;
  text-decoration: none;
  text-transform: uppercase;
}

.plan-navigation__item svg {
  width: 18px;
}

.plan-navigation__item[aria-disabled="true"] {
  cursor: not-allowed;
}

.plan-navigation__item--active {
  border-top: 2px solid var(--color-accent);
  background: linear-gradient(180deg, rgb(228 81 26 / 18%), transparent 70%);
  color: var(--color-neutral-frost);
}

@media (min-width: 768px) {
  .plan-navigation {
    position: sticky;
    top: 0;
    bottom: auto;
    grid-row: 1;
    border-top: 0;
    border-bottom: 1px solid var(--color-border-subtle);
    padding-bottom: 0;
    box-shadow: 0 8px 28px rgb(0 0 0 / 25%);
  }

  .plan-navigation__item {
    min-height: 56px;
    flex-direction: row;
    font-size: var(--text-small);
  }

  .plan-navigation__item--active {
    border-top: 0;
    border-bottom: 2px solid var(--color-accent);
    background: linear-gradient(0deg, rgb(228 81 26 / 16%), transparent 75%);
  }
}
</style>
