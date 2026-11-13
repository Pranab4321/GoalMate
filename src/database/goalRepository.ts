
import { getDatabase } from "./database";
import type {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
} from "@/types/goal";

function mapGoal(row: any): Goal {
  return {
    ...row,
    ai_generated: Boolean(row.ai_generated),
    daily_available_hours: Number(row.daily_available_hours ?? 2),
  } as Goal;
}

/**
 * Create a new goal.
 */
export async function createGoal(input: CreateGoalInput): Promise<string> {
  const db = await getDatabase();

  const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  await db.runAsync(
    `INSERT INTO goals (
      id, title, description, category, priority,
      start_date, deadline, estimated_duration,
      daily_available_hours, ai_generated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.title.trim(),
      input.description ?? null,
      input.category ?? "Personal",
      input.priority ?? "medium",
      input.start_date ?? null,
      input.deadline ?? null,
      input.estimated_duration ?? 0,
      input.daily_available_hours ?? 2,
      input.ai_generated ? 1 : 0,
    ]
  );

  return id;
}

/**
 * Retrieve all goals.
 */
export async function getAllGoals(): Promise<Goal[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Goal>(
    `SELECT * FROM goals ORDER BY created_at DESC`
  );

  return rows.map(mapGoal);
}

/**
 * Retrieve a goal by its ID.
 */
export async function getGoalById(id: string): Promise<Goal | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Goal>(
    `SELECT * FROM goals WHERE id = ?`,
    [id]
  );

  return row ? mapGoal(row) : null;
}

/**
 * Update an existing goal.
 */
export async function updateGoal(
  id: string,
  input: UpdateGoalInput
): Promise<void> {
  const db = await getDatabase();

  const fields = Object.entries(input).filter(
    ([, value]) => value !== undefined
  );

  if (fields.length === 0) return;

  const allowedFields = [
    "title",
    "description",
    "category",
    "priority",
    "status",
    "start_date",
    "deadline",
    "estimated_duration",
    "daily_available_hours",
    "progress",
  ];

  const validFields = fields.filter(([key]) =>
    allowedFields.includes(key)
  );

  if (validFields.length === 0) return;

  const setClause = validFields
    .map(([key]) => `${key} = ?`)
    .join(", ");

  const values = validFields.map(([, value]) => value ?? null);

  await db.runAsync(
    `UPDATE goals
     SET ${setClause}, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [...values, id]
  );
}

/**
 * Delete a goal.
 * Associated tasks are automatically deleted by SQLite.
 */
export async function deleteGoal(id: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `DELETE FROM goals WHERE id = ?`,
    [id]
  );
}

/**
 * Update goal progress.
 */
export async function updateGoalProgress(
  id: string,
  progress: number
): Promise<void> {
  const db = await getDatabase();

  const safeProgress = Math.max(0, Math.min(100, progress));

  await db.runAsync(
    `UPDATE goals
     SET progress = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [safeProgress, id]
  );
}
