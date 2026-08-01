import { randomUUID } from "node:crypto";
import type { SessionRead, SessionWrite } from "../session-contract";
import type { PersistenceContext } from "./repository-context";

interface SessionRow {
  readonly id: string;
  readonly title: string;
  readonly cooking_date: string;
  readonly dome_min_f: number;
  readonly dome_max_f: number;
  readonly food_target_f: number | null;
  readonly setup_guidance: string;
  readonly deflector_guidance: string;
  readonly heat_zone_guidance: string;
  readonly vent_guidance: string;
  readonly prep_notes: string;
  readonly status: "draft";
  readonly created_at: string;
  readonly updated_at: string;
}

interface PhaseRow {
  readonly id: string;
  readonly title: string;
  readonly technique: string;
  readonly transition_guidance: string;
}

interface StepRow {
  readonly id: string;
  readonly title: string;
  readonly instructions: string;
  readonly duration_minutes: number;
}

export interface SessionRepository {
  create(draft: SessionWrite): SessionRead;
  get(id: string): SessionRead | undefined;
  list(): SessionRead[];
  update(id: string, draft: SessionWrite): SessionRead | undefined;
  delete(id: string): boolean;
}

export function createSessionRepository(persistence: PersistenceContext): SessionRepository {
  const { database } = persistence;

  function get(id: string): SessionRead | undefined {
    const session = database.query<SessionRow, [string]>("SELECT * FROM cooking_sessions WHERE id = ?").get(id);
    if (!session) return undefined;

    const phases = database
      .query<PhaseRow, [string]>(
        `SELECT id, title, technique, transition_guidance
         FROM cooking_session_phases
         WHERE session_id = ?
         ORDER BY ordinal ASC`,
      )
      .all(id)
      .map((phase) => ({
        id: phase.id,
        title: phase.title,
        technique: phase.technique,
        transitionGuidance: phase.transition_guidance,
        steps: database
          .query<StepRow, [string]>(
            `SELECT id, title, instructions, duration_minutes
             FROM cooking_session_steps
             WHERE phase_id = ?
             ORDER BY ordinal ASC`,
          )
          .all(phase.id)
          .map((step) => ({
            id: step.id,
            title: step.title,
            instructions: step.instructions,
            durationMinutes: step.duration_minutes,
          })),
      }));

    return {
      id: session.id,
      title: session.title,
      cookingDate: session.cooking_date,
      plannedDomeRange: { minF: session.dome_min_f, maxF: session.dome_max_f },
      ...(session.food_target_f === null ? {} : { plannedFoodTargetF: session.food_target_f }),
      setupGuidance: session.setup_guidance,
      deflectorGuidance: session.deflector_guidance,
      heatZoneGuidance: session.heat_zone_guidance,
      ventGuidance: session.vent_guidance,
      prepNotes: session.prep_notes,
      status: session.status,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      phases,
    };
  }

  function insertChildren(sessionId: string, draft: SessionWrite): void {
    draft.phases.forEach((phase, phaseOrdinal) => {
      const phaseId = randomUUID();
      database.run(
        `INSERT INTO cooking_session_phases
           (id, session_id, ordinal, title, technique, transition_guidance)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [phaseId, sessionId, phaseOrdinal, phase.title, phase.technique, phase.transitionGuidance],
      );

      phase.steps.forEach((step, stepOrdinal) => {
        database.run(
          `INSERT INTO cooking_session_steps
             (id, phase_id, ordinal, title, instructions, duration_minutes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [randomUUID(), phaseId, stepOrdinal, step.title, step.instructions, step.durationMinutes],
        );
      });
    });
  }

  function requireSession(id: string): SessionRead {
    const session = get(id);
    if (!session) throw new Error(`Cooking session disappeared during transaction: ${id}`);
    return session;
  }

  return {
    create(draft) {
      const id = randomUUID();
      const timestamp = new Date().toISOString();

      return persistence.transaction(() => {
        database.run(
          `INSERT INTO cooking_sessions
             (id, title, cooking_date, dome_min_f, dome_max_f, food_target_f,
              setup_guidance, deflector_guidance, heat_zone_guidance, vent_guidance,
              prep_notes, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
          [
            id,
            draft.title,
            draft.cookingDate,
            draft.plannedDomeRange.minF,
            draft.plannedDomeRange.maxF,
            draft.plannedFoodTargetF ?? null,
            draft.setupGuidance,
            draft.deflectorGuidance,
            draft.heatZoneGuidance,
            draft.ventGuidance,
            draft.prepNotes,
            timestamp,
            timestamp,
          ],
        );
        insertChildren(id, draft);
        return requireSession(id);
      });
    },
    get,
    list() {
      return database
        .query<{ id: string }, []>("SELECT id FROM cooking_sessions ORDER BY updated_at DESC, id ASC")
        .all()
        .map(({ id }) => requireSession(id));
    },
    update(id, draft) {
      const existing = get(id);
      if (!existing) return undefined;

      return persistence.transaction(() => {
        database.run("DELETE FROM cooking_session_phases WHERE session_id = ?", [id]);
        insertChildren(id, draft);
        database.run(
          `UPDATE cooking_sessions SET
             title = ?, cooking_date = ?, dome_min_f = ?, dome_max_f = ?, food_target_f = ?,
             setup_guidance = ?, deflector_guidance = ?, heat_zone_guidance = ?, vent_guidance = ?,
             prep_notes = ?, updated_at = ?
           WHERE id = ?`,
          [
            draft.title,
            draft.cookingDate,
            draft.plannedDomeRange.minF,
            draft.plannedDomeRange.maxF,
            draft.plannedFoodTargetF ?? null,
            draft.setupGuidance,
            draft.deflectorGuidance,
            draft.heatZoneGuidance,
            draft.ventGuidance,
            draft.prepNotes,
            nextTimestamp(existing.updatedAt),
            id,
          ],
        );
        return requireSession(id);
      });
    },
    delete(id) {
      return persistence.transaction(() => database.run("DELETE FROM cooking_sessions WHERE id = ?", [id]).changes > 0);
    },
  };
}

function nextTimestamp(previous: string): string {
  const nextMilliseconds = Math.max(Date.now(), Date.parse(previous) + 1);
  return new Date(nextMilliseconds).toISOString();
}
