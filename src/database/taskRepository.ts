
import { getDatabase } from "./database";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/types/task";

function mapTask(row: any): Task {
  return {
    ...row,
    ai_generated: Boolean(row.ai_generated),
  } as Task;
}

/**
 * Create a new task.
 */
export async function createTask(input: CreateTaskInput): Promise<string> {
  const db = await getDatabase();

  const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  await db.runAsync(
    `INSERT INTO tasks (
      id, goal_id, title, description, difficulty,
      priority, scheduled_date, scheduled_time,
      deadline, estimated_duration, ai_generated
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.goal_id ?? null,
      input.title.trim(),
      input.description ?? null,
      input.difficulty ?? "medium",
      input.priority ?? "medium",
      input.scheduled_date ?? null,
      input.scheduled_time ?? null,
      input.deadline ?? null,
      input.estimated_duration ?? 0,
      input.ai_generated ? 1 : 0,
    ]
  );

  return id;
}

/**
 * Retrieve all tasks.
 */
export async function getAllTasks(): Promise<Task[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Task>(
    `SELECT * FROM tasks ORDER BY created_at DESC`
  );

  return rows.map(mapTask);
}

/**
 * Retrieve a task by ID.
 */
export async function getTaskById(id: string): Promise<Task | null> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<Task>(
    `SELECT * FROM tasks WHERE id = ?`,
    [id]
  );

  return row ? mapTask(row) : null;
}

/**
 * Retrieve all tasks belonging to a goal.
 */
export async function getTasksByGoalId(goalId: string): Promise<Task[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Task>(
    `SELECT * FROM tasks
     WHERE goal_id = ?
     ORDER BY created_at DESC`,
    [goalId]
  );

  return rows.map(mapTask);
}

/**
 * Retrieve tasks scheduled for a specific date.
 * Date format: YYYY-MM-DD
 */
export async function getTasksByDate(date: string): Promise<Task[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<Task>(
    `SELECT * FROM tasks
     WHERE scheduled_date = ?
     ORDER BY scheduled_time ASC`,
    [date]
  );

  return rows.map(mapTask);
}

/**
 * Update an existing task.
 */
export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<void> {
  const db = await getDatabase();

  const allowedFields = [
    "goal_id",
    "title",
    "description",
    "status",
    "difficulty",
    "priority",
    "scheduled_date",
    "scheduled_time",
    "deadline",
    "estimated_duration",
    "actual_duration",
    "completed_at",
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
    `UPDATE tasks
     SET ${setClause}, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [...values, id]
  );
}

/**
 * Mark a task as completed.
 */
export async function completeTask(id: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE tasks
     SET status = 'completed',
         completed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [id]
  );
}

/**
 * Delete a task.
 */
export async function deleteTask(id: string): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(
    `DELETE FROM tasks WHERE id = ?`,
    [id]
  );
}

/**
 * Count tasks by status.
 */
export async function getTaskCountByStatus(
  status: Task["status"]
): Promise<number> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM tasks
     WHERE status = ?`,
    [status]
  );

  return result?.count ?? 0;
}
