<script setup lang="ts">
const stack = ["Vue 3", "Vite", "Tailwind CSS v4", "shadcn-vue", "Bun API", "SQLite"];
</script>

<template>
  <main class="min-h-screen bg-background px-6 py-12 text-foreground">
    <section class="mx-auto max-w-3xl space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
      <p class="text-sm font-medium text-muted-foreground">LLM-friendly monorepo foundation</p>
      <h1 class="text-4xl font-semibold tracking-tight">Frontend + backend scaffold</h1>
      <p class="text-lg text-muted-foreground">
        A clear Vue frontend and minimal Bun API with SQLite persistence, ready for maintainable application work.
      </p>
      <ul class="flex flex-wrap gap-2">
        <li v-for="item in stack" :key="item" class="rounded-full border px-3 py-1 text-sm">
          {{ item }}
        </li>
      </ul>
    </section>
  </main>
</template>
