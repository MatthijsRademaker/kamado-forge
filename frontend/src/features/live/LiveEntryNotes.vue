<script setup lang="ts">
import { formatClock } from "./format";
import type { TimelineNote } from "./timeline";

const _formatClock = formatClock;

defineProps<{ notes: readonly TimelineNote[] }>();
</script>

<template>
  <ul v-if="notes.length" class="mt-2 grid gap-2">
    <li
      v-for="note in notes"
      :key="note.id"
      :data-note-id="note.id"
      class="border-l border-border-subtle bg-core px-3 py-2 text-ui"
    >
      <p class="break-words">{{ note.content }}</p>
      <p class="mt-1 text-caption text-text-muted">Noted {{ _formatClock(note.createdAt) }}</p>
    </li>
  </ul>
</template>
