<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, Flame, Pause, Play, X } from "lucide-vue-next";
import { ref } from "vue";
import { useRouter } from "vue-router";
import EmptyState from "@/components/EmptyState.vue";
import StatusIndicator from "@/components/StatusIndicator.vue";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useSessionFlow } from "@/features/session/context";

defineOptions({
  components: {
    ArrowLeft,
    ArrowRight,
    Button,
    Check,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    EmptyState,
    Flame,
    Pause,
    Play,
    Progress,
    StatusIndicator,
    Textarea,
    X,
  },
});

const flow = useSessionFlow();
const router = useRouter();
const finishOpen = ref(false);
const cancelOpen = ref(false);

function _formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

async function _finishCook(): Promise<void> {
  flow.finish();
  finishOpen.value = false;
  await router.push({ name: "today", query: { fixture: "no-session" } });
}

async function _cancelCook(): Promise<void> {
  flow.cancel();
  cancelOpen.value = false;
  await router.push({ name: "today", query: { fixture: "no-session" } });
}
</script>

<template>
  <EmptyState
    v-if="flow.state.kind !== 'active' || !flow.state.plan || !flow.currentStep.value"
    title="No active cook"
    description="Choose an active fixture or start a draft from Today."
  >
    <template #action>
      <Button as-child class="min-h-11"><RouterLink :to="{ name: 'today' }">Return to Today</RouterLink></Button>
    </template>
  </EmptyState>

  <article v-else class="live-page -mx-4 -mt-6 grid min-w-0 gap-0 sm:-mx-6 sm:-mt-8 lg:-mx-8 lg:-mt-12 xl:-mx-12">
    <section data-testid="live-glance" class="relative grid min-h-[27rem] content-start overflow-hidden border-b border-border-subtle bg-neutral-obsidian px-4 pt-5 pb-6 sm:px-8 lg:min-h-0 lg:px-12 lg:py-9">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgb(228_81_26_/_0.18),transparent_42%)]" aria-hidden="true"></div>
      <div class="relative mx-auto grid w-full max-w-6xl gap-4">
        <div class="flex items-center justify-between gap-3">
          <p class="flex items-center gap-2 font-label text-caption tracking-[0.18em] text-accent uppercase"><Flame aria-hidden="true" class="size-4 fill-current" /> Live cook</p>
          <StatusIndicator label="Session" :value="flow.state.running ? 'Running' : 'Paused'" :status="flow.state.running ? 'success' : 'warning'" />
        </div>

        <div class="grid gap-2">
          <p class="font-label text-caption tracking-[0.18em] text-neutral-mist uppercase">Current action · {{ flow.state.stepIndex + 1 }} of {{ flow.steps.value.length }}</p>
          <h1 class="font-display text-[2.45rem] leading-[0.95] tracking-[0.01em] uppercase sm:text-display-title">{{ flow.currentStep.value.title }}</h1>
          <p data-testid="current-action" class="max-w-3xl text-[0.9rem] leading-5 text-neutral-smoke sm:text-body">{{ flow.currentStep.value.instructions }}</p>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:max-w-xl sm:gap-3">
          <div data-testid="planned-dome-target" class="border-l-2 border-accent bg-surface/70 px-3 py-2.5">
            <p class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">Planned dome target</p>
            <p class="font-heading text-[2rem] leading-none text-text">{{ flow.state.plan.plannedDomeTarget.value }}<span class="ml-1 text-label text-accent">°F</span></p>
          </div>
          <div data-testid="planned-food-target" class="border-l-2 border-accent bg-surface/70 px-3 py-2.5">
            <p class="font-label text-caption tracking-[0.12em] text-neutral-mist uppercase">Planned food target</p>
            <p class="font-heading text-[2rem] leading-none text-text">{{ flow.state.plan.plannedFoodTarget.value }}<span class="ml-1 text-label text-accent">°F</span></p>
          </div>
        </div>
      </div>
    </section>

    <div class="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 sm:px-8 lg:grid-cols-[1.3fr_0.7fr] lg:px-12 lg:py-10">
      <div class="grid min-w-0 gap-5">
        <section class="grid gap-4 rounded-roomy border border-border-subtle bg-surface p-5 shadow-inset">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="font-label text-caption tracking-[0.16em] text-accent uppercase">Step timing</p>
              <h2 class="font-heading text-heading-xl uppercase">{{ _formatDuration(flow.elapsedSeconds.value) }} elapsed</h2>
            </div>
            <Button v-if="flow.state.running" size="lg" variant="outline" class="min-h-11" @click="flow.pause"><Pause aria-hidden="true" /> Pause</Button>
            <Button v-else size="lg" class="min-h-11" @click="flow.resume"><Play aria-hidden="true" /> Resume</Button>
          </div>
          <div class="grid gap-2">
            <div class="flex justify-between text-small text-text-muted"><span>Session progress</span><span>{{ flow.progressPercent.value }}% · {{ flow.currentStep.value.durationMinutes }} min planned</span></div>
            <Progress :model-value="flow.progressPercent.value" :max="100" aria-label="Session progress" class="h-3" />
          </div>
        </section>

        <section class="grid gap-4 rounded-roomy border border-border-subtle bg-surface p-5">
          <div class="grid gap-4 sm:grid-cols-2">
            <div><p class="font-label text-label text-accent uppercase">Kamado setup</p><p class="mt-1 text-ui text-text-muted">{{ flow.state.plan.setup }}</p></div>
            <div><p class="font-label text-label text-accent uppercase">Vent and fire guidance</p><p class="mt-1 text-ui text-text-muted">{{ flow.state.plan.ventFireGuidance }}</p></div>
          </div>
          <div class="border-t border-border-subtle pt-4">
            <p class="font-label text-caption tracking-[0.14em] text-text-muted uppercase">Next move</p>
            <p class="mt-1 font-heading text-heading-lg uppercase">{{ flow.nextStep.value?.title ?? 'Finish this cook when the food is ready' }}</p>
          </div>
        </section>

        <section class="grid gap-2 rounded-roomy border border-border-subtle bg-surface p-5">
          <label for="session-note" class="font-label text-label uppercase">Session note</label>
          <p id="session-note-help" class="text-small text-text-muted">Kept only for this mounted fixture session.</p>
          <Textarea id="session-note" :model-value="flow.state.note" aria-describedby="session-note-help" class="min-h-24" @update:model-value="flow.setNote(String($event))" />
        </section>
      </div>

      <aside class="grid content-start gap-5">
        <section class="grid gap-3 rounded-roomy border border-border-subtle bg-neutral-obsidian p-5">
          <p class="font-label text-caption tracking-[0.16em] text-text-muted uppercase">Move through the cook</p>
          <div class="grid grid-cols-2 gap-3">
            <Button variant="outline" size="lg" class="min-h-11" :disabled="!flow.canBack.value" @click="flow.back"><ArrowLeft aria-hidden="true" /> Back</Button>
            <Button size="lg" class="min-h-11" :disabled="!flow.canAdvance.value" @click="flow.advance">Advance <ArrowRight aria-hidden="true" /></Button>
          </div>
        </section>

        <section class="grid gap-3 rounded-roomy border border-border-subtle bg-surface p-5">
          <Dialog v-model:open="finishOpen">
            <DialogTrigger as-child><Button size="lg" class="min-h-11 w-full"><Check aria-hidden="true" /> Finish cook</Button></DialogTrigger>
            <DialogContent :show-close-button="false">
              <DialogHeader><DialogTitle>Finish cook?</DialogTitle><DialogDescription>This ends the mounted cook and returns Today to its no-session state.</DialogDescription></DialogHeader>
              <DialogFooter class="gap-2 sm:gap-0">
                <DialogClose as-child><Button variant="outline" class="min-h-11">Keep cooking</Button></DialogClose>
                <Button class="min-h-11" @click="_finishCook">Confirm finish</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog v-model:open="cancelOpen">
            <DialogTrigger as-child><Button variant="destructive" size="lg" class="min-h-11 w-full"><X aria-hidden="true" /> Cancel cook</Button></DialogTrigger>
            <DialogContent :show-close-button="false">
              <DialogHeader><DialogTitle>Cancel cook?</DialogTitle><DialogDescription>This discards the mounted session state and returns Today to no active cook.</DialogDescription></DialogHeader>
              <DialogFooter class="gap-2 sm:gap-0">
                <DialogClose as-child><Button variant="outline" class="min-h-11">Keep cooking</Button></DialogClose>
                <Button variant="destructive" class="min-h-11" @click="_cancelCook">Confirm cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      </aside>
    </div>
  </article>
</template>
