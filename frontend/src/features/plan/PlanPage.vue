<script lang="ts">
import { defineComponent, ref } from "vue";
import EmptyState from "@/components/EmptyState.vue";
import ErrorState from "@/components/ErrorState.vue";
import LoadingState from "@/components/LoadingState.vue";
import { Button } from "@/components/ui/button";
import {
  createLocalDraft,
  resetLocalDraft,
  retryLocalFixture,
  returnToDefaultFixture,
  selectFixture,
  type PlanFixtureState,
} from "./fixtures";
import PlanEditor from "./PlanEditor.vue";
import PlanNavigation from "./PlanNavigation.vue";

export default defineComponent({
  components: { Button, EmptyState, ErrorState, LoadingState, PlanEditor, PlanNavigation },
  setup() {
    const state = ref<PlanFixtureState>(selectFixture(window.location.search));
    const createDraft = () => {
      state.value = createLocalDraft(state.value);
    };
    const reset = () => {
      state.value = resetLocalDraft(state.value);
    };
    const retry = () => {
      state.value = retryLocalFixture(state.value);
    };
    const returnToDefault = () => {
      state.value = returnToDefaultFixture(state.value);
    };

    return { createDraft, reset, retry, returnToDefault, state };
  },
});
</script>

<template>
  <div class="plan-page">
    <header class="plan-masthead">
      <a class="plan-brand plan-touch-action" href="/" aria-label="Kamado Mastery showcase">
        <span aria-hidden="true">▲</span>
        <span>KAMADO<br />MASTERY</span>
      </a>
      <div>
        <p class="plan-eyebrow">Local cooking-day draft</p>
        <h1 v-if="state.kind === 'draft'" class="plan-title">{{ state.draft.title || "Untitled plan" }}</h1>
        <h1 v-else class="plan-title">Plan the fire</h1>
      </div>
      <p class="plan-local-note">In memory only · refresh resets edits</p>
    </header>

    <main class="plan-main">
      <LoadingState
        v-if="state.kind === 'loading'"
        label="Preparing local plan"
        description="This fixture stays local and does not request a session."
      >
        <template #action><Button class="plan-touch-action" @click="returnToDefault">Return to complete fixture</Button></template>
      </LoadingState>
      <ErrorState
        v-else-if="state.kind === 'error'"
        title="Local fixture unavailable"
        description="No server request failed. This deterministic state exists for interface review."
      >
        <template #action><Button class="plan-touch-action" @click="retry">Retry locally</Button></template>
      </ErrorState>
      <EmptyState
        v-else-if="state.kind === 'empty'"
        title="Build a local plan"
        description="Start with a contract-typed empty draft. Nothing will be saved or started."
      >
        <template #action><Button class="plan-touch-action" @click="createDraft">Create local draft</Button></template>
      </EmptyState>
      <section v-else aria-label="Plan workspace">
        <div class="plan-workspace-actions">
          <p>Editing a local clone. Refresh or reset discards changes.</p>
          <Button type="button" variant="outline" class="plan-touch-action" @click="reset">Reset local draft</Button>
        </div>
        <PlanEditor v-model="state.draft" />
      </section>
    </main>

    <PlanNavigation />
  </div>
</template>

<style scoped>
.plan-page {
  min-height: 100vh;
  overflow-x: clip;
  background:
    radial-gradient(circle at 78% 8%, rgb(228 81 26 / 10%), transparent 26rem),
    linear-gradient(135deg, var(--color-neutral-obsidian), var(--color-core) 48%, #171411);
  color: var(--color-text);
  padding-bottom: calc(88px + env(safe-area-inset-bottom));
}

.plan-masthead {
  display: grid;
  gap: 20px;
  padding: 24px 16px 28px;
  border-bottom: 1px solid var(--color-border-subtle);
  background-image: linear-gradient(110deg, rgb(0 0 0 / 72%), rgb(31 30 30 / 72%));
}

.plan-brand {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 10px;
  color: var(--color-neutral-frost);
  font-family: var(--font-heading);
  font-size: var(--text-label);
  line-height: 0.85;
  text-decoration: none;
}

.plan-brand > :first-child {
  color: var(--color-accent);
  font-size: 28px;
}

.plan-eyebrow {
  color: var(--color-accent);
  font-family: var(--font-label);
  font-size: var(--text-small);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.plan-title {
  margin-top: 6px;
  overflow-wrap: anywhere;
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 10vw, 5.5rem);
  font-weight: 400;
  line-height: 0.95;
  text-transform: uppercase;
}

.plan-local-note {
  align-self: end;
  color: var(--color-text-muted);
  font-size: var(--text-small);
}

.plan-main {
  width: min(100% - 32px, 1240px);
  margin-inline: auto;
  padding-block: 28px;
}

.plan-workspace-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
  color: var(--color-text-muted);
  font-size: var(--text-small);
}

.plan-touch-action {
  min-width: 44px;
  min-height: 44px;
}

@media (min-width: 768px) {
  .plan-page {
    display: grid;
    grid-template-rows: auto auto 1fr;
    padding-bottom: 0;
  }

  .plan-masthead {
    grid-row: 2;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: end;
    padding: 36px max(32px, calc((100vw - 1240px) / 2));
  }

  .plan-main {
    padding-block: 40px 72px;
  }
}
</style>
