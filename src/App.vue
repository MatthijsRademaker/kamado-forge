<script setup lang="ts">
const stack = ["Vue", "Bun", "Tailwind CSS v4", "shadcn-vue", "OpenAI", "MCP-ready"];
</script>

<template>
  <main class="min-h-screen bg-background px-6 py-12 text-foreground">
    <section class="mx-auto max-w-3xl space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
      <p class="text-sm font-medium text-muted-foreground">LLM-native starter</p>
      <h1 class="text-4xl font-semibold tracking-tight">Vue + Bun scaffold</h1>
      <p class="text-lg text-muted-foreground">
        A minimal frontend and Bun API foundation for OpenAI-backed interactions.
      </p>
      <ul class="flex flex-wrap gap-2">
        <li v-for="item in stack" :key="item" class="rounded-full border px-3 py-1 text-sm">
          {{ item }}
        </li>
      </ul>
    </section>
  </main>
</template>
