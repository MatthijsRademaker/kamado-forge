<script setup lang="ts">
defineProps<{
  description: string;
  eyebrow: string;
  heading: string;
}>();
</script>

<template>
  <section class="relative isolate mx-auto w-full max-w-5xl overflow-hidden rounded-roomy border border-border-subtle bg-surface px-5 py-10 shadow-elevated sm:px-8 sm:py-14 lg:px-12 lg:py-16">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-[radial-gradient(circle,var(--color-ember)_0%,transparent_68%)] opacity-15 blur-2xl"
    />
    <div class="max-w-2xl">
      <p class="mb-3 font-label text-label tracking-[0.16em] text-accent uppercase">
        {{ eyebrow }}
      </p>
      <h1
        :id="`${heading.toLowerCase()}-heading`"
        class="font-display text-[clamp(3.5rem,12vw,7.5rem)] leading-[0.88] tracking-[-0.02em] text-text uppercase"
      >
        {{ heading }}
      </h1>
      <div class="my-7 h-px w-20 bg-accent" />
      <p class="max-w-xl text-body leading-7 text-text-muted sm:text-lg">
        {{ description }}
      </p>
    </div>
    <div class="mt-12 grid grid-cols-[auto_1fr] items-center gap-4 border-t border-border-subtle pt-6 text-small tracking-[0.12em] text-neutral-mist uppercase">
      <span class="font-label text-label text-text">Kamado Forge</span>
      <span class="h-px bg-border-subtle" />
    </div>
  </section>
</template>
