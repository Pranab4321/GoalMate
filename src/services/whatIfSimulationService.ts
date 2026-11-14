import type { Goal } from "@/types/goal";
import type { Task } from "@/types/task";

import {
  calculateDeadlineFeasibility,
  type DeadlineFeasibilityResult,
} from "@/services/deadlineFeasibilityService";

export interface WhatIfSimulationOverrides {
  dailyAvailableHours?: number;
  deadline?: string | null;
}

export interface WhatIfSimulationResult {
  original: DeadlineFeasibilityResult;
  simulated: DeadlineFeasibilityResult;
  changes: {
    dailyAvailableHoursChanged: boolean;
    deadlineChanged: boolean;
  };
}

export function simulateGoalFeasibility(
  goal: Goal,
  tasks: Task[],
  overrides: WhatIfSimulationOverrides,
  asOfDate: Date = new Date()
): WhatIfSimulationResult {
  const hasDailyHoursOverride =
    Object.prototype.hasOwnProperty.call(
      overrides,
      "dailyAvailableHours"
    );

  const hasDeadlineOverride =
    Object.prototype.hasOwnProperty.call(
      overrides,
      "deadline"
    );

  if (!hasDailyHoursOverride && !hasDeadlineOverride) {
    throw new Error(
      "Change daily available hours, the deadline, or both to run a simulation."
    );
  }

  if (hasDailyHoursOverride) {
    const hours = Number(overrides.dailyAvailableHours);

    if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
      throw new Error(
        "Daily available hours must be greater than 0 and no more than 24."
      );
    }
  }

  if (
    hasDeadlineOverride &&
    overrides.deadline !== null &&
    (
      typeof overrides.deadline !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(overrides.deadline)
    )
  ) {
    throw new Error(
      "The simulated deadline must be a valid YYYY-MM-DD date or null."
    );
  }

  const simulatedGoal: Goal = {
    ...goal,

    ...(hasDailyHoursOverride
      ? {
          daily_available_hours: Number(
            overrides.dailyAvailableHours
          ),
        }
      : {}),

    ...(hasDeadlineOverride
      ? {
          deadline: overrides.deadline ?? null,
        }
      : {}),
  };

  return {
    original: calculateDeadlineFeasibility(
      goal,
      tasks,
      asOfDate
    ),

    simulated: calculateDeadlineFeasibility(
      simulatedGoal,
      tasks,
      asOfDate
    ),

    changes: {
      dailyAvailableHoursChanged:
        hasDailyHoursOverride &&
        Number(overrides.dailyAvailableHours) !==
          Number(goal.daily_available_hours),

      deadlineChanged:
        hasDeadlineOverride &&
        (overrides.deadline ?? null) !==
          (goal.deadline ?? null),
    },
  };
}