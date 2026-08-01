import { randomUUID } from "node:crypto";
import type { LiveCookAction, LiveCookCommand, LiveCookProjection } from "../live-cook-contract";
import type { PersistenceContext } from "./repository-context";
import { createSessionRepository } from "./session-repository";

interface DraftRow {
  readonly id: string;
  readonly activated_at: string | null;
}

interface DraftStepRow {
  readonly id: string;
  readonly ordinal: number;
  readonly title: string;
  readonly instructions: string;
  readonly duration_minutes: number;
}

interface SessionRow {
  readonly id: string;
  readonly status: LiveCookProjection["status"];
  readonly current_step_id: string | null;
  readonly activated_at: string;
}

interface SessionStepRow {
  readonly id: string;
  readonly ordinal: number;
  readonly title: string;
  readonly instructions: string;
  readonly duration_minutes: number;
}

interface ExecutionVisitRow {
  readonly id: string;
  readonly session_step_id: string;
  readonly ordinal: number;
  readonly actual_started_at: string;
  readonly actual_finished_at: string | null;
  readonly cancelled_at: string | null;
}

interface StepNoteRow {
  readonly id: string;
  readonly ordinal: number;
  readonly content: string;
  readonly created_at: string;
}

interface TransitionRow {
  readonly action: "ACTIVATE" | "PAUSE" | "RESUME" | "ADVANCE" | "RETURN" | "COMPLETE" | "CANCEL";
  readonly occurred_at: string;
}

interface UtcClock {
  now(): Date;
}

type LiveCookErrorCode = "NOT_FOUND" | "INVALID_DRAFT" | "ACTIVE_SESSION_CONFLICT" | "INVALID_TRANSITION";

export class LiveCookError extends Error {
  constructor(
    readonly code: LiveCookErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LiveCookError";
  }
}

export interface LiveCookRepository {
  activateSession(sessionId: string, command: LiveCookCommand): LiveCookProjection;
  findActive(): LiveCookProjection | undefined;
  get(sessionId: string): LiveCookProjection;
  getActive(): LiveCookProjection;
  addNote(sessionId: string, note: string): LiveCookProjection;
  command(action: LiveCookAction, command: LiveCookCommand, sessionId: string): LiveCookProjection;
}

const systemClock: UtcClock = Object.freeze({
  now: () => new Date(),
});

export function createLiveCookRepository(
  persistence: PersistenceContext,
  clock: UtcClock = systemClock,
): LiveCookRepository {
  const { database } = persistence;

  function readDraftSteps(draftId: string): DraftStepRow[] {
    return database
      .query<DraftStepRow, [string]>(
        `SELECT id, ordinal, title, instructions, duration_minutes
         FROM live_cook_draft_steps
         WHERE draft_id = ?
         ORDER BY ordinal ASC`,
      )
      .all(draftId);
  }

  function readProjection(sessionId: string): LiveCookProjection {
    const session = database
      .query<SessionRow, [string]>(
        `SELECT id, status, current_step_id, activated_at
         FROM live_cook_sessions
         WHERE id = ?`,
      )
      .get(sessionId);
    if (!session) throw new Error(`Live-cook session disappeared during transaction: ${sessionId}`);

    const steps = database
      .query<SessionStepRow, [string]>(
        `SELECT id, ordinal, title, instructions, duration_minutes
         FROM live_cook_session_steps
         WHERE session_id = ?
         ORDER BY ordinal ASC`,
      )
      .all(session.id);
    const projectedAt = timestampFrom(clock);
    const transitions = database
      .query<TransitionRow, [string]>(
        `SELECT action, occurred_at
         FROM live_cook_transitions
         WHERE session_id = ?
         ORDER BY ordinal ASC`,
      )
      .all(session.id);
    const visits = database
      .query<ExecutionVisitRow, [string]>(
        `SELECT id, session_step_id, ordinal, actual_started_at, actual_finished_at, cancelled_at
         FROM live_cook_execution_visits
         WHERE session_id = ?
         ORDER BY ordinal ASC`,
      )
      .all(session.id)
      .map((visit) => ({
        id: visit.id,
        sessionStepId: visit.session_step_id,
        ordinal: visit.ordinal,
        actualStartedAt: visit.actual_started_at,
        actualFinishedAt: visit.actual_finished_at,
        cancelledAt: visit.cancelled_at,
        elapsedSeconds: calculateElapsedSeconds(
          visit.actual_started_at,
          visit.actual_finished_at ?? visit.cancelled_at ?? projectedAt,
          transitions,
        ),
        notes: database
          .query<StepNoteRow, [string]>(
            `SELECT id, ordinal, content, created_at
             FROM live_cook_step_notes
             WHERE execution_visit_id = ?
             ORDER BY ordinal ASC`,
          )
          .all(visit.id)
          .map((note) => ({
            id: note.id,
            ordinal: note.ordinal,
            content: note.content,
            createdAt: note.created_at,
          })),
      }));

    const executionHistory = visits.map(({ sessionStepId, ...visit }) => {
      const step = steps.find(({ id }) => id === sessionStepId);
      if (!step) throw new Error(`Execution visit references a missing snapshot step: ${visit.id}`);
      return { ...visit, step: toStep(step) };
    });

    const currentStep =
      session.status === "ACTIVE" || session.status === "PAUSED"
        ? readCurrentStep(session.current_step_id, steps, visits)
        : null;
    const nextStep = currentStep ? (steps.find(({ ordinal }) => ordinal === currentStep.ordinal + 1) ?? null) : null;
    const progressStep = currentStep ?? executionHistory.at(-1)?.step;
    if (!progressStep || steps.length === 0) throw new Error(`Live-cook session has no progress step: ${session.id}`);
    const plan = createSessionRepository(persistence).get(session.id);
    if (!plan) throw new Error(`Live-cook session has no persisted plan: ${session.id}`);

    return {
      id: session.id,
      status: session.status,
      activatedAt: session.activated_at,
      projectedAt,
      plan,
      currentStep,
      nextStep: nextStep ? toStep(nextStep) : null,
      progress: {
        currentStepOrdinal: progressStep.ordinal,
        totalSteps: steps.length,
        percent: Math.round(((progressStep.ordinal + 1) / steps.length) * 100),
      },
      executionHistory,
    };
  }

  function readCurrentStep(
    currentStepId: string | null,
    steps: readonly SessionStepRow[],
    visits: readonly {
      readonly id: string;
      readonly sessionStepId: string;
      readonly ordinal: number;
      readonly actualStartedAt: string;
      readonly actualFinishedAt: string | null;
      readonly cancelledAt: string | null;
      readonly elapsedSeconds: number;
      readonly notes: LiveCookProjection["executionHistory"][number]["notes"];
    }[],
  ): NonNullable<LiveCookProjection["currentStep"]> {
    if (!currentStepId) throw new Error("Live-cook session has no cursor");
    const step = steps.find(({ id }) => id === currentStepId);
    if (!step) throw new Error(`Live-cook cursor references a missing snapshot step: ${currentStepId}`);
    const execution = visits.find(
      (visit) => visit.sessionStepId === currentStepId && visit.actualFinishedAt === null && visit.cancelledAt === null,
    );
    if (!execution) throw new Error(`Live-cook cursor has no open execution visit: ${currentStepId}`);

    const { sessionStepId: _, ...currentExecution } = execution;
    return { ...toStep(step), execution: currentExecution };
  }

  function findSession(sessionId: string): SessionRow | undefined {
    return (
      database
        .query<SessionRow, [string]>(
          `SELECT id, status, current_step_id, activated_at
         FROM live_cook_sessions
         WHERE id = ?`,
        )
        .get(sessionId) ?? undefined
    );
  }

  function requireSession(sessionId: string): SessionRow {
    const session = findSession(sessionId);
    if (!session) throw new LiveCookError("NOT_FOUND", "Cooking session not found");
    return session;
  }

  function findActiveSession(): SessionRow | undefined {
    return (
      database
        .query<SessionRow, []>(
          `SELECT id, status, current_step_id, activated_at
         FROM live_cook_sessions
         WHERE status IN ('ACTIVE', 'PAUSED')
         LIMIT 1`,
        )
        .get() ?? undefined
    );
  }

  function requireActiveSession(): SessionRow {
    const session = findActiveSession();
    if (!session) throw new LiveCookError("NOT_FOUND", "No active live-cook session exists");
    return session;
  }

  function appendTransition(
    session: SessionRow,
    action: string,
    toStatus: LiveCookProjection["status"],
    timestamp: string,
  ): void {
    const ordinal = database
      .query<{ count: number }, [string]>("SELECT COUNT(*) AS count FROM live_cook_transitions WHERE session_id = ?")
      .get(session.id)?.count;
    if (ordinal === undefined) throw new Error(`Could not allocate transition ordinal for session: ${session.id}`);
    database.run(
      `INSERT INTO live_cook_transitions
       (id, session_id, ordinal, action, from_status, to_status, occurred_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), session.id, ordinal, action, session.status, toStatus, timestamp],
    );
  }

  function currentStepAndVisit(session: SessionRow): { step: SessionStepRow; visitId: string } {
    if (!session.current_step_id) throw new Error(`Live-cook session has no cursor: ${session.id}`);
    const step = database
      .query<SessionStepRow, [string]>(
        `SELECT id, ordinal, title, instructions, duration_minutes
         FROM live_cook_session_steps
         WHERE id = ?`,
      )
      .get(session.current_step_id);
    if (!step) throw new Error(`Live-cook cursor references a missing step: ${session.current_step_id}`);
    const visit = database
      .query<{ id: string }, [string, string]>(
        `SELECT id FROM live_cook_execution_visits
         WHERE session_id = ? AND session_step_id = ? AND actual_finished_at IS NULL AND cancelled_at IS NULL
         ORDER BY ordinal DESC LIMIT 1`,
      )
      .get(session.id, step.id);
    if (!visit) throw new Error(`Live-cook cursor has no open visit: ${step.id}`);
    return { step, visitId: visit.id };
  }

  function addNote(visitId: string, note: string | undefined, timestamp: string): void {
    if (!note) return;
    const ordinal = database
      .query<{ count: number }, [string]>(
        "SELECT COUNT(*) AS count FROM live_cook_step_notes WHERE execution_visit_id = ?",
      )
      .get(visitId)?.count;
    if (ordinal === undefined) throw new Error(`Could not allocate note ordinal for execution visit: ${visitId}`);
    database.run(
      `INSERT INTO live_cook_step_notes (id, execution_visit_id, ordinal, content, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), visitId, ordinal, note, timestamp],
    );
  }

  function enterStep(session: SessionRow, target: SessionStepRow, visitId: string, timestamp: string): string {
    const ordinal = database
      .query<{ count: number }, [string]>(
        "SELECT COUNT(*) AS count FROM live_cook_execution_visits WHERE session_id = ?",
      )
      .get(session.id)?.count;
    if (ordinal === undefined) throw new Error(`Could not allocate execution ordinal for session: ${session.id}`);
    database.run("UPDATE live_cook_execution_visits SET actual_finished_at = ? WHERE id = ?", [timestamp, visitId]);
    const targetVisitId = randomUUID();
    database.run(
      `INSERT INTO live_cook_execution_visits
       (id, session_id, session_step_id, ordinal, actual_started_at)
       VALUES (?, ?, ?, ?, ?)`,
      [targetVisitId, session.id, target.id, ordinal, timestamp],
    );
    database.run("UPDATE live_cook_sessions SET current_step_id = ?, updated_at = ? WHERE id = ?", [
      target.id,
      timestamp,
      session.id,
    ]);
    return targetVisitId;
  }

  function activatePreparedDraft(draftId: string, command: LiveCookCommand): LiveCookProjection {
    return persistence.transaction(() => {
      const draft = database
        .query<DraftRow, [string]>("SELECT id, activated_at FROM live_cook_drafts WHERE id = ?")
        .get(draftId);
      if (!draft) throw new LiveCookError("NOT_FOUND", "Live-cook draft not found");
      if (draft.activated_at !== null)
        throw new LiveCookError("INVALID_DRAFT", "Live-cook draft has already been activated");

      const draftSteps = readDraftSteps(draft.id);
      if (!isValidDraftSteps(draftSteps)) {
        throw new LiveCookError("INVALID_DRAFT", "Live-cook draft has no valid ordered steps");
      }

      const timestamp = timestampFrom(clock);
      const sessionId = draft.id;
      try {
        database.run(
          `INSERT INTO live_cook_sessions (id, draft_id, status, current_step_id, activated_at, updated_at)
           VALUES (?, ?, 'ACTIVE', NULL, ?, ?)`,
          [sessionId, draft.id, timestamp, timestamp],
        );
      } catch (error) {
        if (isLiveSessionConflict(error)) {
          throw new LiveCookError("ACTIVE_SESSION_CONFLICT", "Another live-cook session is already active");
        }
        throw error;
      }

      const sessionSteps = draftSteps.map((step) => ({ ...step, id: randomUUID() }));
      for (const step of sessionSteps) {
        database.run(
          `INSERT INTO live_cook_session_steps
           (id, session_id, ordinal, title, instructions, duration_minutes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [step.id, sessionId, step.ordinal, step.title, step.instructions, step.duration_minutes],
        );
      }

      const firstStep = sessionSteps[0];
      if (!firstStep) throw new Error("Validated live-cook draft unexpectedly has no first step");
      const visitId = randomUUID();
      database.run("UPDATE live_cook_sessions SET current_step_id = ? WHERE id = ?", [firstStep.id, sessionId]);
      database.run("UPDATE live_cook_drafts SET activated_at = ? WHERE id = ?", [timestamp, draft.id]);
      database.run(
        `INSERT INTO live_cook_transitions
         (id, session_id, ordinal, action, from_status, to_status, occurred_at)
         VALUES (?, ?, 0, 'ACTIVATE', NULL, 'ACTIVE', ?)`,
        [randomUUID(), sessionId, timestamp],
      );
      database.run(
        `INSERT INTO live_cook_execution_visits
         (id, session_id, session_step_id, ordinal, actual_started_at)
         VALUES (?, ?, ?, 0, ?)`,
        [visitId, sessionId, firstStep.id, timestamp],
      );
      if (command.note) {
        database.run(
          `INSERT INTO live_cook_step_notes (id, execution_visit_id, ordinal, content, created_at)
           VALUES (?, ?, 0, ?, ?)`,
          [randomUUID(), visitId, command.note, timestamp],
        );
      }

      return readProjection(sessionId);
    });
  }

  const repository: LiveCookRepository = {
    activateSession(sessionId: string, command: LiveCookCommand): LiveCookProjection {
      return persistence.transaction(() => {
        const session = createSessionRepository(persistence).get(sessionId);
        if (!session) throw new LiveCookError("NOT_FOUND", "Cooking session not found");
        const existingDraft = database
          .query<{ id: string }, [string]>("SELECT id FROM live_cook_drafts WHERE id = ?")
          .get(session.id);
        if (existingDraft) throw new LiveCookError("INVALID_DRAFT", "Cooking session has already been activated");

        const steps = session.phases
          .flatMap((phase) => phase.steps)
          .map((step, ordinal) => ({
            id: step.id,
            ordinal,
            title: step.title,
            instructions: step.instructions,
            duration_minutes: step.durationMinutes,
          }));
        if (!isValidDraftSteps(steps)) {
          throw new LiveCookError("INVALID_DRAFT", "Cooking session has no valid ordered steps");
        }

        database.run("INSERT INTO live_cook_drafts (id, created_at) VALUES (?, ?)", [session.id, session.createdAt]);
        for (const step of steps) {
          database.run(
            `INSERT INTO live_cook_draft_steps
             (id, draft_id, ordinal, title, instructions, duration_minutes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [randomUUID(), session.id, step.ordinal, step.title, step.instructions, step.duration_minutes],
          );
        }
        return activatePreparedDraft(session.id, command);
      });
    },

    findActive(): LiveCookProjection | undefined {
      const session = findActiveSession();
      return session ? readProjection(session.id) : undefined;
    },

    get(sessionId: string): LiveCookProjection {
      return readProjection(requireSession(sessionId).id);
    },

    getActive(): LiveCookProjection {
      return readProjection(requireActiveSession().id);
    },

    addNote(sessionId: string, note: string): LiveCookProjection {
      return persistence.transaction(() => {
        const session = requireSession(sessionId);
        if (session.status !== "ACTIVE" && session.status !== "PAUSED") {
          throw new LiveCookError("INVALID_TRANSITION", "Notes require an active or paused cooking session");
        }
        const { visitId } = currentStepAndVisit(session);
        addNote(visitId, note, timestampFrom(clock));
        return readProjection(session.id);
      });
    },

    command(action: LiveCookAction, command: LiveCookCommand, sessionId: string): LiveCookProjection {
      return persistence.transaction(() => {
        const session = requireSession(sessionId);
        if (session.status === "COMPLETED" || session.status === "CANCELLED") {
          throw new LiveCookError("INVALID_TRANSITION", "Terminal live-cook sessions cannot accept commands");
        }

        if (action === "pause") {
          if (session.status !== "ACTIVE")
            throw new LiveCookError("INVALID_TRANSITION", "Only active sessions can pause");
          const timestamp = timestampFrom(clock);
          database.run("UPDATE live_cook_sessions SET status = 'PAUSED', updated_at = ? WHERE id = ?", [
            timestamp,
            session.id,
          ]);
          appendTransition(session, "PAUSE", "PAUSED", timestamp);
          return readProjection(session.id);
        }
        if (action === "resume") {
          if (session.status !== "PAUSED")
            throw new LiveCookError("INVALID_TRANSITION", "Only paused sessions can resume");
          const timestamp = timestampFrom(clock);
          database.run("UPDATE live_cook_sessions SET status = 'ACTIVE', updated_at = ? WHERE id = ?", [
            timestamp,
            session.id,
          ]);
          appendTransition(session, "RESUME", "ACTIVE", timestamp);
          return readProjection(session.id);
        }
        if (session.status !== "ACTIVE" && action !== "cancel") {
          throw new LiveCookError("INVALID_TRANSITION", "This command requires an active live-cook session");
        }

        const { step, visitId } = currentStepAndVisit(session);
        if (action === "advance" || action === "return") {
          const targetOrdinal = action === "advance" ? step.ordinal + 1 : step.ordinal - 1;
          const target = database
            .query<SessionStepRow, [string, number]>(
              `SELECT id, ordinal, title, instructions, duration_minutes
               FROM live_cook_session_steps
               WHERE session_id = ? AND ordinal = ?`,
            )
            .get(session.id, targetOrdinal);
          if (!target) {
            throw new LiveCookError("INVALID_TRANSITION", `Cannot ${action} at the live-cook step boundary`);
          }
          const timestamp = timestampFrom(clock);
          const targetVisitId = enterStep(session, target, visitId, timestamp);
          appendTransition(session, action === "advance" ? "ADVANCE" : "RETURN", "ACTIVE", timestamp);
          addNote(targetVisitId, command.note, timestamp);
          return readProjection(session.id);
        }

        if (action === "complete") {
          const successor = database
            .query<{ id: string }, [string, number]>(
              "SELECT id FROM live_cook_session_steps WHERE session_id = ? AND ordinal = ?",
            )
            .get(session.id, step.ordinal + 1);
          if (successor) throw new LiveCookError("INVALID_TRANSITION", "Only the final step can complete");
          const timestamp = timestampFrom(clock);
          database.run("UPDATE live_cook_execution_visits SET actual_finished_at = ? WHERE id = ?", [
            timestamp,
            visitId,
          ]);
          database.run("UPDATE live_cook_sessions SET status = 'COMPLETED', updated_at = ? WHERE id = ?", [
            timestamp,
            session.id,
          ]);
          appendTransition(session, "COMPLETE", "COMPLETED", timestamp);
          addNote(visitId, command.note, timestamp);
          return readProjection(session.id);
        }

        if (action === "cancel") {
          const timestamp = timestampFrom(clock);
          database.run("UPDATE live_cook_execution_visits SET cancelled_at = ? WHERE id = ?", [timestamp, visitId]);
          database.run("UPDATE live_cook_sessions SET status = 'CANCELLED', updated_at = ? WHERE id = ?", [
            timestamp,
            session.id,
          ]);
          appendTransition(session, "CANCEL", "CANCELLED", timestamp);
          addNote(visitId, command.note, timestamp);
          return readProjection(session.id);
        }

        throw new Error(`Unhandled live-cook action: ${action}`);
      });
    },
  };

  return repository;
}

function toStep(step: {
  readonly id: string;
  readonly ordinal: number;
  readonly title: string;
  readonly instructions: string;
  readonly duration_minutes: number;
}) {
  return {
    id: step.id,
    ordinal: step.ordinal,
    title: step.title,
    instructions: step.instructions,
    durationMinutes: step.duration_minutes,
  };
}

function isValidDraftSteps(steps: readonly DraftStepRow[]): boolean {
  return (
    steps.length > 0 &&
    steps.every(
      (step, index) =>
        typeof step.id === "string" &&
        step.id.trim().length > 0 &&
        Number.isInteger(step.ordinal) &&
        step.ordinal === index &&
        typeof step.title === "string" &&
        step.title.trim().length > 0 &&
        typeof step.instructions === "string" &&
        step.instructions.trim().length > 0 &&
        Number.isInteger(step.duration_minutes) &&
        step.duration_minutes >= 1 &&
        step.duration_minutes <= 1440,
    )
  );
}

function calculateElapsedSeconds(startedAt: string, endedAt: string, transitions: readonly TransitionRow[]): number {
  const startedMilliseconds = Date.parse(startedAt);
  const endedMilliseconds = Date.parse(endedAt);
  let pausedAt: number | undefined;
  let pausedMilliseconds = 0;

  for (const transition of transitions) {
    const occurredMilliseconds = Date.parse(transition.occurred_at);
    if (occurredMilliseconds < startedMilliseconds || occurredMilliseconds > endedMilliseconds) continue;
    if (transition.action === "PAUSE" && pausedAt === undefined) pausedAt = occurredMilliseconds;
    if (transition.action === "RESUME" && pausedAt !== undefined) {
      pausedMilliseconds += occurredMilliseconds - pausedAt;
      pausedAt = undefined;
    }
  }
  if (pausedAt !== undefined) pausedMilliseconds += endedMilliseconds - pausedAt;

  return Math.max(0, Math.floor((endedMilliseconds - startedMilliseconds - pausedMilliseconds) / 1000));
}

function timestampFrom(clock: UtcClock): string {
  return clock.now().toISOString();
}

function isLiveSessionConflict(error: unknown): boolean {
  return error instanceof Error && error.message.includes("one_live_cook_session");
}
