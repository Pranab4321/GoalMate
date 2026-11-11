
import { API_BASE_URL } from "@/services/api";

import type {
  GoalPlanningRequest,
  AIGoalPlan,
  AIGeneratedTask,
} from "@/types/ai";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidTask(value: unknown): value is AIGeneratedTask {
  if (!isRecord(value)) return false;

  return (
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    ["easy", "medium", "hard"].includes(
      value.difficulty as string
    ) &&
    ["low", "medium", "high"].includes(
      value.priority as string
    ) &&
    typeof value.estimated_duration === "number" &&
    Number.isInteger(value.estimated_duration) &&
    value.estimated_duration > 0
  );
}

export async function generateGoalPlan(
  input: GoalPlanningRequest
): Promise<AIGoalPlan> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/goal-planning/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }
    );
  } catch (error) {
    console.error("Goal planning network error:", error);

    throw new Error(
      "Unable to connect to GoalMate server. Please check your internet connection and try again."
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!isRecord(payload)) {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || payload.success !== true) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "Unable to generate your goal roadmap.";

    throw new Error(message);
  }

  const data = payload.data;

  if (
    !isRecord(data) ||
    typeof data.summary !== "string" ||
    !Array.isArray(data.tasks) ||
    data.tasks.length === 0 ||
    !data.tasks.every(isValidTask)
  ) {
    throw new Error(
      "The AI returned an invalid goal roadmap. Please try again."
    );
  }

  return {
    summary: data.summary,
    tasks: data.tasks,
  };
}
