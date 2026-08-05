<script setup lang="ts">
import { BookOpen, Brain, ChartNoAxesColumn, CircleCheck, Flame, MessageCircle, Target } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { placeholderCurrentFocus, placeholderProgress, placeholderRecentTopics } from "@/content/placeholder";

/**
 * The "Your learning state" rail from `designs/kamado-learn-chat-page.png`:
 * current focus, recently discussed topics, a skill-progress ring, the next
 * lesson, and a weekly streak strip.
 *
 * Placeholder content — none of this is served or persisted yet.
 */
const RING_CIRCUMFERENCE = 2 * Math.PI * 42;
const ringOffset = RING_CIRCUMFERENCE * (1 - placeholderProgress.skillPercent / 100);
const weekdayInitials = ["M", "T", "W", "T", "F", "S", "S"];

defineOptions({
  components: { BookOpen, Brain, Button, ChartNoAxesColumn, CircleCheck, Flame, MessageCircle, Target },
});
</script>

<template>
  <div class="grid min-w-0 gap-4" data-placeholder="learning-state">
    <h2 class="flex items-center gap-3 font-heading text-heading-lg tracking-[0.04em] uppercase">
      <Brain aria-hidden="true" class="size-6 shrink-0 stroke-[1.5] text-accent" />
      Your learning state
    </h2>

    <section aria-labelledby="focus-heading" class="grid gap-3 rounded-default border border-border-subtle bg-surface p-4">
      <h3 id="focus-heading" class="flex items-center gap-2 font-label text-label tracking-[0.1em] text-neutral-mist uppercase">
        <Target aria-hidden="true" class="size-4 shrink-0 text-accent" />
        Current focus
      </h3>
      <ul class="grid gap-2">
        <li v-for="focus in placeholderCurrentFocus" :key="focus" class="flex items-center gap-2 text-ui">
          <CircleCheck aria-hidden="true" class="size-4 shrink-0 text-feedback-success" />
          {{ focus }}
        </li>
      </ul>
    </section>

    <section aria-labelledby="recent-heading" class="grid gap-3 rounded-default border border-border-subtle bg-surface p-4">
      <h3 id="recent-heading" class="flex items-center gap-2 font-label text-label tracking-[0.1em] text-neutral-mist uppercase">
        <MessageCircle aria-hidden="true" class="size-4 shrink-0 text-accent" />
        Recently discussed
      </h3>
      <ul class="grid gap-1.5 pl-5 text-ui text-text-muted">
        <li v-for="topic in placeholderRecentTopics" :key="topic" class="list-disc">{{ topic }}</li>
      </ul>
    </section>

    <section aria-labelledby="skill-heading" class="grid gap-4 rounded-default border border-border-subtle bg-surface p-4">
      <h3 id="skill-heading" class="flex items-center gap-2 font-label text-label tracking-[0.1em] text-neutral-mist uppercase">
        <ChartNoAxesColumn aria-hidden="true" class="size-4 shrink-0 text-accent" />
        Skill progress
      </h3>

      <div class="flex items-center gap-4">
        <div class="relative size-24 shrink-0">
          <svg viewBox="0 0 100 100" class="size-full -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-neutral-pewter)" stroke-width="7" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--color-accent)"
              stroke-linecap="round"
              stroke-width="7"
              :stroke-dasharray="RING_CIRCUMFERENCE"
              :stroke-dashoffset="ringOffset"
            />
          </svg>
          <p class="absolute inset-0 grid place-items-center font-heading text-heading-lg leading-none text-text">
            {{ placeholderProgress.skillPercent }}%
          </p>
        </div>

        <div class="min-w-0 grid gap-1">
          <p class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">Toward</p>
          <p class="font-heading text-label leading-tight tracking-[0.04em] text-text uppercase">
            {{ placeholderProgress.skillTarget }}
          </p>
          <p class="text-small text-text-muted">{{ placeholderProgress.skillNote }}</p>
        </div>
      </div>
    </section>

    <section aria-labelledby="next-lesson-heading" class="grid gap-3 rounded-default border border-border-subtle bg-surface p-4">
      <h3 id="next-lesson-heading" class="flex items-center gap-2 font-label text-label tracking-[0.1em] text-neutral-mist uppercase">
        <BookOpen aria-hidden="true" class="size-4 shrink-0 text-accent" />
        Next lesson
      </h3>
      <p class="text-body leading-snug text-text">Fire management in a kamado</p>
      <Button variant="outline" class="w-full">Continue lesson</Button>
    </section>

    <section
      aria-label="Current streak"
      class="flex flex-wrap items-center justify-between gap-3 rounded-default border border-border-subtle bg-surface p-4"
    >
      <p class="flex items-center gap-2">
        <Flame aria-hidden="true" class="size-5 shrink-0 fill-accent stroke-accent" />
        <span class="grid">
          <span class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">Current streak</span>
          <span class="font-heading text-heading-lg leading-none text-text">{{ placeholderProgress.streakDays }} days</span>
        </span>
      </p>
      <ul class="flex items-end gap-1.5">
        <li v-for="(lit, index) in placeholderProgress.streakWeek" :key="index" class="grid justify-items-center gap-1">
          <span class="font-label text-caption text-neutral-mist">{{ weekdayInitials[index] }}</span>
          <span class="size-2 rounded-pill" :class="lit ? 'bg-accent' : 'bg-neutral-pewter'" />
        </li>
      </ul>
    </section>
  </div>
</template>
