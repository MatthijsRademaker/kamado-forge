<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useElementVisibility, useMediaQuery } from "@vueuse/core";
import { Check, ChevronDown, ChevronRight, CornerUpLeft } from "lucide-vue-next";
import type { CookingSession } from "@/api/generated/types.gen";
import { formatClock, formatDrift, formatDuration, formatOffset, formatPlannedMinutes } from "./format";
import _LiveEntryNotes from "./LiveEntryNotes.vue";
import _LiveNowEntry from "./LiveNowEntry.vue";
import type { LiveTimeline } from "./timeline";

// Template-only helpers are aliased so the linter sees them used; the template
// is not part of biome's dataflow.
const _formatClock = formatClock;
const _formatDrift = formatDrift;
const _formatDuration = formatDuration;
const _formatOffset = formatOffset;
const _formatPlannedMinutes = formatPlannedMinutes;

const props = defineProps<{ plan: CookingSession; timeline: LiveTimeline; live: boolean }>();
const emit = defineEmits<{ "update:nowVisible": [boolean] }>();

const nowElement = ref<HTMLElement | null>(null);
const nowVisible = useElementVisibility(nowElement);
const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
const guidanceOverride = ref<boolean | null>(null);

// Expanded until the first visit finishes, then collapsed, unless the cook has
// taken the decision over by using the disclosure.
const guidanceDefault = computed(() => {
  const entry = props.timeline.entries.find(({ kind }) => kind === "plan-guidance");
  return entry?.kind === "plan-guidance" ? entry.expanded : false;
});
const _guidanceOpen = computed(() => guidanceOverride.value ?? guidanceDefault.value);

function _setNowElement(element: unknown): void {
  nowElement.value = element instanceof HTMLElement ? element : null;
}

function _toggleGuidance(): void {
  guidanceOverride.value = !_guidanceOpen.value;
}

function scrollToNow(behavior: ScrollBehavior): void {
  nowElement.value?.scrollIntoView({ behavior, block: "start" });
}

onMounted(async () => {
  await nextTick();
  scrollToNow("auto");
});

// The now-line moves only when the server confirms an advance or a return, so
// the animated reposition is keyed on the confirmed visit rather than on intent.
watch(
  () => props.timeline.now.visitId,
  async (visitId, previousVisitId) => {
    if (!previousVisitId || visitId === previousVisitId) return;
    await nextTick();
    scrollToNow(reducedMotion.value ? "auto" : "smooth");
  },
);

watch(nowVisible, (visible) => emit("update:nowVisible", visible));

defineOptions({
  components: {
    Check,
    ChevronDown,
    ChevronRight,
    CornerUpLeft,
    LiveEntryNotes: _LiveEntryNotes,
    LiveNowEntry: _LiveNowEntry,
  },
});
</script>

<template>
  <ol data-testid="live-timeline" class="grid min-w-0 [overflow-anchor:none]">
    <li
      v-for="entry in timeline.entries"
      :key="entry.key"
      class="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 lg:grid-cols-[6.5rem_1.25rem_minmax(0,1fr)]"
      :class="entry.kind === 'now' ? 'scroll-mt-[4.5rem] lg:scroll-mt-24' : ''"
      :ref="entry.kind === 'now' ? _setNowElement : undefined"
      :data-entry="entry.kind"
      :data-visit-id="entry.kind === 'visit' || entry.kind === 'now' ? entry.visitId : undefined"
      :data-step-id="entry.kind === 'visit' || entry.kind === 'now' || entry.kind === 'future-step' ? entry.stepId : entry.kind === 'return-marker' ? entry.toStepId : undefined"
      :data-phase-id="entry.kind === 'phase-divider' ? entry.phaseId : undefined"
    >
      <!-- The plan/actual gutter is the wide-viewport column; at narrow widths it
           collapses and every entry restates the same values inline. -->
      <template v-if="entry.kind === 'visit' || entry.kind === 'now' || entry.kind === 'future-step'">
        <div data-testid="entry-gutter" class="hidden text-right lg:grid lg:content-start lg:gap-0.5 lg:pt-1.5">
          <p class="font-label text-caption tracking-[0.1em] text-text-muted uppercase">+{{ _formatOffset(entry.offsetMinutes) }}</p>
          <p v-if="entry.kind === 'future-step'" class="text-caption text-text-muted">~{{ _formatClock(entry.projectedStartAtMs) }}</p>
          <p v-else class="text-caption text-text-muted">{{ _formatClock(entry.actualStartedAt) }}</p>
        </div>
      </template>
      <div v-else class="hidden lg:block"></div>

      <div class="relative flex justify-center">
        <span
          aria-hidden="true"
          class="absolute inset-y-0"
          :class="entry.kind === 'now' ? 'w-[3px] bg-accent' : entry.kind === 'future-step' || entry.kind === 'closing' ? 'w-px border-l border-border-subtle border-dashed' : 'w-px bg-border-subtle'"
        ></span>
        <span
          v-if="entry.kind === 'visit'"
          aria-hidden="true"
          class="relative mt-1 grid size-5 place-items-center rounded-pill border border-feedback-success/70 bg-core text-feedback-success"
        >
          <Check class="size-3.5" />
        </span>
        <span
          v-else-if="entry.kind === 'now'"
          aria-hidden="true"
          class="relative mt-4 size-3.5 rounded-pill border-2 border-accent bg-accent"
        ></span>
        <span
          v-else-if="entry.kind === 'future-step'"
          aria-hidden="true"
          class="relative mt-2 size-2.5 rounded-pill border border-dashed border-border bg-core"
        ></span>
        <span
          v-else-if="entry.kind === 'return-marker'"
          aria-hidden="true"
          class="relative mt-1 grid size-5 place-items-center rounded-pill border border-border bg-core"
        ><CornerUpLeft class="size-3" /></span>
        <span
          v-else-if="entry.kind === 'closing'"
          aria-hidden="true"
          class="relative mt-2 h-px w-3 bg-border-subtle"
        ></span>
      </div>

      <div class="min-w-0 pb-6">
        <section v-if="entry.kind === 'plan-guidance'" aria-labelledby="plan-guidance-heading" class="rounded-default border border-border-subtle bg-surface">
          <button
            type="button"
            class="flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left"
            :aria-expanded="_guidanceOpen"
            aria-controls="plan-guidance-detail"
            @click="_toggleGuidance"
          >
            <span class="grid gap-0.5">
              <span id="plan-guidance-heading" class="font-label text-label tracking-[0.08em] uppercase">Before you light</span>
              <span class="text-caption text-text-muted">Setup, vent, deflector, and heat-zone guidance for this cook</span>
            </span>
            <ChevronDown v-if="_guidanceOpen" aria-hidden="true" class="size-4 shrink-0 text-accent" />
            <ChevronRight v-else aria-hidden="true" class="size-4 shrink-0 text-accent" />
          </button>
          <dl v-show="_guidanceOpen" id="plan-guidance-detail" class="grid gap-3 border-t border-border-subtle px-4 py-3 sm:grid-cols-2">
            <div><dt class="font-label text-label text-accent uppercase">Kamado setup</dt><dd class="mt-1 text-ui text-text-muted">{{ entry.setupGuidance }}</dd></div>
            <div><dt class="font-label text-label text-accent uppercase">Vent guidance</dt><dd class="mt-1 text-ui text-text-muted">{{ entry.ventGuidance }}</dd></div>
            <div><dt class="font-label text-label text-accent uppercase">Deflector</dt><dd class="mt-1 text-ui text-text-muted">{{ entry.deflectorGuidance }}</dd></div>
            <div><dt class="font-label text-label text-accent uppercase">Heat zone</dt><dd class="mt-1 text-ui text-text-muted">{{ entry.heatZoneGuidance }}</dd></div>
          </dl>
        </section>

        <div v-else-if="entry.kind === 'phase-divider'" class="grid gap-1 border-t border-border pt-3">
          <p class="font-label text-caption tracking-[0.18em] text-accent uppercase">Phase {{ entry.position }} · {{ entry.title }} · {{ entry.technique }}</p>
          <p class="text-small text-text-muted">Leave when: {{ entry.transitionGuidance }}</p>
        </div>

        <div v-else-if="entry.kind === 'visit'" class="grid gap-1">
          <p class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span class="flex items-center gap-1 font-label text-caption tracking-[0.14em] text-feedback-success uppercase">
              <Check aria-hidden="true" class="size-3.5" /> Done
            </span>
            <span class="font-heading text-heading-lg text-text-muted uppercase line-through decoration-neutral-steel decoration-2">{{ entry.title }}</span>
            <span v-if="entry.attemptTotal > 1" class="border border-border px-1.5 text-caption text-text-muted uppercase">Attempt {{ entry.attempt }} of {{ entry.attemptTotal }}</span>
          </p>
          <p class="text-small text-text-muted">
            <span class="lg:hidden">started {{ _formatClock(entry.actualStartedAt) }} · </span>ran {{ _formatDuration(entry.actualSeconds) }} of {{ _formatPlannedMinutes(entry.plannedDurationMinutes) }} planned · {{ _formatDrift(entry.driftSeconds) }}
          </p>
          <LiveEntryNotes :notes="entry.notes" />
        </div>

        <p v-else-if="entry.kind === 'return-marker'" class="text-small text-text-muted">
          <span class="font-label text-caption tracking-[0.14em] text-feedback-warning uppercase">Returned</span>
          — left “{{ entry.fromStepTitle }}” and went back to “{{ entry.toStepTitle }}”
        </p>

        <template v-else-if="entry.kind === 'now'">
          <LiveNowEntry :entry="entry" :plan="plan" :live="live" />
          <LiveEntryNotes :notes="entry.notes" />
        </template>

        <div v-else-if="entry.kind === 'future-step'" class="grid gap-1 opacity-70">
          <p class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span class="font-label text-caption tracking-[0.14em] text-text-muted uppercase">Planned</span>
            <span class="font-heading text-heading-lg text-text-muted uppercase">{{ entry.title }}</span>
          </p>
          <p class="text-small text-text-muted">
            <span class="lg:hidden">~{{ _formatClock(entry.projectedStartAtMs) }} · </span>{{ _formatPlannedMinutes(entry.plannedDurationMinutes) }} planned
          </p>
          <p class="text-small text-text-muted">{{ entry.instructions }}</p>
        </div>

        <div v-else class="grid gap-1">
          <p class="font-label text-caption tracking-[0.14em] text-text-muted uppercase">{{ entry.terminal ? 'Cook closed' : 'Projected finish' }}</p>
          <p v-if="entry.terminal" class="text-ui">{{ entry.status.toLowerCase() }} cooking session · read-only durable detail</p>
          <p v-else-if="entry.projectedFinishAtMs !== null" class="font-heading text-heading-lg uppercase">~{{ _formatClock(entry.projectedFinishAtMs) }} <span class="font-label text-caption text-text-muted normal-case">approximate · ignores drift so far</span></p>
          <p class="text-small text-text-muted">
            <span v-if="entry.terminal && entry.finishedAt">closed {{ _formatClock(entry.finishedAt) }} · </span>{{ _formatDuration(entry.actualTotalSeconds) }} run against {{ _formatPlannedMinutes(entry.plannedTotalMinutes) }} planned
          </p>
        </div>
      </div>
    </li>
  </ol>
</template>
