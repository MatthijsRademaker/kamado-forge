<script lang="ts">
import { Flame, Gauge, Send } from "lucide-vue-next";
import { defineComponent, ref } from "vue";
import EmptyState from "@/components/EmptyState.vue";
import ErrorState from "@/components/ErrorState.vue";
import LoadingState from "@/components/LoadingState.vue";
import StatusIndicator from "@/components/StatusIndicator.vue";
import TemperatureDisplay from "@/components/TemperatureDisplay.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default defineComponent({
  components: {
    Flame,
    Gauge,
    Send,
    EmptyState,
    ErrorState,
    LoadingState,
    StatusIndicator,
    TemperatureDisplay,
    Badge,
    Button,
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    Input,
    Progress,
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Textarea,
  },
  setup() {
    const activeTab = ref("embers");
    const dialogOpen = ref(false);
    const sheetOpen = ref(false);
    const sheetSide = ref<"top" | "right" | "bottom" | "left">("right");
    const note = ref("");
    const pitName = ref("");
    const effectControlActivated = ref(false);

    return {
      activeTab,
      dialogOpen,
      sheetOpen,
      sheetSide,
      note,
      pitName,
      effectControlActivated,
    };
  },
});
</script>

<template>
  <main class="min-h-screen overflow-x-clip bg-core text-text">
    <header class="border-b border-border-subtle bg-[linear-gradient(120deg,var(--color-core)_25%,var(--color-surface)_65%,var(--color-core)_100%)]">
      <div class="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-8 lg:py-20">
        <div class="min-w-0">
          <p class="mb-4 flex items-center gap-2 font-label text-label uppercase tracking-widest text-accent">
            <span data-atmosphere="high" class="atmosphere-effects size-2 rounded-pill bg-accent" aria-hidden="true"></span>
            Kamado Forge / Primitive Bench
          </p>
          <h1 class="display-distress max-w-4xl font-display text-[clamp(3.5rem,12vw,8rem)] leading-none tracking-tight text-text">
            HEAT WITH INTENT
          </h1>
          <p class="mt-6 max-w-2xl text-body text-text-muted">
            A responsive local reference for the charcoal-and-ember control language. These are reusable parts, not a product flow.
          </p>
        </div>
        <div class="grid min-w-0 gap-3 rounded-default border border-border bg-surface p-4 shadow-elevated sm:grid-cols-2 lg:w-80 lg:grid-cols-1">
          <div>
            <p class="font-label text-small uppercase text-text-muted">Surface</p>
            <p class="font-heading text-heading-lg uppercase text-text">Charcoal / ember</p>
          </div>
          <div>
            <p class="font-label text-small uppercase text-text-muted">Interaction</p>
            <p class="font-heading text-heading-lg uppercase text-text">Keyboard ready</p>
          </div>
        </div>
      </div>
    </header>

    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:gap-14 lg:px-8 lg:py-16">
      <section class="grid gap-6" aria-labelledby="actions-heading">
        <div class="flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <p class="font-label text-small uppercase text-accent">01 / actions</p>
            <h2 id="actions-heading" class="font-heading text-heading-xl uppercase text-text">Button variants</h2>
          </div>
          <p class="max-w-md text-ui text-text-muted">Every action stays legible against the forge surface, including disabled and icon-only controls.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <Button variant="default"><Flame /> Ignite</Button>
          <Button variant="destructive">Abort</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link" as="a" href="#forms">Jump to field</Button>
          <Button size="icon" variant="default" aria-label="Open heat reference"><Gauge /></Button>
          <Button disabled>Disabled</Button>
        </div>
        <div class="flex flex-wrap items-center gap-3" aria-label="Button size variants">
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon-xs" aria-label="Extra-small icon button"><Gauge /></Button>
          <Button size="icon-sm" aria-label="Small icon button"><Gauge /></Button>
          <Button size="icon-lg" aria-label="Large icon button"><Gauge /></Button>
        </div>
      </section>

      <section class="grid gap-6" aria-labelledby="surfaces-heading">
        <div class="border-b border-border-subtle pb-4">
          <p class="font-label text-small uppercase text-accent">02 / surfaces</p>
          <h2 id="surfaces-heading" class="font-heading text-heading-xl uppercase text-text">Card and badge</h2>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Material sample</CardTitle>
                <CardDescription>Slots preserve hierarchy while callers supply their own meaning.</CardDescription>
              </div>
              <CardAction><Badge variant="outline">Local sample</Badge></CardAction>
            </CardHeader>
            <CardContent>
              <p class="text-ui text-text-muted">A composed surface with title, description, content, and footer boundaries.</p>
            </CardContent>
            <CardFooter class="justify-between">
              <Badge variant="default">Default</Badge>
              <Button variant="ghost" size="sm">Inspect</Button>
            </CardFooter>
          </Card>
          <div class="grid content-start gap-3 rounded-default border border-border-subtle bg-surface p-6 shadow-inset">
            <p class="font-label text-label uppercase text-text">Badge variants</p>
            <div class="flex flex-wrap gap-3">
              <Badge variant="default">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Danger</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Surface depth recipes">
          <div class="min-h-40 rounded-default border border-border-subtle bg-surface p-5 shadow-elevated">
            <p class="font-label text-label uppercase text-text">Surface</p>
            <p class="mt-2 text-small text-text-muted">Border · roomy radius · elevated shadow</p>
          </div>
          <div class="surface-elevated min-h-40 rounded-default border border-border-subtle p-5">
            <p class="font-label text-label uppercase text-text">Elevated</p>
            <p class="mt-2 text-small text-text-muted">Raised surface · inset highlight</p>
          </div>
          <div class="surface-inset min-h-40 rounded-default border border-border-subtle p-5">
            <p class="font-label text-label uppercase text-text">Inset</p>
            <p class="mt-2 text-small text-text-muted">Recessed gradient · inset shadow</p>
          </div>
          <div class="surface-outline min-h-40 rounded-default p-5">
            <p class="font-label text-label uppercase text-text">Outline</p>
            <p class="mt-2 text-small text-text-muted">Outlined depth · top-edge highlight</p>
          </div>
          <div class="surface-glass min-h-40 rounded-default border border-border-subtle p-5">
            <p class="font-label text-label uppercase text-text">Glass</p>
            <p class="mt-2 text-small text-text-muted">Translucent ash · isolated backdrop blur</p>
          </div>
        </div>
      </section>

      <section class="grid gap-6" aria-labelledby="atmosphere-heading">
        <div class="flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <p class="font-label text-small uppercase text-accent">03 / atmosphere</p>
            <h2 id="atmosphere-heading" class="font-heading text-heading-xl uppercase text-text">Mood by reading context</h2>
          </div>
          <p class="max-w-md text-ui text-text-muted">Intensity inherits from container policy. Components never choose literal grain or glow values.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article data-atmosphere="flat" class="min-h-52 rounded-default border border-border-subtle bg-surface p-5">
            <p class="font-label text-small uppercase text-accent">Flat</p>
            <h3 class="mt-3 font-heading text-heading-lg uppercase text-text">Uninterrupted signal</h3>
            <p class="mt-2 text-ui text-text-muted">Admitted layers: none</p>
          </article>
          <article data-atmosphere="low" class="surface-elevated min-h-52 rounded-default border border-border-subtle p-5">
            <p class="font-label text-small uppercase text-accent">Low</p>
            <h3 class="mt-3 font-heading text-heading-lg uppercase text-text">Working depth</h3>
            <p class="mt-2 text-ui text-text-muted">Top-edge highlight + vertical gradient</p>
          </article>
          <article data-atmosphere="mid" tabindex="0" aria-label="Mid atmosphere specimen" class="surface-elevated atmosphere-effects min-h-52 rounded-default border border-border-subtle p-5">
            <div class="atmosphere-content" data-testid="atmosphere-mid-inherited">
              <p class="font-label text-small uppercase text-accent">Mid</p>
              <h3 class="mt-3 font-heading text-heading-lg uppercase text-text">Charcoal texture</h3>
              <p class="mt-2 text-ui text-text-muted">Top-edge highlight + vertical gradient + grain</p>
            </div>
          </article>
          <article data-atmosphere="high" tabindex="0" aria-label="High atmosphere specimen" class="surface-elevated atmosphere-effects min-h-52 rounded-default border border-border-subtle p-5">
            <div class="atmosphere-content grid gap-3">
              <div>
                <p class="font-label text-small uppercase text-accent">High</p>
                <h3 class="mt-3 font-heading text-heading-lg uppercase text-text">Ember bloom</h3>
                <p class="mt-2 text-ui text-text-muted">Top-edge highlight + vertical gradient</p>
                <p class="text-ui text-text-muted">Grain + ember glow</p>
              </div>
              <Button size="sm" variant="outline" @click="effectControlActivated = true">
                {{ effectControlActivated ? "Interaction received" : "Test effect control" }}
              </Button>
            </div>
          </article>
        </div>
        <div class="grid gap-4 lg:grid-cols-2" aria-label="Effect content stacking comparison">
          <article data-atmosphere="high" tabindex="0" aria-label="Incorrect effect stacking specimen" class="surface-elevated atmosphere-effects min-h-44 rounded-default border border-feedback-danger p-5">
            <div>
              <p class="font-label text-small uppercase text-feedback-danger">Incorrect — content beneath effect layer</p>
              <p class="mt-3 text-ui text-text-muted">Missing atmosphere-content allows texture to composite over copy.</p>
            </div>
          </article>
          <article data-atmosphere="high" tabindex="0" aria-label="Correct effect stacking specimen" class="surface-elevated atmosphere-effects min-h-44 rounded-default border border-feedback-success p-5">
            <div class="atmosphere-content">
              <p class="font-label text-small uppercase text-feedback-success">Correct — content above effect layer</p>
              <p class="mt-3 text-ui text-text-muted">Explicit content stacking preserves untouched text rendering.</p>
            </div>
          </article>
        </div>
      </section>

      <section id="forms" class="grid gap-6" aria-labelledby="forms-heading">
        <div class="border-b border-border-subtle pb-4">
          <p class="font-label text-small uppercase text-accent">04 / fields</p>
          <h2 id="forms-heading" class="font-heading text-heading-xl uppercase text-text">Native form semantics</h2>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="grid gap-2 rounded-default border border-border-subtle bg-surface p-5">
            <label class="font-label text-label uppercase text-text" for="showcase-pit-name">Reference label</label>
            <Input id="showcase-pit-name" v-model="pitName" aria-describedby="showcase-pit-name-help" placeholder="Name this sample" />
            <p id="showcase-pit-name-help" class="text-small text-text-muted">A label and description are supplied by the caller.</p>
          </div>
          <div class="grid gap-2 rounded-default border border-border-subtle bg-surface p-5">
            <label class="font-label text-label uppercase text-text" for="showcase-note">Invalid-state example</label>
            <Textarea id="showcase-note" v-model="note" aria-describedby="showcase-note-help" aria-invalid="true" placeholder="Leave an illustrative note" />
            <p id="showcase-note-help" class="text-small text-feedback-danger">This sample demonstrates an invalid field relationship.</p>
          </div>
        </div>
      </section>

      <section class="grid gap-6" aria-labelledby="feedback-heading">
        <div class="border-b border-border-subtle pb-4">
          <p class="font-label text-small uppercase text-accent">04 / feedback</p>
          <h2 id="feedback-heading" class="font-heading text-heading-xl uppercase text-text">Progress and states</h2>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="grid content-start gap-4 rounded-default border border-border-subtle bg-surface p-5">
            <div class="flex items-baseline justify-between gap-4">
              <label class="font-label text-label uppercase text-text" for="showcase-progress">Determinate progress</label>
              <span class="text-ui text-text-muted">68%</span>
            </div>
            <Progress id="showcase-progress" :max="100" :model-value="68" aria-label="Illustrative determinate progress" />
            <div class="flex items-baseline justify-between gap-4">
              <label class="font-label text-label uppercase text-text" for="showcase-bounded-progress">Configured maximum</label>
              <span class="text-ui text-text-muted">75 / 200</span>
            </div>
            <Progress id="showcase-bounded-progress" :max="200" :model-value="75" aria-label="Illustrative bounded progress" />
            <div class="flex items-baseline justify-between gap-4">
              <label class="font-label text-label uppercase text-text" for="showcase-indeterminate">Indeterminate progress</label>
              <span class="text-ui text-text-muted">Awaiting</span>
            </div>
            <Progress id="showcase-indeterminate" :model-value="null" aria-label="Illustrative indeterminate progress" />
          </div>
          <Tabs v-model="activeTab" class="rounded-default border border-border-subtle bg-surface p-5">
            <TabsList aria-label="Illustrative fuel modes" class="w-full">
              <TabsTrigger value="embers">Embers</TabsTrigger>
              <TabsTrigger value="smoke">Smoke</TabsTrigger>
              <TabsTrigger value="rest">Rest</TabsTrigger>
            </TabsList>
            <TabsContent value="embers" class="rounded-default border border-border-subtle bg-core p-4 text-ui text-text-muted">
              Steady heat with a clear active panel.
            </TabsContent>
            <TabsContent value="smoke" class="rounded-default border border-border-subtle bg-core p-4 text-ui text-text-muted">
              A second keyboard-selectable panel.
            </TabsContent>
            <TabsContent value="rest" class="rounded-default border border-border-subtle bg-core p-4 text-ui text-text-muted">
              The third panel preserves roving tab behavior.
            </TabsContent>
          </Tabs>
        </div>
        <div class="grid gap-4 xl:grid-cols-3">
          <EmptyState title="No sample queued" description="Caller content and actions fill this reusable empty state.">
            <template #action><Button variant="outline" size="sm">Add sample</Button></template>
          </EmptyState>
          <LoadingState label="Preparing surface" description="An accessible indeterminate state announces work in progress.">
            <template #action><Button variant="ghost" size="sm">Keep browsing</Button></template>
          </LoadingState>
          <ErrorState title="Sample unavailable" description="Error copy and recovery action remain provided by the consuming view.">
            <template #action><Button variant="destructive" size="sm">Try again</Button></template>
          </ErrorState>
        </div>
      </section>

      <section class="grid gap-6" aria-labelledby="readouts-heading">
        <div class="flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <p class="font-label text-small uppercase text-accent">05 / readouts</p>
            <h2 id="readouts-heading" class="font-heading text-heading-xl uppercase text-text">Temperature and status</h2>
          </div>
          <div class="flex flex-wrap gap-2">
            <StatusIndicator label="Ready" value="stable" status="success" />
            <StatusIndicator label="Watch" value="rising" status="warning" />
            <StatusIndicator label="Hold" value="paused" status="info" />
            <StatusIndicator label="Alert" value="high" status="danger" />
            <StatusIndicator label="Idle" value="standing by" status="neutral" />
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <TemperatureDisplay label="Illustrative grate reading" :value="425" unit="°F" :min="200" :max="700" />
          <TemperatureDisplay label="Illustrative dome reading" unit="°C" :min="50" :max="400" />
        </div>
      </section>

      <section class="grid gap-6" aria-labelledby="overlays-heading">
        <div class="border-b border-border-subtle pb-4">
          <p class="font-label text-small uppercase text-accent">06 / overlays</p>
          <h2 id="overlays-heading" class="font-heading text-heading-xl uppercase text-text">Dialog and sheet</h2>
        </div>
        <div class="flex flex-wrap gap-3">
          <Dialog v-model:open="dialogOpen">
            <DialogTrigger as-child><Button variant="outline">Open named dialog</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Illustrative dialog</DialogTitle>
                <DialogDescription>This named overlay traps focus, closes with Escape, and returns focus to its trigger.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose as-child><Button variant="secondary">Close dialog</Button></DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Sheet v-model:open="sheetOpen">
            <SheetTrigger as-child><Button variant="outline" @click="sheetSide = 'top'">Open top sheet</Button></SheetTrigger>
            <SheetTrigger as-child><Button variant="outline" @click="sheetSide = 'right'">Open right sheet</Button></SheetTrigger>
            <SheetTrigger as-child><Button variant="outline" @click="sheetSide = 'bottom'">Open bottom sheet</Button></SheetTrigger>
            <SheetTrigger as-child><Button variant="outline" @click="sheetSide = 'left'">Open left sheet</Button></SheetTrigger>
            <SheetContent :side="sheetSide">
              <SheetHeader>
                <SheetTitle>Illustrative sheet</SheetTitle>
                <SheetDescription>This uses the same Reka focus contract in a side-mounted surface.</SheetDescription>
              </SheetHeader>
              <SheetFooter>
                <SheetClose as-child><Button variant="secondary"><Send /> Close sheet</Button></SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </section>
    </div>
  </main>
</template>
