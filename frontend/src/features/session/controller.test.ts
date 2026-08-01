import { describe, expect, test } from "bun:test";
import { createSessionFlow, type SessionFlowClock } from "./controller";

function createClock(): SessionFlowClock & { advance(milliseconds: number): void; activeTimers(): number } {
  let now = 10_000;
  let nextTimerId = 1;
  const timers = new Map<number, () => void>();

  return {
    now: () => now,
    setInterval(callback: () => void) {
      const id = nextTimerId++;
      timers.set(id, callback);
      return id;
    },
    clearInterval(id: unknown) {
      timers.delete(id as number);
    },
    advance(milliseconds: number) {
      now += milliseconds;
      for (const callback of timers.values()) callback();
    },
    activeTimers: () => timers.size,
  };
}

describe("mounted session flow", () => {
  test("starts a cloned draft and advances elapsed time only while running", () => {
    const clock = createClock();
    const first = createSessionFlow("?fixture=draft", clock);

    expect(first.state.kind).toBe("draft");
    first.startCook();
    expect(first.state.kind).toBe("active");
    expect(first.currentStep.value?.title).toBe("Light a small fire");
    expect(clock.activeTimers()).toBe(1);

    clock.advance(2_400);
    expect(first.elapsedSeconds.value).toBe(2);
    first.pause();
    clock.advance(5_000);
    expect(first.elapsedSeconds.value).toBe(2);

    first.resume();
    clock.advance(2_000);
    expect(first.elapsedSeconds.value).toBe(4);
    first.dispose();
    expect(clock.activeTimers()).toBe(0);

    if (!first.state.plan) throw new Error("Expected the started session plan");
    first.state.plan.title = "Mounted edit";

    const restored = createSessionFlow("?fixture=draft", createClock());
    expect(restored.state.kind).toBe("draft");
    expect(restored.state.plan?.title).toBe("Reverse-sear steak night");
    expect(restored.state.plan).not.toBe(first.state.plan);
  });

  test("keeps navigation bounded, retains the note, and confirms terminal reset through controller actions", () => {
    const flow = createSessionFlow("?fixture=active-running", createClock());

    expect(flow.canBack.value).toBe(true);
    flow.setNote("Close the top vent a touch after the next move.");
    flow.back();
    expect(flow.canBack.value).toBe(false);
    expect(flow.state.note).toBe("Close the top vent a touch after the next move.");
    expect(() => flow.back()).toThrow("Already at the first step");

    while (flow.canAdvance.value) flow.advance();
    expect(flow.currentStep.value?.title).toBe("Sear and rest");
    expect(flow.canAdvance.value).toBe(false);
    expect(() => flow.advance()).toThrow("Already at the final step");

    flow.finish();
    expect(flow.state.kind).toBe("no-session");
    expect(flow.state.plan).toBeNull();
    expect(flow.state.note).toBe("");
  });
});
