
import { getGoalById } from "@/database/goalRepository";
import { getTasksByGoalId } from "@/database/taskRepository";

import {
  simulateGoalFeasibility,
  type WhatIfSimulationOverrides,
  type WhatIfSimulationResult,
} from "@/services/whatIfSimulationService";

/**
 * Read a goal and its tasks from SQLite, then calculate
 * the original and simulated feasibility results.
 *
 * This function is read-only. It does not update SQLite
 * or modify Zustand stores.
 */
export async function getGoalWhatIfSimulation(
  goalId: string,
  overrides: WhatIfSimulationOverrides,
  asOfDate: Date = new Date()
): Promise<WhatIfSimulationResult | null> {
  const goal = await getGoalById(goalId);

  if (!goal) {
    return null;
  }

  const tasks = await getTasksByGoalId(goalId);

  return simulateGoalFeasibility(
    goal,
    tasks,
    overrides,
    asOfDate
  );
}
