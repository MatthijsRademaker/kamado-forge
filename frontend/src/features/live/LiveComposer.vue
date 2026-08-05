<script setup lang="ts">
import { ref } from "vue";
import { ArrowLeft, ArrowRight, Check, MoreHorizontal, Pause, Play, X } from "lucide-vue-next";
import type { LiveCookSession } from "@/api/generated/types.gen";
import { Button as _Button } from "@/components/ui/button";
import {
  Dialog as _Dialog,
  DialogClose as _DialogClose,
  DialogContent as _DialogContent,
  DialogDescription as _DialogDescription,
  DialogFooter as _DialogFooter,
  DialogHeader as _DialogHeader,
  DialogTitle as _DialogTitle,
  DialogTrigger as _DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea as _Textarea } from "@/components/ui/textarea";

defineProps<{
  session: LiveCookSession;
  currentOrdinal: number;
  actionPending: boolean;
  advancing: boolean;
  actionError: string;
  note: string;
  noteError: string;
  noteSaving: boolean;
  finishing: boolean;
  cancelling: boolean;
  finishOpen: boolean;
  cancelOpen: boolean;
}>();
const emit = defineEmits<{
  action: ["pause" | "resume" | "return" | "advance"];
  save: [];
  finish: [];
  cancel: [];
  "update:note": [string];
  "update:finishOpen": [boolean];
  "update:cancelOpen": [boolean];
}>();

const _overflowOpen = ref(false);

function _setNote(value: string | number): void {
  emit("update:note", String(value));
}

function _runAction(action: "pause" | "resume" | "return" | "advance"): void {
  emit("action", action);
}

defineOptions({
  components: {
    ArrowLeft,
    ArrowRight,
    Button: _Button,
    Check,
    Dialog: _Dialog,
    DialogClose: _DialogClose,
    DialogContent: _DialogContent,
    DialogDescription: _DialogDescription,
    DialogFooter: _DialogFooter,
    DialogHeader: _DialogHeader,
    DialogTitle: _DialogTitle,
    DialogTrigger: _DialogTrigger,
    MoreHorizontal,
    Pause,
    Play,
    Textarea: _Textarea,
    X,
  },
});
</script>

<template>
  <section
    data-testid="live-composer"
    aria-label="Cook actions"
    class="fixed inset-x-0 bottom-0 z-30 border-t border-accent/60 bg-neutral-obsidian/95 backdrop-blur lg:left-72"
  >
    <div class="mx-auto grid w-full max-w-6xl gap-2 px-4 py-2 sm:px-8 lg:px-12">
      <p v-if="actionError" class="border border-feedback-danger px-3 py-2 text-small text-feedback-danger" role="alert">{{ actionError }}</p>
      <p v-if="noteError" class="text-small text-feedback-danger" role="alert">{{ noteError }}</p>

      <!-- The scroll to the new now-line cannot start until the server confirms
           the command, so the wait is reported on the control the cook is
           touching rather than on the now region: restating the loudest region
           on every step change costs more than it explains. -->
      <div class="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div class="flex min-w-0 items-start gap-2">
          <label for="session-note" class="sr-only">New step note</label>
          <Textarea
            id="session-note"
            :model-value="note"
            class="min-h-11 min-w-0 flex-1 resize-none py-2.5"
            placeholder="Note what the fire is doing…"
            :disabled="noteSaving"
            @update:model-value="_setNote"
          />
          <Button class="min-h-11 shrink-0" variant="outline" :disabled="noteSaving" @click="emit('save')">{{ noteSaving ? 'Saving…' : 'Save note' }}</Button>
        </div>

        <div class="flex min-w-0 items-center gap-2">
          <Button v-if="session.status === 'ACTIVE'" size="icon-lg" variant="outline" aria-label="Pause" class="size-11 shrink-0" :disabled="actionPending" @click="_runAction('pause')"><Pause aria-hidden="true" /></Button>
          <Button v-else size="icon-lg" aria-label="Resume" class="size-11 shrink-0" :disabled="actionPending" @click="_runAction('resume')"><Play aria-hidden="true" /></Button>
          <Button size="icon-lg" variant="outline" aria-label="Back" class="size-11 shrink-0" :disabled="actionPending || currentOrdinal <= 0" @click="_runAction('return')"><ArrowLeft aria-hidden="true" /></Button>
          <Button size="lg" class="min-h-11 flex-1 sm:min-w-40 sm:flex-none" :aria-busy="advancing" :disabled="actionPending || !session.nextStep" @click="_runAction('advance')">{{ advancing ? 'Advancing…' : 'Advance' }} <ArrowRight aria-hidden="true" /></Button>
          <Button
            size="icon-lg"
            variant="outline"
            class="size-11 shrink-0"
            aria-label="More cook actions"
            aria-controls="live-overflow-actions"
            :aria-expanded="_overflowOpen"
            @click="_overflowOpen = !_overflowOpen"
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div v-show="_overflowOpen" id="live-overflow-actions" class="grid gap-2 pb-1 sm:grid-cols-2">
        <Dialog :open="finishOpen" @update:open="emit('update:finishOpen', $event)">
          <DialogTrigger as-child><Button size="lg" class="min-h-11 w-full" :disabled="actionPending || Boolean(session.nextStep)"><Check aria-hidden="true" /> Finish cook</Button></DialogTrigger>
          <DialogContent :show-close-button="false">
            <DialogHeader><DialogTitle>Finish cook?</DialogTitle><DialogDescription>This records final progress and keeps this session available at its current URL.</DialogDescription></DialogHeader>
            <p v-if="actionError" class="rounded-default border border-feedback-danger p-3 text-feedback-danger" role="alert">{{ actionError }}</p>
            <DialogFooter class="gap-2 sm:gap-0"><DialogClose as-child><Button variant="outline" class="min-h-11">Keep cooking</Button></DialogClose><Button class="min-h-11" :disabled="finishing" @click="emit('finish')">Confirm finish</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog :open="cancelOpen" @update:open="emit('update:cancelOpen', $event)">
          <DialogTrigger as-child><Button variant="destructive" size="lg" class="min-h-11 w-full" :disabled="actionPending"><X aria-hidden="true" /> Cancel cook</Button></DialogTrigger>
          <DialogContent :show-close-button="false">
            <DialogHeader><DialogTitle>Cancel cook?</DialogTitle><DialogDescription>This records a durable cancelled terminal state.</DialogDescription></DialogHeader>
            <p v-if="actionError" class="rounded-default border border-feedback-danger p-3 text-feedback-danger" role="alert">{{ actionError }}</p>
            <DialogFooter class="gap-2 sm:gap-0"><DialogClose as-child><Button variant="outline" class="min-h-11">Keep cooking</Button></DialogClose><Button variant="destructive" class="min-h-11" :disabled="cancelling" @click="emit('cancel')">Confirm cancel</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </section>
</template>
