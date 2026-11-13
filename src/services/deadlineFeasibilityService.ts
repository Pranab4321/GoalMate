import type { Goal } from "@/types/goal";
import type { Task } from "@/types/task";

export type DeadlineFeasibilityStatus =
  | "achievable"
  | "at_risk"
  | "unachievable"
  | "completed"
  | "archived"
  | "no_deadline"
  | "invalid_deadline"
  | "overdue"
  | "no_tasks"
  | "invalid_daily_availability"
  | "missing_estimates";

export interface DeadlineFeasibilityResult {
  status: DeadlineFeasibilityStatus;
  remainingTaskCount: number;
  estimatedTaskCount: number;
  missingEstimateTaskCount: number;
  remainingWorkloadMinutes: number;
  availableMinutes: number | null;
  daysRemaining: number | null;
  dailyAvailableHours: number;
  utilizationPercent: number | null;
  spareMinutes: number | null;
}

const ACHIEVABLE_LIMIT_PERCENT = 80;

/**
 * Parse a database date (YYYY-MM-DD) without converting it through UTC.
 * Goal dates are stored as date-only strings, so local timezone conversion
 * must not shift the selected calendar day.
 */
function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function getLocalTodayAsUtcDate(asOfDate: Date): Date {
  return new Date(
    Date.UTC(
      asOfDate.getFullYear(),
      asOfDate.getMonth(),
      asOfDate.getDate()
    )
  );
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Calculate whether the remaining tasks for a goal fit before its deadline.
 *
 * Calendar-day rule: today and the deadline date are both counted as
 * available days. Weekends are included because GoalMate does not currently
 * store per-day working schedules.
 *
 * Only pending and in-progress tasks contribute to the remaining workload.
 * Completed and cancelled tasks are ignored. A missing/non-positive estimate
 * prevents a definitive feasibility status, because treating it as zero
 * would make the result misleading.
 */
export function calculateDeadlineFeasibility(
  goal: Goal,
  tasks: Task[],
  asOfDate: Date = new Date()
): DeadlineFeasibilityResult {
  const remainingTasks = tasks.filter(
    (task) => task.status === "pending" || task.status === "in_progress"
  );

  const estimatedTasks = remainingTasks.filter(
    (task) =>
      Number.isFinite(task.estimated_duration) &&
      task.estimated_duration > 0
  );

  const missingEstimateTaskCount =
    remainingTasks.length - estimatedTasks.length;

  const remainingWorkloadMinutes = estimatedTasks.reduce(
    (total, task) => total + task.estimated_duration,
    0
  );

  const baseResult = {
    remainingTaskCount: remainingTasks.length,
    estimatedTaskCount: estimatedTasks.length,
    missingEstimateTaskCount,
    remainingWorkloadMinutes,
    dailyAvailableHours: Number(goal.daily_available_hours),
  };

  const result = (
    status: DeadlineFeasibilityStatus,
    extras: {
      availableMinutes?: number | null;
      daysRemaining?: number | null;
      utilizationPercent?: number | null;
      spareMinutes?: number | null;
    } = {}
  ): DeadlineFeasibilityResult => ({
    ...baseResult,
    status,
    availableMinutes: extras.availableMinutes ?? null,
    daysRemaining: extras.daysRemaining ?? null,
    utilizationPercent: extras.utilizationPercent ?? null,
    spareMinutes: extras.spareMinutes ?? null,
  });

  if (goal.status === "completed") return result("completed");
  if (goal.status === "archived") return result("archived");
  if (!goal.deadline) return result("no_deadline");

  const deadlineDate = parseDateOnly(goal.deadline);
  if (!deadlineDate) return result("invalid_deadline");

  const today = getLocalTodayAsUtcDate(asOfDate);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const daysUntilDeadline = Math.round(
    (deadlineDate.getTime() - today.getTime()) / millisecondsPerDay
  );

  if (daysUntilDeadline < 0) return result("overdue", { daysRemaining: 0 });
  if (remainingTasks.length === 0) return result("no_tasks");

  const dailyHours = Number(goal.daily_available_hours);
  if (!Number.isFinite(dailyHours) || dailyHours <= 0) {
    return result("invalid_daily_availability", {
      daysRemaining: daysUntilDeadline + 1,
    });
  }

  const daysRemaining = daysUntilDeadline + 1;
  const availableMinutes = daysRemaining * dailyHours * 60;

  if (missingEstimateTaskCount > 0) {
    return result("missing_estimates", {
      daysRemaining,
      availableMinutes,
    });
  }

  const rawUtilizationPercent =
    availableMinutes > 0
      ? (remainingWorkloadMinutes / availableMinutes) * 100
      : 0;
  const utilizationPercent = roundToOneDecimal(rawUtilizationPercent);
  const spareMinutes = availableMinutes - remainingWorkloadMinutes;

  let status: DeadlineFeasibilityStatus;
  if (rawUtilizationPercent <= ACHIEVABLE_LIMIT_PERCENT) {
    status = "achievable";
  } else if (rawUtilizationPercent <= 100) {
    status = "at_risk";
  } else {
    status = "unachievable";
  }

  return result(status, {
    daysRemaining,
    availableMinutes,
    utilizationPercent,
    spareMinutes,
  });
}
