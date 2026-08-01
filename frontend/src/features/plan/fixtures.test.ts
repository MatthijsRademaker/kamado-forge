import { describe, expect, test } from "bun:test";
import {
  createLocalDraft,
  resetLocalDraft,
  retryLocalFixture,
  selectFixture,
  returnToDefaultFixture,
} from "./fixtures";

describe("Plan fixture lifecycle", () => {
  test("selects every documented fixture and defaults unsupported values to complete", () => {
    expect(selectFixture("?fixture=complete").kind).toBe("draft");
    expect(selectFixture("?fixture=incomplete").kind).toBe("draft");
    expect(selectFixture("?fixture=empty").kind).toBe("empty");
    expect(selectFixture("?fixture=loading")).toEqual({ kind: "loading", fixture: "loading" });
    expect(selectFixture("?fixture=error")).toEqual({ kind: "error", fixture: "error" });
    expect(selectFixture("?fixture=unsupported")).toMatchObject({ kind: "draft", fixture: "complete" });
  });

  test("deep clones draft fixtures and resets edits from immutable definitions", () => {
    const first = selectFixture("?fixture=complete");
    if (first.kind !== "draft") throw new Error("Expected complete draft fixture");
    const firstStep = first.draft.phases[0]?.steps[0];
    if (!firstStep) throw new Error("Expected the complete fixture's first step");
    first.draft.title = "Changed locally";
    firstStep.title = "Changed nested step";

    const reset = resetLocalDraft(first);
    if (reset.kind !== "draft") throw new Error("Expected reset draft fixture");
    const resetStep = reset.draft.phases[0]?.steps[0];
    if (!resetStep) throw new Error("Expected the reset fixture's first step");

    expect(reset.draft.title).toBe("Reverse-sear steak night");
    expect(resetStep.title).toBe("Light a small fire");
    expect(reset.draft).not.toBe(first.draft);
    expect(reset.draft.phases[0]).not.toBe(first.draft.phases[0]);
  });

  test("uses explicit deterministic local create, retry, and return transitions", () => {
    const empty = selectFixture("?fixture=empty");
    if (empty.kind !== "empty") throw new Error("Expected empty fixture");

    expect(createLocalDraft(empty)).toMatchObject({ kind: "draft", fixture: "empty" });
    expect(retryLocalFixture(selectFixture("?fixture=error"))).toMatchObject({ kind: "draft", fixture: "complete" });
    expect(returnToDefaultFixture(selectFixture("?fixture=loading"))).toMatchObject({
      kind: "draft",
      fixture: "complete",
    });
  });
});
