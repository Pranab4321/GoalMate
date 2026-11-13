import { getGoalById } from "@/database/goalRepository";
import { getTasksByGoalId } from "@/database/taskRepository";
import {
  calculateDeadlineFeasibility,
  type DeadlineFeasibilityResult,
} from "@/services/deadlineFeasibilityService";

/**
 * Load a goal and its tasks from the existing SQLite repositories, then
 * calculate its deadline feasibility using the local calculation engine.
 *
 * Returns null when the goal no longer exists. Database errors are allowed
 * to propagate so the calling screen/store can handle and display them.
 */
export async function getGoalDeadlineFeasibility(
  goalId: string,
  asOfDate: Date = new Date()
): Promise<DeadlineFeasibilityResult | null> {
  const goal = await getGoalById(goalId);

  if (!goal) {
    return null;
  }

  const tasks = await getTasksByGoalId(goalId);

  return calculateDeadlineFeasibility(goal, tasks, asOfDate);
}
