<script lang="ts">
import { computed, defineComponent, nextTick, type PropType, ref, watch } from "vue";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-vue-next";
import type { SessionPlan } from "@/api/generated/types.gen";
import StatusIndicator from "@/components/StatusIndicator.vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  addPhase,
  addStep,
  deriveTimeline,
  movePhase,
  moveStep,
  removePhase,
  removeStep,
  validateReadiness,
} from "./model";

export default defineComponent({
  components: {
    ArrowDown,
    ArrowUp,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    Plus,
    StatusIndicator,
    Textarea,
    Trash2,
  },
  props: {
    modelValue: { type: Object as PropType<SessionPlan>, required: true },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const draft = computed(() => props.modelValue);
    const readiness = computed(() => validateReadiness(draft.value));
    const timeline = computed(() => deriveTimeline(draft.value));
    const completed = ref(false);
    watch(
      () => props.modelValue,
      () => {
        completed.value = false;
      },
    );
    const errors = computed(() => new Map(readiness.value.errors.map((error) => [error.path, error.message])));
    const replaceDraft = (next: SessionPlan) => {
      completed.value = false;
      emit("update:modelValue", next);
    };
    const setText = (field: "title" | "date" | "setup" | "ventFireGuidance" | "prepNotes", value: string | number) => {
      replaceDraft({ ...draft.value, [field]: String(value) });
    };
    const setTarget = (field: "plannedDomeTarget" | "plannedFoodTarget", value: string | number) => {
      const parsed = value === "" ? null : Number(value);
      replaceDraft({ ...draft.value, [field]: { value: parsed, unit: "F" } });
    };
    const setPhaseText = (
      phaseIndex: number,
      field: "title" | "technique" | "transitionGuidance",
      value: string | number,
    ) => {
      replaceDraft({
        ...draft.value,
        phases: draft.value.phases.map((phase, index) =>
          index === phaseIndex ? { ...phase, [field]: String(value) } : phase,
        ),
      });
    };
    const setStepField = (
      phaseIndex: number,
      stepIndex: number,
      field: "title" | "durationMinutes" | "instructions",
      value: string | number,
    ) => {
      replaceDraft({
        ...draft.value,
        phases: draft.value.phases.map((phase, currentPhaseIndex) =>
          currentPhaseIndex === phaseIndex
            ? {
                ...phase,
                steps: phase.steps.map((step, currentStepIndex) =>
                  currentStepIndex === stepIndex
                    ? { ...step, [field]: field === "durationMinutes" ? Number(value) : String(value) }
                    : step,
                ),
              }
            : phase,
        ),
      });
    };
    const nextId = (prefix: "phase" | "step") => {
      const used = new Set([
        ...draft.value.phases.map(({ id }) => id),
        ...draft.value.phases.flatMap(({ steps }) => steps.map(({ id }) => id)),
      ]);
      let sequence = 1;
      while (used.has(`${prefix}-local-${sequence}`)) sequence += 1;
      return `${prefix}-local-${sequence}`;
    };
    const appendPhase = () => {
      const phaseId = nextId("phase");
      const stepId = nextId("step");
      replaceDraft(
        addPhase(draft.value, {
          id: phaseId,
          title: "",
          technique: "",
          transitionGuidance: "",
          steps: [{ id: stepId, title: "", durationMinutes: 15, instructions: "" }],
        }),
      );
    };
    const appendStep = (phaseId: string) => {
      replaceDraft(
        addStep(draft.value, phaseId, {
          id: nextId("step"),
          title: "",
          durationMinutes: 15,
          instructions: "",
        }),
      );
    };
    const errorFor = (path: string) => errors.value.get(path);
    const controlId = (path: string) => `plan-field-${path.replaceAll(".", "-")}`;
    const errorId = (path: string) => `${controlId(path)}-error`;
    const phaseTiming = (phaseId: string) => timeline.value.phases.find(({ id }) => id === phaseId);
    const completePlan = async () => {
      if (!readiness.value.ready) {
        const invalidPath = readiness.value.firstInvalidPath;
        if (invalidPath === null) throw new Error("Invalid Plan readiness result has no focus target");
        await nextTick();
        const invalidControl = document.getElementById(controlId(invalidPath));
        const disclosure = invalidControl?.closest("details");
        if (disclosure instanceof HTMLDetailsElement) disclosure.open = true;
        invalidControl?.focus();
        return;
      }
      completed.value = true;
    };

    return {
      appendPhase,
      appendStep,
      completePlan,
      completed,
      controlId,
      draft,
      errorFor,
      errorId,
      formatMinutes,
      movePhase: (phaseId: string, direction: "up" | "down") =>
        replaceDraft(movePhase(draft.value, phaseId, direction)),
      moveStep: (phaseId: string, stepId: string, direction: "up" | "down") =>
        replaceDraft(moveStep(draft.value, phaseId, stepId, direction)),
      phaseTiming,
      readiness,
      removePhase: (phaseId: string) => replaceDraft(removePhase(draft.value, phaseId)),
      removeStep: (phaseId: string, stepId: string) => replaceDraft(removeStep(draft.value, phaseId, stepId)),
      setPhaseText,
      setStepField,
      setTarget,
      setText,
      timeline,
    };
  },
});

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`;
}
</script>

<template>
  <form class="plan-editor" @submit.prevent="completePlan">
    <section class="plan-readiness" aria-labelledby="readiness-heading">
      <div>
        <p class="section-kicker">Readiness check</p>
        <h2 id="readiness-heading">{{ readiness.ready ? "Ready when you are" : "Plan needs attention" }}</h2>
        <p v-if="readiness.ready">All required planning details are present in this local draft.</p>
        <p v-else>{{ readiness.errors.length }} required {{ readiness.errors.length === 1 ? "detail" : "details" }} missing or invalid.</p>
      </div>
      <StatusIndicator
        :label="completed ? 'Plan complete' : readiness.ready ? 'Ready locally' : 'Not ready'"
        :value="completed ? 'In memory only' : readiness.ready ? 'No save performed' : `${readiness.errors.length} updates needed`"
        :status="readiness.ready ? 'neutral' : 'warning'"
      />
      <ul v-if="!readiness.ready" class="readiness-errors" aria-label="Plan requirements">
        <li v-for="error in readiness.errors" :key="error.path">{{ error.message }}</li>
      </ul>
      <Button class="touch-action" type="submit">Complete plan</Button>
    </section>

    <section class="plan-targets" aria-labelledby="targets-heading">
      <div class="section-heading">
        <p class="section-kicker">Manual targets</p>
        <h2 id="targets-heading">Planned temperatures</h2>
        <p>Planning values only — not probe readings or live telemetry.</p>
      </div>
      <div class="target-grid">
        <label class="target-field" for="plan-field-plannedDomeTarget-value">
          <span>Planned dome target</span>
          <span class="target-input-row">
            <Input
              id="plan-field-plannedDomeTarget-value"
              type="number"
              inputmode="numeric"
              min="150"
              max="700"
              :model-value="draft.plannedDomeTarget.value ?? ''"
              :aria-invalid="Boolean(errorFor('plannedDomeTarget.value'))"
              :aria-describedby="errorFor('plannedDomeTarget.value') ? errorId('plannedDomeTarget.value') : undefined"
              @update:model-value="setTarget('plannedDomeTarget', $event)"
            />
            <strong>°F</strong>
          </span>
          <small>Manual target · 150–700°F</small>
          <span v-if="errorFor('plannedDomeTarget.value')" :id="errorId('plannedDomeTarget.value')" class="field-error">{{ errorFor("plannedDomeTarget.value") }}</span>
        </label>
        <label class="target-field" for="plan-field-plannedFoodTarget-value">
          <span>Planned food target</span>
          <span class="target-input-row">
            <Input
              id="plan-field-plannedFoodTarget-value"
              type="number"
              inputmode="numeric"
              min="32"
              max="212"
              :model-value="draft.plannedFoodTarget.value ?? ''"
              :aria-invalid="Boolean(errorFor('plannedFoodTarget.value'))"
              :aria-describedby="errorFor('plannedFoodTarget.value') ? errorId('plannedFoodTarget.value') : undefined"
              @update:model-value="setTarget('plannedFoodTarget', $event)"
            />
            <strong>°F</strong>
          </span>
          <small>Manual target · 32–212°F</small>
          <span v-if="errorFor('plannedFoodTarget.value')" :id="errorId('plannedFoodTarget.value')" class="field-error">{{ errorFor("plannedFoodTarget.value") }}</span>
        </label>
      </div>
    </section>

    <Card class="plan-basics">
      <CardHeader><CardTitle>Cooking day</CardTitle></CardHeader>
      <CardContent class="form-grid">
        <label for="plan-field-title">
          <span>Plan title</span>
          <Input
            id="plan-field-title"
            :model-value="draft.title"
            :aria-invalid="Boolean(errorFor('title'))"
            :aria-describedby="errorFor('title') ? errorId('title') : undefined"
            @update:model-value="setText('title', $event)"
          />
          <span v-if="errorFor('title')" :id="errorId('title')" class="field-error">{{ errorFor("title") }}</span>
        </label>
        <label for="plan-field-date">
          <span>Cooking date</span>
          <Input
            id="plan-field-date"
            type="date"
            :model-value="draft.date"
            :aria-invalid="Boolean(errorFor('date'))"
            :aria-describedby="errorFor('date') ? errorId('date') : undefined"
            @update:model-value="setText('date', $event)"
          />
          <span v-if="errorFor('date')" :id="errorId('date')" class="field-error">{{ errorFor("date") }}</span>
        </label>
      </CardContent>
    </Card>

    <details class="plan-disclosure plan-timeline" open>
      <summary><span>Timeline</span><strong>{{ formatMinutes(timeline.totalMinutes) }} total</strong></summary>
      <div class="timeline-content">
        <header class="timeline-heading">
          <div>
            <p class="section-kicker">Ordered timeline</p>
            <h2>Phases and steps</h2>
          </div>
          <strong>{{ formatMinutes(timeline.totalMinutes) }} total</strong>
        </header>
        <div class="phase-list">
          <article
            v-for="(phase, phaseIndex) in draft.phases"
            :key="phase.id"
            class="phase-card"
            :data-phase-id="phase.id"
          >
            <header class="phase-card__header">
              <div class="phase-number">{{ String(phaseIndex + 1).padStart(2, "0") }}</div>
              <div>
                <p>Starts at {{ phaseTiming(phase.id)?.offsetMinutes ?? 0 }} min</p>
                <strong>{{ formatMinutes(phaseTiming(phase.id)?.totalMinutes ?? 0) }}</strong>
              </div>
              <div class="item-actions">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="touch-action"
                  :disabled="phaseIndex === 0"
                  :aria-label="`Move ${phase.title || `phase ${phaseIndex + 1}`} up`"
                  @click="movePhase(phase.id, 'up')"
                ><ArrowUp /></Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="touch-action"
                  :disabled="phaseIndex === draft.phases.length - 1"
                  :aria-label="`Move ${phase.title || `phase ${phaseIndex + 1}`} down`"
                  @click="movePhase(phase.id, 'down')"
                ><ArrowDown /></Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="touch-action"
                  :aria-label="`Remove ${phase.title || `phase ${phaseIndex + 1}`}`"
                  @click="removePhase(phase.id)"
                ><Trash2 /></Button>
              </div>
            </header>
            <div class="phase-fields form-grid">
              <label :for="controlId(`phases.${phaseIndex}.title`)">
                <span>Phase {{ phaseIndex + 1 }} title</span>
                <Input
                  :id="controlId(`phases.${phaseIndex}.title`)"
                  :model-value="phase.title"
                  :aria-invalid="Boolean(errorFor(`phases.${phaseIndex}.title`))"
                  :aria-describedby="errorFor(`phases.${phaseIndex}.title`) ? errorId(`phases.${phaseIndex}.title`) : undefined"
                  @update:model-value="setPhaseText(phaseIndex, 'title', $event)"
                />
                <span v-if="errorFor(`phases.${phaseIndex}.title`)" :id="errorId(`phases.${phaseIndex}.title`)" class="field-error">{{ errorFor(`phases.${phaseIndex}.title`) }}</span>
              </label>
              <label :for="controlId(`phases.${phaseIndex}.technique`)">
                <span>Phase {{ phaseIndex + 1 }} technique</span>
                <Input
                  :id="controlId(`phases.${phaseIndex}.technique`)"
                  :model-value="phase.technique"
                  :aria-invalid="Boolean(errorFor(`phases.${phaseIndex}.technique`))"
                  :aria-describedby="errorFor(`phases.${phaseIndex}.technique`) ? errorId(`phases.${phaseIndex}.technique`) : undefined"
                  @update:model-value="setPhaseText(phaseIndex, 'technique', $event)"
                />
                <span v-if="errorFor(`phases.${phaseIndex}.technique`)" :id="errorId(`phases.${phaseIndex}.technique`)" class="field-error">{{ errorFor(`phases.${phaseIndex}.technique`) }}</span>
              </label>
              <label class="wide-field" :for="controlId(`phases.${phaseIndex}.transitionGuidance`)">
                <span>Phase {{ phaseIndex + 1 }} transition guidance</span>
                <Textarea
                  :id="controlId(`phases.${phaseIndex}.transitionGuidance`)"
                  :model-value="phase.transitionGuidance"
                  :aria-invalid="Boolean(errorFor(`phases.${phaseIndex}.transitionGuidance`))"
                  :aria-describedby="errorFor(`phases.${phaseIndex}.transitionGuidance`) ? errorId(`phases.${phaseIndex}.transitionGuidance`) : undefined"
                  @update:model-value="setPhaseText(phaseIndex, 'transitionGuidance', $event)"
                />
                <span v-if="errorFor(`phases.${phaseIndex}.transitionGuidance`)" :id="errorId(`phases.${phaseIndex}.transitionGuidance`)" class="field-error">{{ errorFor(`phases.${phaseIndex}.transitionGuidance`) }}</span>
              </label>
            </div>
            <ol class="step-list">
              <li v-for="(step, stepIndex) in phase.steps" :key="step.id" class="step-card" :data-step-id="step.id">
                <div class="step-marker" aria-hidden="true"></div>
                <div class="step-fields form-grid">
                  <label :for="controlId(`phases.${phaseIndex}.steps.${stepIndex}.title`)">
                    <span>Step {{ stepIndex + 1 }} title</span>
                    <Input
                      :id="controlId(`phases.${phaseIndex}.steps.${stepIndex}.title`)"
                      :model-value="step.title"
                      :aria-invalid="Boolean(errorFor(`phases.${phaseIndex}.steps.${stepIndex}.title`))"
                      :aria-describedby="errorFor(`phases.${phaseIndex}.steps.${stepIndex}.title`) ? errorId(`phases.${phaseIndex}.steps.${stepIndex}.title`) : undefined"
                      @update:model-value="setStepField(phaseIndex, stepIndex, 'title', $event)"
                    />
                    <span v-if="errorFor(`phases.${phaseIndex}.steps.${stepIndex}.title`)" :id="errorId(`phases.${phaseIndex}.steps.${stepIndex}.title`)" class="field-error">{{ errorFor(`phases.${phaseIndex}.steps.${stepIndex}.title`) }}</span>
                  </label>
                  <label :for="controlId(`phases.${phaseIndex}.steps.${stepIndex}.durationMinutes`)">
                    <span>Step {{ stepIndex + 1 }} duration (minutes)</span>
                    <Input
                      :id="controlId(`phases.${phaseIndex}.steps.${stepIndex}.durationMinutes`)"
                      type="number"
                      min="1"
                      max="1440"
                      :model-value="step.durationMinutes"
                      :aria-invalid="Boolean(errorFor(`phases.${phaseIndex}.steps.${stepIndex}.durationMinutes`))"
                      :aria-describedby="errorFor(`phases.${phaseIndex}.steps.${stepIndex}.durationMinutes`) ? errorId(`phases.${phaseIndex}.steps.${stepIndex}.durationMinutes`) : undefined"
                      @update:model-value="setStepField(phaseIndex, stepIndex, 'durationMinutes', $event)"
                    />
                    <span v-if="errorFor(`phases.${phaseIndex}.steps.${stepIndex}.durationMinutes`)" :id="errorId(`phases.${phaseIndex}.steps.${stepIndex}.durationMinutes`)" class="field-error">{{ errorFor(`phases.${phaseIndex}.steps.${stepIndex}.durationMinutes`) }}</span>
                  </label>
                  <label class="wide-field" :for="controlId(`phases.${phaseIndex}.steps.${stepIndex}.instructions`)">
                    <span>Step {{ stepIndex + 1 }} instructions</span>
                    <Textarea
                      :id="controlId(`phases.${phaseIndex}.steps.${stepIndex}.instructions`)"
                      :model-value="step.instructions"
                      :aria-invalid="Boolean(errorFor(`phases.${phaseIndex}.steps.${stepIndex}.instructions`))"
                      :aria-describedby="errorFor(`phases.${phaseIndex}.steps.${stepIndex}.instructions`) ? errorId(`phases.${phaseIndex}.steps.${stepIndex}.instructions`) : undefined"
                      @update:model-value="setStepField(phaseIndex, stepIndex, 'instructions', $event)"
                    />
                    <span v-if="errorFor(`phases.${phaseIndex}.steps.${stepIndex}.instructions`)" :id="errorId(`phases.${phaseIndex}.steps.${stepIndex}.instructions`)" class="field-error">{{ errorFor(`phases.${phaseIndex}.steps.${stepIndex}.instructions`) }}</span>
                  </label>
                </div>
                <div class="item-actions step-actions">
                  <Button type="button" variant="ghost" size="icon" class="touch-action" :disabled="stepIndex === 0" :aria-label="`Move ${step.title || `step ${stepIndex + 1}`} up`" @click="moveStep(phase.id, step.id, 'up')"><ArrowUp /></Button>
                  <Button type="button" variant="ghost" size="icon" class="touch-action" :disabled="stepIndex === phase.steps.length - 1" :aria-label="`Move ${step.title || `step ${stepIndex + 1}`} down`" @click="moveStep(phase.id, step.id, 'down')"><ArrowDown /></Button>
                  <Button type="button" variant="ghost" size="icon" class="touch-action" :aria-label="`Remove ${step.title || `step ${stepIndex + 1}`}`" @click="removeStep(phase.id, step.id)"><Trash2 /></Button>
                </div>
              </li>
            </ol>
            <Button
              :id="controlId(`phases.${phaseIndex}.steps`)"
              type="button"
              variant="outline"
              class="touch-action"
              :aria-invalid="Boolean(errorFor(`phases.${phaseIndex}.steps`))"
              :aria-describedby="errorFor(`phases.${phaseIndex}.steps`) ? errorId(`phases.${phaseIndex}.steps`) : undefined"
              @click="appendStep(phase.id)"
            ><Plus /> Add step to phase {{ phaseIndex + 1 }}</Button>
            <p v-if="errorFor(`phases.${phaseIndex}.steps`)" :id="errorId(`phases.${phaseIndex}.steps`)" class="field-error">{{ errorFor(`phases.${phaseIndex}.steps`) }}</p>
          </article>
        </div>
        <Button
          id="plan-field-phases"
          type="button"
          variant="outline"
          class="touch-action"
          :aria-invalid="Boolean(errorFor('phases'))"
          :aria-describedby="errorFor('phases') ? errorId('phases') : undefined"
          @click="appendPhase"
        ><Plus /> Add phase</Button>
        <p v-if="errorFor('phases')" :id="errorId('phases')" class="field-error">{{ errorFor("phases") }}</p>
      </div>
    </details>

    <details class="plan-disclosure plan-guidance" open>
      <summary><span>Setup & vent plan</span><strong>Kamado controls</strong></summary>
      <Card>
        <CardHeader><CardTitle>Setup and fire guidance</CardTitle></CardHeader>
        <CardContent class="guidance-fields">
          <label for="plan-field-setup">
            <span>Kamado setup</span>
            <Textarea id="plan-field-setup" :model-value="draft.setup" :aria-invalid="Boolean(errorFor('setup'))" :aria-describedby="errorFor('setup') ? errorId('setup') : undefined" @update:model-value="setText('setup', $event)" />
            <span v-if="errorFor('setup')" :id="errorId('setup')" class="field-error">{{ errorFor("setup") }}</span>
          </label>
          <label for="plan-field-ventFireGuidance">
            <span>Vent and fire guidance</span>
            <Textarea id="plan-field-ventFireGuidance" :model-value="draft.ventFireGuidance" :aria-invalid="Boolean(errorFor('ventFireGuidance'))" :aria-describedby="errorFor('ventFireGuidance') ? errorId('ventFireGuidance') : undefined" @update:model-value="setText('ventFireGuidance', $event)" />
            <span v-if="errorFor('ventFireGuidance')" :id="errorId('ventFireGuidance')" class="field-error">{{ errorFor("ventFireGuidance") }}</span>
          </label>
          <label for="plan-field-prepNotes">
            <span>Prep notes</span>
            <Textarea id="plan-field-prepNotes" :model-value="draft.prepNotes" :aria-invalid="Boolean(errorFor('prepNotes'))" :aria-describedby="errorFor('prepNotes') ? errorId('prepNotes') : undefined" @update:model-value="setText('prepNotes', $event)" />
            <span v-if="errorFor('prepNotes')" :id="errorId('prepNotes')" class="field-error">{{ errorFor("prepNotes") }}</span>
          </label>
        </CardContent>
      </Card>
    </details>
  </form>
</template>

<style scoped>
.plan-editor { display: grid; gap: 20px; }
.plan-readiness, .plan-targets { display: grid; gap: 16px; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-roomy); padding: 20px; background: linear-gradient(145deg, var(--color-surface), var(--color-neutral-onyx)); box-shadow: var(--shadow-inset); }
.plan-readiness { border-left: 3px solid var(--color-warning); }
.plan-readiness h2, .section-heading h2, .timeline-heading h2 { font-family: var(--font-heading); font-size: var(--text-heading-lg); text-transform: uppercase; }
.plan-readiness p, .section-heading p { color: var(--color-text-muted); font-size: var(--text-ui); }
.section-kicker { color: var(--color-accent) !important; font-family: var(--font-label); font-size: var(--text-small) !important; letter-spacing: .1em; text-transform: uppercase; }
.readiness-errors { display: grid; gap: 6px; padding-left: 20px; color: var(--color-warning); font-size: var(--text-small); }
.target-grid, .form-grid { display: grid; gap: 16px; }
.target-field, .form-grid label, .guidance-fields label { display: grid; min-width: 0; gap: 8px; color: var(--color-neutral-smoke); font-family: var(--font-label); font-size: var(--text-ui); letter-spacing: .03em; text-transform: uppercase; }
.target-field { border: 1px solid var(--color-border-subtle); border-radius: var(--radius-default); padding: 16px; background: var(--color-core); }
.target-input-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; }
.target-input-row input { min-height: 48px; color: var(--color-accent); font-family: var(--font-heading); font-size: var(--text-heading-lg); }
.target-input-row strong { font-family: var(--font-heading); font-size: var(--text-heading-lg); }
.target-field small { color: var(--color-text-muted); font-family: var(--font-body); font-size: var(--text-small); text-transform: none; }
.plan-basics { overflow: hidden; }
.plan-disclosure { min-width: 0; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-roomy); background: var(--color-neutral-onyx); }
.plan-disclosure > summary { display: flex; min-height: 56px; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; cursor: pointer; font-family: var(--font-heading); text-transform: uppercase; }
.plan-disclosure > summary strong { color: var(--color-accent); font-size: var(--text-small); }
.timeline-content { display: grid; gap: 18px; padding: 0 12px 16px; }
.timeline-heading { display: none; }
.phase-list { display: grid; gap: 16px; }
.phase-card { min-width: 0; overflow: hidden; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-default); background: var(--color-surface); }
.phase-card__header { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid var(--color-border-subtle); background: var(--color-core); }
.phase-card__header p { color: var(--color-text-muted); font-size: var(--text-caption); }
.phase-card__header strong { font-family: var(--font-heading); color: var(--color-accent); }
.phase-number { display: grid; width: 38px; height: 38px; place-items: center; border: 1px solid var(--color-accent); border-radius: 50%; font-family: var(--font-heading); color: var(--color-accent); }
.item-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 2px; }
.touch-action { min-width: 44px; min-height: 44px; }
.phase-fields { padding: 16px; }
.step-list { display: grid; gap: 12px; margin: 0; padding: 0 12px 12px; list-style: none; }
.step-card { position: relative; display: grid; min-width: 0; gap: 12px; border-left: 1px solid var(--color-accent); padding: 12px 0 12px 16px; }
.step-marker { position: absolute; top: 28px; left: -5px; width: 9px; height: 9px; border-radius: 50%; background: var(--color-accent); box-shadow: 0 0 14px rgb(228 81 26 / 55%); }
.step-actions { justify-content: flex-start; }
.field-error { color: var(--color-feedback-danger); font-family: var(--font-body); font-size: var(--text-small); letter-spacing: 0; text-transform: none; }
.guidance-fields { display: grid; gap: 16px; }
.guidance-fields textarea { min-height: 96px; }

@media (min-width: 640px) {
  .target-grid, .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .wide-field { grid-column: 1 / -1; }
  .step-card { grid-template-columns: minmax(0, 1fr) auto; }
  .step-actions { align-content: start; }
}

@media (min-width: 900px) {
  .plan-editor { grid-template-columns: minmax(0, 1.7fr) minmax(280px, .8fr); align-items: start; }
  .plan-readiness { grid-column: 2; grid-row: 1; position: sticky; top: 76px; }
  .plan-targets { grid-column: 2; grid-row: 2; }
  .plan-basics { grid-column: 1; grid-row: 1; }
  .plan-timeline { grid-column: 1; grid-row: 2 / span 2; }
  .plan-guidance { grid-column: 2; grid-row: 3; }
  .plan-disclosure > summary { display: none; }
  .timeline-content { padding: 20px; }
  .timeline-heading { display: flex; align-items: end; justify-content: space-between; }
  .timeline-heading > strong { color: var(--color-accent); font-family: var(--font-heading); font-size: var(--text-label); }
  .plan-guidance > .card { border: 0; }
}
</style>
