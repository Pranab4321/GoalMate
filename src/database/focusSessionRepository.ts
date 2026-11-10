
import { getDatabase } from "./database";
import type {
  FocusSession,
  CreateFocusSessionInput,
  UpdateFocusSessionInput,
} from "@/types/focusSession";

/**
 * Create a new focus session.
 */
export async function createFocusSession(
  input: CreateFocusSessionInput
): Promise<string> {
  const db = await getDatabase();

  const id = `focus_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  await db.runAsync(
    `INSERT INTO focus_sessions (
      id,
      task_id,
      start_time,
      end_time,
      duration,
      session_type,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.task_id ?? null,
      input.start_time,
      input.end_time ?? null,
      input.duration ?? 0,
      input.session_type ?? "focus",
      input.status ?? "completed",
    ]
  );

  return id;
}

/**
 * Retrieve all focus sessions.
 */
export async function getAllFocusSessions(): Promise<FocusSession[]> {
  const db = await getDatabase();

  return db.getAllAsync<FocusSession>(
    `SELECT * FROM focus_sessions ORDER BY start_time DESC`
  );
}

/**
 * Retrieve focus sessions belonging to a task.
 */
export async function getFocusSessionsByTaskId(
  taskId: string
): Promise<FocusSession[]> {
  const db = await getDatabase();

  return db.getAllAsync<FocusSession>(
    `SELECT * FROM focus_sessions
     WHERE task_id = ?
     ORDER BY start_time DESC`,
    [taskId]
  );
}

/**
 * Update an existing focus session.
 */
export async function updateFocusSession(
  id: string,
  input: UpdateFocusSessionInput
): Promise<void> {
  const db = await getDatabase();

  const allowedFields = [
    "task_id",
    "end_time",
    "duration",
    "session_type",
    "status",
  ];

  const validFields = Object.entries(input).filter(
    ([key, value]) =>
      allowedFields.includes(key) && value !== undefined
  );

  if (validFields.length === 0) return;

  const setClause = validFields
    .map(([key]) => `${key} = ?`)
    .join(", ");

  const values = validFields.map(([, value]) => value ?? null);

  await db.runAsync(
    `UPDATE focus_sessions
     SET ${setClause}
     WHERE id = ?`,
    [...values, id]
  );
}

/**
 * Delete a focus session.
 */
export async function deleteFocusSession(id: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `DELETE FROM focus_sessions WHERE id = ?`,
    [id]
  );
}

/**
 * Get total focus minutes.
 * Only completed focus sessions are included.
 */
export async function getTotalFocusMinutes(): Promise<number> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(duration) AS total
     FROM focus_sessions
     WHERE session_type = 'focus'
       AND status = 'completed'`
  );

  return result?.total ?? 0;
}

/**
 * Get total focus minutes for a specific date.
 * Date format: YYYY-MM-DD
 */
export async function getDailyFocusMinutes(
  date: string
): Promise<number> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ total: number | null }>(
    `SELECT SUM(duration) AS total
     FROM focus_sessions
     WHERE session_type = 'focus'
       AND status = 'completed'
       AND date(start_time) = date(?)`,
    [date]
  );

  return result?.total ?? 0;
}
