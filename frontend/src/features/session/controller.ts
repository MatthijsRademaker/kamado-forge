import { computed, reactive } from "vue";
import { selectSessionFixture, type SessionFixtureName } from "./fixtures";

export interface SessionFlowClock {
  now(): number;
  setInterval(callback: () => void, milliseconds: number): unknown;
  clearInterval(id: unknown): void;
}

interface SessionFlowState {
  fixture: SessionFixtureName;
  kind: "no-session" | "draft" | "active";
  plan: ReturnType<typeof selectSessionFixture>["plan"];
  running: boolean;
  stepIndex: number;
  elapsedBaseSeconds: number;
  elapsedDisplaySeconds: number;
  startedAtMs: number | null;
  note: string;
}

const browserClock: SessionFlowClock = {
  now: () => Date.now(),
  setInterval: (callback, milliseconds) => window.setInterval(callback, milliseconds),
  clearInterval: (id) => window.clearInterval(id as number),
};

export function createSessionFlow(search: string, clock: SessionFlowClock = browserClock) {
  const state = reactive(createState(search)) as SessionFlowState;
  let timer: unknown = null;

  const steps = computed(() => state.plan?.phases.flatMap((phase) => phase.steps) ?? []);
  const currentStep = computed(() => steps.value[state.stepIndex] ?? null);
  const nextStep = computed(() => steps.value[state.stepIndex + 1] ?? null);
  const elapsedSeconds = computed(() => state.elapsedDisplaySeconds);
  const canBack = computed(() => state.kind === "active" && state.stepIndex > 0);
  const canAdvance = computed(() => state.kind === "active" && state.stepIndex < steps.value.length - 1);
  const progressPercent = computed(() =>
    steps.value.length === 0 ? 0 : Math.round(((state.stepIndex + 1) / steps.value.length) * 100),
  );

  function syncElapsed(): void {
    if (!state.running || state.startedAtMs === null) return;
    state.elapsedDisplaySeconds = state.elapsedBaseSeconds + Math.floor((clock.now() - state.startedAtMs) / 1000);
  }

  function startTimer(): void {
    stopTimer();
    if (!state.running) return;
    state.startedAtMs = clock.now();
    timer = clock.setInterval(syncElapsed, 250);
  }

  function stopTimer(): void {
    if (timer === null) return;
    clock.clearInterval(timer);
    timer = null;
  }

  function replaceState(searchValue: string): void {
    stopTimer();
    Object.assign(state, createState(searchValue));
    startTimer();
  }

  function startCook(): void {
    if (state.kind !== "draft" || state.plan === null) throw new Error("Starting a cook requires a draft session");
    state.kind = "active";
    state.fixture = "active-running";
    state.running = true;
    state.stepIndex = 0;
    state.elapsedBaseSeconds = 0;
    state.elapsedDisplaySeconds = 0;
    state.note = "";
    startTimer();
  }

  function pause(): void {
    if (state.kind !== "active" || !state.running) throw new Error("Pausing requires a running session");
    syncElapsed();
    state.elapsedBaseSeconds = state.elapsedDisplaySeconds;
    state.startedAtMs = null;
    state.running = false;
    state.fixture = "active-paused";
    stopTimer();
  }

  function resume(): void {
    if (state.kind !== "active" || state.running) throw new Error("Resuming requires a paused session");
    state.elapsedBaseSeconds = state.elapsedDisplaySeconds;
    state.running = true;
    state.fixture = "active-running";
    startTimer();
  }

  function back(): void {
    if (state.kind !== "active") throw new Error("Step navigation requires an active session");
    if (state.stepIndex === 0) throw new Error("Already at the first step");
    state.stepIndex -= 1;
  }

  function advance(): void {
    if (state.kind !== "active") throw new Error("Step navigation requires an active session");
    if (state.stepIndex >= steps.value.length - 1) throw new Error("Already at the final step");
    state.stepIndex += 1;
  }

  function setNote(value: string): void {
    if (state.kind !== "active") throw new Error("Notes require an active session");
    state.note = value;
  }

  function endSession(): void {
    replaceState("?fixture=no-session");
  }

  function dispose(): void {
    stopTimer();
  }

  startTimer();

  return {
    state,
    steps,
    currentStep,
    nextStep,
    elapsedSeconds,
    canBack,
    canAdvance,
    progressPercent,
    startCook,
    pause,
    resume,
    back,
    advance,
    setNote,
    finish: endSession,
    cancel: endSession,
    reset: replaceState,
    dispose,
  };
}

function createState(search: string): SessionFlowState {
  const baseline = selectSessionFixture(search);
  return {
    fixture: baseline.fixture,
    kind: baseline.kind,
    plan: baseline.plan,
    running: baseline.running,
    stepIndex: baseline.stepIndex,
    elapsedBaseSeconds: baseline.elapsedSeconds,
    elapsedDisplaySeconds: baseline.elapsedSeconds,
    startedAtMs: baseline.running ? 0 : null,
    note: "",
  };
}

export type SessionFlow = ReturnType<typeof createSessionFlow>;
