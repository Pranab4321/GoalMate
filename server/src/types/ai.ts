
export type AITaskDifficulty = "easy" | "medium" | "hard";

export type AITaskPriority = "low" | "medium" | "high";

export interface GoalPlanningRequest {
  goalTitle: string;
  goalDescription?: string;
  category: string;
  priority: AITaskPriority;
  startDate: string;
  deadline?: string;
  estimatedDurationDays: number;
  dailyAvailableHours: number;
}

export interface AIGeneratedTask {
  title: string;
  description: string;
  difficulty: AITaskDifficulty;
  priority: AITaskPriority;
  estimated_duration: number;
}

export interface AIGoalPlan {
  summary: string;
  tasks: AIGeneratedTask[];
}

export interface GoalPlanningResponse {
  success: boolean;
  data?: AIGoalPlan;
  message?: string;
}
