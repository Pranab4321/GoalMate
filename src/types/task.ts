
export type TaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export type TaskDifficulty = "easy" | "medium" | "hard";

export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  difficulty: TaskDifficulty;
  priority: TaskPriority;
  scheduled_date: string | null;
  scheduled_time: string | null;
  deadline: string | null;
  estimated_duration: number;
  actual_duration: number;
  completed_at: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  goal_id?: string | null;
  title: string;
  description?: string;
  difficulty?: TaskDifficulty;
  priority?: TaskPriority;
  scheduled_date?: string;
  scheduled_time?: string;
  deadline?: string;
  estimated_duration?: number;
  ai_generated?: boolean;
}

export interface UpdateTaskInput {
  goal_id?: string | null;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  difficulty?: TaskDifficulty;
  priority?: TaskPriority;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  deadline?: string | null;
  estimated_duration?: number;
  actual_duration?: number;
  completed_at?: string | null;
}
