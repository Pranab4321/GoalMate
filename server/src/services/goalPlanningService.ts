
import { generateAIResponse } from "./aiService.js";
import type {
  GoalPlanningRequest,
  AIGoalPlan,
  AIGeneratedTask,
  AITaskDifficulty,
  AITaskPriority,
} from "../types/ai.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDifficulty(value: unknown): value is AITaskDifficulty {
  return value === "easy" || value === "medium" || value === "hard";
}

function isPriority(value: unknown): value is AITaskPriority {
  return value === "low" || value === "medium" || value === "high";
}

function parseGoalPlan(response: string, dailyAvailableHours: number): AIGoalPlan {
  let jsonText = response.trim();

  // Remove Markdown code fences if Gemini includes them.
  jsonText = jsonText
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Gemini returned an invalid JSON response.");
  }

  if (!isRecord(parsed)) {
    throw new Error("Invalid AI goal plan structure.");
  }

  if (typeof parsed.summary !== "string" || !parsed.summary.trim()) {
    throw new Error("AI goal plan is missing its summary.");
  }

  if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
    throw new Error("AI goal plan does not contain any tasks.");
  }

  if (parsed.tasks.length > 20) {
    throw new Error("AI generated too many tasks. Please try again.");
  }

  const maximumTaskMinutes = Math.floor(dailyAvailableHours * 60);

  const tasks: AIGeneratedTask[] = parsed.tasks.map((item) => {
    if (!isRecord(item)) {
      throw new Error("AI generated an invalid task.");
    }

    const {
      title,
      description,
      difficulty,
      priority,
      estimated_duration,
    } = item;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      throw new Error("An AI task is missing its title or description.");
    }

    if (!isDifficulty(difficulty) || !isPriority(priority)) {
      throw new Error("An AI task contains an invalid difficulty or priority.");
    }

    if (
      typeof estimated_duration !== "number" ||
      !Number.isInteger(estimated_duration) ||
      estimated_duration < 5 ||
      estimated_duration > maximumTaskMinutes
    ) {
      throw new Error("An AI task contains an invalid estimated duration.");
    }

    return {
      title: title.trim(),
      description: description.trim(),
      difficulty,
      priority,
      estimated_duration,
    };
  });

  return {
    summary: parsed.summary.trim(),
    tasks,
  };
}

export async function generateGoalPlan(
  request: GoalPlanningRequest
): Promise<AIGoalPlan> {
  const prompt = `
You are an expert personal productivity and goal-planning assistant.

Create a practical, realistic, step-by-step task roadmap for this goal.

GOAL DETAILS:
Title: ${request.goalTitle}
Description: ${request.goalDescription || "Not provided"}
Category: ${request.category}
Priority: ${request.priority}
Start Date: ${request.startDate}
Deadline: ${request.deadline || "No deadline specified"}
Expected Duration: ${request.estimatedDurationDays} days
Available Working Time: ${request.dailyAvailableHours} hours per day

PLANNING RULES:
1. Break the goal into clear, actionable tasks.
2. Arrange tasks in a logical learning or execution sequence.
3. Make each task achievable within one work session.
4. Each task must take at least 5 minutes and no longer than ${
    Math.floor(request.dailyAvailableHours * 60)
  } minutes.
5. Consider the available daily working hours and overall timeline.
6. Prioritize important foundational tasks.
7. Avoid vague tasks such as "work on goal".
8. Do not invent completed work or claim that the goal is already achieved.
9. Generate between 1 and 20 useful tasks.
10. Estimated task duration must be expressed in minutes.

RESPONSE FORMAT:
Return ONLY valid JSON. Do not include Markdown, code fences, or additional commentary.

Use exactly this structure:

{
  "summary": "A short explanation of the proposed roadmap.",
  "tasks": [
    {
      "title": "Task title",
      "description": "Clear explanation of what to accomplish.",
      "difficulty": "easy",
      "priority": "high",
      "estimated_duration": 60
    }
  ]
}

Allowed difficulty values: easy, medium, hard.
Allowed priority values: low, medium, high.
`;

  const response = await generateAIResponse(prompt, true);
  
  return parseGoalPlan(response, request.dailyAvailableHours);
}
