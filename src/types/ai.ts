
import type { GoalCategory, GoalPriority } from "@/types/goal";
import type { TaskDifficulty, TaskPriority } from "@/types/task";

export interface GoalPlanningRequest {
  goalTitle: string;
  goalDescription?: string;
  category: GoalCategory;
  priority: GoalPriority;
  startDate: string;
  deadline?: string;
  estimatedDurationDays: number;
  dailyAvailableHours: number;
}

export interface AIGeneratedTask {
  title: string;
  description: string;
  difficulty: TaskDifficulty;
  priority: TaskPriority;
  estimated_duration: number;
}

export interface AIGoalPlan {
  summary: string;
  tasks: AIGeneratedTask[];
}
