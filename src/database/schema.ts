
import type { SQLiteDatabase } from "expo-sqlite";

export async function createTables(
  db: SQLiteDatabase
): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    -- =====================================
    -- GOALS TABLE
    -- =====================================

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,

      title TEXT NOT NULL,
      description TEXT,

      category TEXT NOT NULL DEFAULT 'Personal',

      priority TEXT NOT NULL DEFAULT 'medium'
        CHECK(priority IN ('low', 'medium', 'high')),

      status TEXT NOT NULL DEFAULT 'active'
        CHECK(status IN ('active', 'completed', 'archived')),

      start_date TEXT,
      deadline TEXT,

      estimated_duration INTEGER DEFAULT 0,
      daily_available_hours REAL NOT NULL DEFAULT 2,

      progress REAL NOT NULL DEFAULT 0
        CHECK(progress >= 0 AND progress <= 100),

      ai_generated INTEGER NOT NULL DEFAULT 0
        CHECK(ai_generated IN (0, 1)),

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );


    -- =====================================
    -- TASKS TABLE
    -- =====================================

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,

      goal_id TEXT,

      title TEXT NOT NULL,
      description TEXT,

      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),

      difficulty TEXT NOT NULL DEFAULT 'medium'
        CHECK(difficulty IN ('easy', 'medium', 'hard')),

      priority TEXT NOT NULL DEFAULT 'medium'
        CHECK(priority IN ('low', 'medium', 'high')),

      scheduled_date TEXT,
      scheduled_time TEXT,

      deadline TEXT,

      estimated_duration INTEGER DEFAULT 0,
      actual_duration INTEGER DEFAULT 0,

      completed_at TEXT,

      ai_generated INTEGER NOT NULL DEFAULT 0
        CHECK(ai_generated IN (0, 1)),

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (goal_id)
        REFERENCES goals(id)
        ON DELETE CASCADE
    );


    -- =====================================
    -- FOCUS SESSIONS TABLE
    -- =====================================

    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY NOT NULL,

      task_id TEXT,

      start_time TEXT NOT NULL,
      end_time TEXT,

      duration INTEGER NOT NULL DEFAULT 0,

      session_type TEXT NOT NULL DEFAULT 'focus'
        CHECK(session_type IN ('focus', 'short_break', 'long_break')),

      status TEXT NOT NULL DEFAULT 'completed'
        CHECK(status IN ('completed', 'interrupted', 'cancelled')),

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (task_id)
        REFERENCES tasks(id)
        ON DELETE SET NULL
    );


    -- =====================================
    -- DAILY ACTIVITY TABLE
    -- =====================================

    CREATE TABLE IF NOT EXISTS daily_activity (
      id TEXT PRIMARY KEY NOT NULL,

      activity_date TEXT NOT NULL UNIQUE,

      tasks_completed INTEGER NOT NULL DEFAULT 0,
      tasks_created INTEGER NOT NULL DEFAULT 0,

      focus_minutes INTEGER NOT NULL DEFAULT 0,

      goals_completed INTEGER NOT NULL DEFAULT 0,

      productivity_score REAL NOT NULL DEFAULT 0,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );


    -- =====================================
    -- USER SETTINGS TABLE
    -- =====================================

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),

      user_name TEXT DEFAULT '',
      user_email TEXT DEFAULT '',

      theme TEXT NOT NULL DEFAULT 'system'
        CHECK(theme IN ('light', 'dark', 'system')),

      notifications_enabled INTEGER NOT NULL DEFAULT 1
        CHECK(notifications_enabled IN (0, 1)),

      daily_reminder_enabled INTEGER NOT NULL DEFAULT 1
        CHECK(daily_reminder_enabled IN (0, 1)),

      daily_reminder_time TEXT DEFAULT '08:00',

      pomodoro_duration INTEGER NOT NULL DEFAULT 25,
      short_break_duration INTEGER NOT NULL DEFAULT 5,
      long_break_duration INTEGER NOT NULL DEFAULT 15,

      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );


    -- =====================================
    -- DATABASE INDEXES
    -- =====================================

    CREATE INDEX IF NOT EXISTS idx_goals_status
    ON goals(status);

    CREATE INDEX IF NOT EXISTS idx_goals_deadline
    ON goals(deadline);

    CREATE INDEX IF NOT EXISTS idx_tasks_goal_id
    ON tasks(goal_id);

    CREATE INDEX IF NOT EXISTS idx_tasks_status
    ON tasks(status);

    CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date
    ON tasks(scheduled_date);

    CREATE INDEX IF NOT EXISTS idx_focus_task_id
    ON focus_sessions(task_id);

    CREATE INDEX IF NOT EXISTS idx_focus_start_time
    ON focus_sessions(start_time);

    CREATE INDEX IF NOT EXISTS idx_activity_date
    ON daily_activity(activity_date);
  `);

  // Safely add the per-goal availability column to existing installations.
  // New installations already have this column from CREATE TABLE above.
  const goalColumns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(goals);"
  );

  const hasDailyAvailability = goalColumns.some(
    (column) => column.name === "daily_available_hours"
  );

  if (!hasDailyAvailability) {
    await db.execAsync(
      "ALTER TABLE goals ADD COLUMN daily_available_hours REAL NOT NULL DEFAULT 2;"
    );
  }
}
