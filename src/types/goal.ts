
export type GoalCategory =
  | "Personal"
  | "Academic"
  | "Career"
  | "Health"
  | "Finance"
  | "Other";

export type GoalPriority = "low" | "medium" | "high";

export type GoalStatus = "active" | "completed" | "archived";

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;
  start_date: string | null;
  deadline: string | null;
  estimated_duration: number;
  daily_available_hours: number;
  progress: number;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  category?: GoalCategory;
  priority?: GoalPriority;
  start_date?: string;
  deadline?: string;
  estimated_duration?: number;
  daily_available_hours?: number;
  ai_generated?: boolean;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string | null;
  category?: GoalCategory;
  priority?: GoalPriority;
  status?: GoalStatus;
  start_date?: string | null;
  deadline?: string | null;
  estimated_duration?: number;
  daily_available_hours?: number;
  progress?: number;
}
