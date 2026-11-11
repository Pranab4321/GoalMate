
import type { Request, Response } from "express";
import { generateGoalPlan } from "../services/goalPlanningService.js";
import type {
  GoalPlanningRequest,
  AITaskPriority,
} from "../types/ai.js";

function isPriority(value: unknown): value is AITaskPriority {
  return value === "low" || value === "medium" || value === "high";
}

export async function generateGoalPlanning(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const body: unknown = req.body;

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      res.status(400).json({
        success: false,
        message: "A valid goal planning request is required.",
      });
      return;
    }

    const data = body as Record<string, unknown>;

    const {
      goalTitle,
      goalDescription,
      category,
      priority,
      startDate,
      deadline,
      estimatedDurationDays,
      dailyAvailableHours,
    } = data;

    if (
      typeof goalTitle !== "string" ||
      !goalTitle.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      !isPriority(priority) ||
      typeof startDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(startDate)
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide valid goal details.",
      });
      return;
    }

    if (
      goalDescription !== undefined &&
      typeof goalDescription !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Goal description must be a string.",
      });
      return;
    }

    if (
      deadline !== undefined &&
      (typeof deadline !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(deadline))
    ) {
      res.status(400).json({
        success: false,
        message: "Please provide a valid deadline.",
      });
      return;
    }

    if (
      typeof estimatedDurationDays !== "number" ||
      !Number.isInteger(estimatedDurationDays) ||
      estimatedDurationDays < 1 ||
      estimatedDurationDays > 3650
    ) {
      res.status(400).json({
        success: false,
        message: "Estimated duration must be between 1 and 3650 days.",
      });
      return;
    }

    if (
      typeof dailyAvailableHours !== "number" ||
      !Number.isFinite(dailyAvailableHours) ||
      dailyAvailableHours <= 0 ||
      dailyAvailableHours > 24
    ) {
      res.status(400).json({
        success: false,
        message: "Daily availability must be greater than 0 and no more than 24 hours.",
      });
      return;
    }

    if (
      deadline !== undefined &&
      deadline < startDate
    ) {
      res.status(400).json({
        success: false,
        message: "Deadline cannot be before the start date.",
      });
      return;
    }

    const request: GoalPlanningRequest = {
      goalTitle: goalTitle.trim(),
      goalDescription:
        typeof goalDescription === "string"
          ? goalDescription.trim()
          : undefined,
      category: category.trim(),
      priority,
      startDate,
      deadline: typeof deadline === "string" ? deadline : undefined,
      estimatedDurationDays,
      dailyAvailableHours,
    };

    const plan = await generateGoalPlan(request);

    res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error("Goal Planning Controller Error:", error);

    res.status(503).json({
      success: false,
      message:
        "Unable to generate your goal plan right now. Please try again later.",
    });
  }
}
