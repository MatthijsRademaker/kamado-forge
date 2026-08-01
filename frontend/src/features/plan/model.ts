import type {
  PlanEditorForm,
  PlanEditorModel as SessionPlan,
  PlanEditorPhase as SessionPlanPhase,
  PlanEditorStep as SessionPlanStep,
} from "./draft";

interface ReadinessError {
  path: string;
  message: string;
}

interface ReadinessResult {
  ready: boolean;
  errors: ReadinessError[];
  firstInvalidPath: string | null;
}

export function deriveTimeline(plan: SessionPlan) {
  let planOffsetMinutes = 0;
  const phases = plan.phases.map((phase) => {
    let phaseOffsetMinutes = planOffsetMinutes;
    const steps = phase.steps.map((step) => {
      const timelineStep = {
        id: step.id,
        offsetMinutes: phaseOffsetMinutes,
        durationMinutes: step.durationMinutes,
      };
      phaseOffsetMinutes += step.durationMinutes;
      return timelineStep;
    });
    const totalMinutes = phaseOffsetMinutes - planOffsetMinutes;
    const timelinePhase = {
      id: phase.id,
      offsetMinutes: planOffsetMinutes,
      totalMinutes,
      steps,
    };
    planOffsetMinutes = phaseOffsetMinutes;
    return timelinePhase;
  });

  return { totalMinutes: planOffsetMinutes, phases };
}

export function validateReadiness(plan: SessionPlan | PlanEditorForm): ReadinessResult {
  const errors: ReadinessError[] = [];
  const requireText = (path: string, value: string, label: string, maximumLength?: number) => {
    const length = value.trim().length;
    if (length === 0) {
      errors.push({ path, message: `${label} is required.` });
    } else if (maximumLength !== undefined && length > maximumLength) {
      errors.push({ path, message: `${label} must be ${maximumLength} characters or fewer.` });
    }
  };
  const requireUniqueIdentity = (path: string, value: string, label: string, used: Set<string>) => {
    if (value.length === 0) {
      errors.push({ path, message: `${label} identity is required.` });
    } else if (used.has(value)) {
      errors.push({ path, message: `${label} identity must be unique.` });
    } else {
      used.add(value);
    }
  };

  const identities = new Set<string>();
  requireUniqueIdentity("id", plan.id, "Plan", identities);
  plan.phases.forEach((phase, phaseIndex) => {
    requireUniqueIdentity(`phases.${phaseIndex}.id`, phase.id, `Phase ${phaseIndex + 1}`, identities);
  });
  plan.phases.forEach((phase, phaseIndex) => {
    phase.steps.forEach((step, stepIndex) => {
      requireUniqueIdentity(
        `phases.${phaseIndex}.steps.${stepIndex}.id`,
        step.id,
        `Step ${stepIndex + 1} in phase ${phaseIndex + 1}`,
        identities,
      );
    });
  });

  requireText("title", plan.title, "Plan title", 120);
  if (!isCalendarDate(plan.date)) {
    errors.push({ path: "date", message: "Choose a valid plan date." });
  }
  requireIntegerInRange(
    errors,
    "plannedDomeTarget.value",
    plan.plannedDomeTarget.value,
    150,
    700,
    "Planned dome target",
  );
  if ("plannedDomeMaxF" in plan) {
    requireIntegerInRange(errors, "plannedDomeMaxF", plan.plannedDomeMaxF, 150, 700, "Planned dome maximum");
    if (
      plan.plannedDomeTarget.value !== null &&
      plan.plannedDomeMaxF !== null &&
      plan.plannedDomeTarget.value > plan.plannedDomeMaxF
    ) {
      errors.push({ path: "plannedDomeMaxF", message: "Planned dome maximum must not be below the minimum." });
    }
    requireText("deflectorGuidance", plan.deflectorGuidance, "Deflector guidance");
    requireText("heatZoneGuidance", plan.heatZoneGuidance, "Heat-zone guidance");
  }
  requireIntegerInRange(
    errors,
    "plannedFoodTarget.value",
    plan.plannedFoodTarget.value,
    32,
    212,
    "Planned food target",
  );
  requireText("setup", plan.setup, "Kamado setup");
  requireText("ventFireGuidance", plan.ventFireGuidance, "Vent and fire guidance");
  requireText("prepNotes", plan.prepNotes, "Prep notes");

  if (plan.phases.length === 0) {
    errors.push({ path: "phases", message: "Add at least one phase." });
  }

  plan.phases.forEach((phase, phaseIndex) => {
    const phasePath = `phases.${phaseIndex}`;
    requireText(`${phasePath}.title`, phase.title, `Phase ${phaseIndex + 1} title`);
    requireText(`${phasePath}.technique`, phase.technique, `Phase ${phaseIndex + 1} technique`);
    requireText(
      `${phasePath}.transitionGuidance`,
      phase.transitionGuidance,
      `Phase ${phaseIndex + 1} transition guidance`,
    );
    if (phase.steps.length === 0) {
      errors.push({ path: `${phasePath}.steps`, message: `Add at least one step to phase ${phaseIndex + 1}.` });
    }
    phase.steps.forEach((step, stepIndex) => {
      const stepPath = `${phasePath}.steps.${stepIndex}`;
      requireText(`${stepPath}.title`, step.title, `Step ${stepIndex + 1} title`);
      requireIntegerInRange(
        errors,
        `${stepPath}.durationMinutes`,
        step.durationMinutes,
        1,
        1440,
        `Step ${stepIndex + 1} duration`,
      );
      requireText(`${stepPath}.instructions`, step.instructions, `Step ${stepIndex + 1} instructions`);
    });
  });

  return {
    ready: errors.length === 0,
    errors,
    firstInvalidPath: errors[0]?.path ?? null,
  };
}

export function addPhase(plan: SessionPlan, phase: SessionPlanPhase): SessionPlan {
  requireAvailableIdentities(plan, [phase.id, ...phase.steps.map(({ id }) => id)]);
  return { ...plan, phases: [...plan.phases, phase] };
}

export function removePhase(plan: SessionPlan, phaseId: string): SessionPlan {
  const phaseIndex = findPhaseIndex(plan, phaseId);
  return { ...plan, phases: plan.phases.filter((_, index) => index !== phaseIndex) };
}

export function movePhase(plan: SessionPlan, phaseId: string, direction: "up" | "down"): SessionPlan {
  const phaseIndex = findPhaseIndex(plan, phaseId);
  const phases = moveItem(plan.phases, phaseIndex, direction);
  return phases === plan.phases ? plan : { ...plan, phases };
}

export function addStep(plan: SessionPlan, phaseId: string, step: SessionPlanStep): SessionPlan {
  const phaseIndex = findPhaseIndex(plan, phaseId);
  requireAvailableIdentities(plan, [step.id]);
  return updatePhase(plan, phaseIndex, (phase) => ({ ...phase, steps: [...phase.steps, step] }));
}

export function removeStep(plan: SessionPlan, phaseId: string, stepId: string): SessionPlan {
  const phaseIndex = findPhaseIndex(plan, phaseId);
  const phase = plan.phases[phaseIndex];
  if (!phase) throw new Error(`Unknown phase: ${phaseId}`);
  const stepIndex = phase.steps.findIndex(({ id }) => id === stepId);
  if (stepIndex === -1) throw new Error(`Unknown step: ${stepId}`);
  return updatePhase(plan, phaseIndex, (current) => ({
    ...current,
    steps: current.steps.filter((_, index) => index !== stepIndex),
  }));
}

export function moveStep(plan: SessionPlan, phaseId: string, stepId: string, direction: "up" | "down"): SessionPlan {
  const phaseIndex = findPhaseIndex(plan, phaseId);
  const phase = plan.phases[phaseIndex];
  if (!phase) throw new Error(`Unknown phase: ${phaseId}`);
  const stepIndex = phase.steps.findIndex(({ id }) => id === stepId);
  if (stepIndex === -1) throw new Error(`Unknown step: ${stepId}`);
  const steps = moveItem(phase.steps, stepIndex, direction);
  return steps === phase.steps ? plan : updatePhase(plan, phaseIndex, (current) => ({ ...current, steps }));
}

function requireAvailableIdentities(plan: SessionPlan, additions: string[]): void {
  const identities = [
    plan.id,
    ...plan.phases.map(({ id }) => id),
    ...plan.phases.flatMap(({ steps }) => steps.map(({ id }) => id)),
    ...additions,
  ];
  const used = new Set<string>();
  for (const identity of identities) {
    if (identity.length === 0) throw new Error("Identity is required");
    if (used.has(identity)) throw new Error(`Duplicate identity: ${identity}`);
    used.add(identity);
  }
}

function findPhaseIndex(plan: SessionPlan, phaseId: string): number {
  const phaseIndex = plan.phases.findIndex(({ id }) => id === phaseId);
  if (phaseIndex === -1) throw new Error(`Unknown phase: ${phaseId}`);
  return phaseIndex;
}

function updatePhase(
  plan: SessionPlan,
  phaseIndex: number,
  update: (phase: SessionPlanPhase) => SessionPlanPhase,
): SessionPlan {
  return {
    ...plan,
    phases: plan.phases.map((phase, index) => (index === phaseIndex ? update(phase) : phase)),
  };
}

function moveItem<T>(items: T[], index: number, direction: "up" | "down"): T[] {
  const destination = direction === "up" ? index - 1 : index + 1;
  if (destination < 0 || destination >= items.length) return items;
  const moved = [...items];
  const item = moved[index];
  const destinationItem = moved[destination];
  if (item === undefined || destinationItem === undefined) {
    throw new Error(`Cannot move item from ${index} to ${destination}`);
  }
  [moved[index], moved[destination]] = [destinationItem, item];
  return moved;
}

function requireIntegerInRange(
  errors: ReadinessError[],
  path: string,
  value: number | null,
  minimum: number,
  maximum: number,
  label: string,
): void {
  if (value === null || !Number.isInteger(value) || value < minimum || value > maximum) {
    errors.push({ path, message: `${label} must be a whole number from ${minimum} to ${maximum}.` });
  }
}

function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
