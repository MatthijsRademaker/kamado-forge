<script setup lang="ts">
import { computed } from "vue";
import { ArrowRight } from "lucide-vue-next";
import type { CookingSession, LiveCookSession } from "@/api/generated/types.gen";
import { Button as _Button } from "@/components/ui/button";
import { formatDuration, formatPlannedMinutes } from "./format";
import type { NowEntry } from "./timeline";

const props = defineProps<{
  session: LiveCookSession;
  plan: CookingSession;
  entry: NowEntry;
  actionPending: boolean;
  advancing: boolean;
}>();
const emit = defineEmits<{ action: ["advance"] }>();

const _elapsedLabel = computed(() => formatDuration(props.entry.elapsedSeconds));
const _plannedLabel = computed(() => formatPlannedMinutes(props.entry.plannedDurationMinutes));

function _advance(): void {
  emit("action", "advance");
}

defineOptions({
  components: {
    ArrowRight,
    Button: _Button,
  },
});
</script>

<template>
  <!-- Pinned only while the now region is out of view. It is deliberately not a
       live region: the now region already announces elapsed time. -->
  <section
    data-testid="live-now-bar"
    aria-label="Current cook context"
    class="fixed inset-x-0 top-16 z-20 border-b border-accent/50 bg-neutral-obsidian/95 backdrop-blur lg:top-20 lg:left-72"
  >
    <div class="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-2 sm:px-8 lg:px-12">
      <div class="grid min-w-0 flex-1 gap-0.5">
        <p class="flex min-w-0 flex-wrap items-baseline gap-x-2 font-label text-caption tracking-[0.12em] uppercase">
          <span :class="session.status === 'ACTIVE' ? 'text-feedback-success' : 'text-feedback-warning'">{{ session.status }}</span>
          <span class="text-text-muted">step {{ entry.stepPosition }} of {{ entry.totalSteps }}</span>
          <span class="text-text">{{ _elapsedLabel }} / {{ _plannedLabel }}</span>
        </p>
        <p data-testid="now-bar-targets" class="min-w-0 truncate text-caption text-text-muted">
          Planned dome {{ plan.plannedDomeRange.minF }}–{{ plan.plannedDomeRange.maxF }}°F · planned food {{ plan.plannedFoodTargetF ?? '—' }}°F
        </p>
      </div>
      <Button size="lg" class="min-h-11 shrink-0" :aria-busy="advancing" :disabled="actionPending || !session.nextStep" @click="_advance">{{ advancing ? 'Advancing…' : 'Advance' }} <ArrowRight aria-hidden="true" /></Button>
    </div>
  </section>
</template>
