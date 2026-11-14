import type { Goal } from "@/types/goal";
import type { Task } from "@/types/task";

export type RescheduleFailureReason =
  | "missing_estimate"
  | "invalid_task_deadline"
  | "task_deadline_passed"
  | "no_available_capacity_before_deadline"
  | "missing_deadline";

export interface RescheduleProposal {
  taskId: string;
  taskTitle: string;
  originalDate: string;
  proposedDate: string;
  scheduledTime: string | null;
  estimatedDuration: number;
  priority: Task["priority"];
}

export interface UnscheduledTask {
  taskId: string;
  taskTitle: string;
  originalDate: string;
  reason: RescheduleFailureReason;
}

export interface ReschedulePlan {
  goalId: string;
  status:
    | "ready"
    | "partial"
    | "no_feasible_slots"
    | "nothing_to_reschedule"
    | "invalid_daily_availability";
  proposals: RescheduleProposal[];
  unscheduledTasks: UnscheduledTask[];
  overdueTaskCount: number;
  totalProposedMinutes: number;
  totalUnscheduledCount: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PRIORITY_ORDER: Record<Task["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/** Parse YYYY-MM-DD as a local calendar date without UTC timezone shifts. */
function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

function earlierDate(a: Date, b: Date): Date {
  return a.getTime() <= b.getTime() ? a : b;
}

function isActiveTask(task: Task): boolean {
  return task.status === "pending" || task.status === "in_progress";
}

/**
 * Build a date-based rescheduling proposal for one goal.
 *
 * Rules:
 * - Only overdue pending/in-progress tasks are candidates.
 * - Proposed dates begin tomorrow; tasks scheduled for today are not overdue.
 * - Completed/cancelled tasks never move and do not consume future capacity.
 * - Future active tasks already scheduled for this goal consume daily capacity.
 * - A future date with an existing active task that has no valid estimate is
 *   treated as unavailable because its remaining capacity cannot be known.
 * - Each candidate is bounded by the earlier of its task deadline and the
 *   goal deadline. If neither exists, it is not scheduled automatically.
 * - Candidates are assigned high priority first, then oldest original date.
 * - scheduled_time is preserved; this service only proposes date changes.
 *
 * This function is pure: it does not write to SQLite or modify its inputs.
 */
export function generateReschedulePlan(
  goal: Goal,
  tasks: Task[],
  asOfDate: Date = new Date()
): ReschedulePlan {
  const today = new Date(
    asOfDate.getFullYear(),
    asOfDate.getMonth(),
    asOfDate.getDate()
  );
  today.setHours(0, 0, 0, 0);
  const tomorrow = addCalendarDays(today, 1);

  const activeTasks = tasks.filter(isActiveTask);
  const overdueTasks = activeTasks.filter((task) => {
    if (!task.scheduled_date) return false;
    const scheduledDate = parseDateOnly(task.scheduled_date);
    return scheduledDate !== null && scheduledDate.getTime() < today.getTime();
  });

  const emptyPlan = (
    status: ReschedulePlan["status"],
    unscheduledTasks: UnscheduledTask[] = []
  ): ReschedulePlan => ({
    goalId: goal.id,
    status,
    proposals: [],
    unscheduledTasks,
    overdueTaskCount: overdueTasks.length,
    totalProposedMinutes: 0,
    totalUnscheduledCount: unscheduledTasks.length,
  });

  if (overdueTasks.length === 0) {
    return emptyPlan("nothing_to_reschedule");
  }

  const dailyHours = Number(goal.daily_available_hours);
  if (!Number.isFinite(dailyHours) || dailyHours <= 0) {
    return emptyPlan("invalid_daily_availability", overdueTasks.map((task) => ({
      taskId: task.id,
      taskTitle: task.title,
      originalDate: task.scheduled_date as string,
      reason: "no_available_capacity_before_deadline",
    })));
  }

  const dailyCapacityMinutes = dailyHours * 60;
  const goalDeadline = goal.deadline ? parseDateOnly(goal.deadline) : null;
  const goalDeadlineInvalid = Boolean(goal.deadline) && !goalDeadline;

  const proposals: RescheduleProposal[] = [];
  const unscheduledTasks: UnscheduledTask[] = [];
  const usedMinutesByDate = new Map<string, number>();
  const datesWithUnknownCapacity = new Set<string>();

  // Reserve capacity for tasks already scheduled in the future for this goal.
  for (const task of activeTasks) {
    if (!task.scheduled_date) continue;
    const scheduledDate = parseDateOnly(task.scheduled_date);
    if (!scheduledDate || scheduledDate.getTime() < tomorrow.getTime()) continue;
    if (goalDeadline && scheduledDate.getTime() > goalDeadline.getTime()) continue;

    // Overdue candidates are being moved, so they do not occupy future dates.
    if (overdueTasks.some((candidate) => candidate.id === task.id)) continue;

    const dateKey = toDateKey(scheduledDate);
    const estimate = Number(task.estimated_duration);
    if (!Number.isFinite(estimate) || estimate <= 0) {
      datesWithUnknownCapacity.add(dateKey);
      continue;
    }

    usedMinutesByDate.set(
      dateKey,
      (usedMinutesByDate.get(dateKey) ?? 0) + estimate
    );
  }

  const sortedCandidates = [...overdueTasks].sort((a, b) => {
    const priorityDifference = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDifference !== 0) return priorityDifference;
    return (a.scheduled_date ?? "").localeCompare(b.scheduled_date ?? "");
  });

  for (const task of sortedCandidates) {
    const originalDate = task.scheduled_date as string;
    const estimate = Number(task.estimated_duration);

    if (!Number.isFinite(estimate) || estimate <= 0) {
      unscheduledTasks.push({
        taskId: task.id,
        taskTitle: task.title,
        originalDate,
        reason: "missing_estimate",
      });
      continue;
    }

    const taskDeadline = task.deadline ? parseDateOnly(task.deadline) : null;
    if (task.deadline && !taskDeadline) {
      unscheduledTasks.push({
        taskId: task.id,
        taskTitle: task.title,
        originalDate,
        reason: "invalid_task_deadline",
      });
      continue;
    }

    if (goalDeadlineInvalid) {
      unscheduledTasks.push({
        taskId: task.id,
        taskTitle: task.title,
        originalDate,
        reason: "no_available_capacity_before_deadline",
      });
      continue;
    }

    let latestAllowedDate: Date | null = null;
    if (goalDeadline && taskDeadline) {
      latestAllowedDate = earlierDate(goalDeadline, taskDeadline);
    } else {
      latestAllowedDate = goalDeadline ?? taskDeadline;
    }

    if (!latestAllowedDate) {
      unscheduledTasks.push({
        taskId: task.id,
        taskTitle: task.title,
        originalDate,
        reason: "missing_deadline",
      });
      continue;
    }

    if (latestAllowedDate.getTime() < tomorrow.getTime()) {
      unscheduledTasks.push({
        taskId: task.id,
        taskTitle: task.title,
        originalDate,
        reason: "task_deadline_passed",
      });
      continue;
    }

    let proposedDate: Date | null = null;
    for (
      let candidateDate = new Date(tomorrow);
      candidateDate.getTime() <= latestAllowedDate.getTime();
      candidateDate = addCalendarDays(candidateDate, 1)
    ) {
      const dateKey = toDateKey(candidateDate);
      if (datesWithUnknownCapacity.has(dateKey)) continue;

      const usedMinutes = usedMinutesByDate.get(dateKey) ?? 0;
      const remainingCapacity = dailyCapacityMinutes - usedMinutes;
      if (estimate <= remainingCapacity) {
        proposedDate = candidateDate;
        usedMinutesByDate.set(dateKey, usedMinutes + estimate);
        break;
      }
    }

    if (!proposedDate) {
      unscheduledTasks.push({
        taskId: task.id,
        taskTitle: task.title,
        originalDate,
        reason: "no_available_capacity_before_deadline",
      });
      continue;
    }

    proposals.push({
      taskId: task.id,
      taskTitle: task.title,
      originalDate,
      proposedDate: toDateKey(proposedDate),
      scheduledTime: task.scheduled_time,
      estimatedDuration: estimate,
      priority: task.priority,
    });
  }

  return {
    goalId: goal.id,
    status:
      proposals.length > 0
        ? unscheduledTasks.length > 0
          ? "partial"
          : "ready"
        : "no_feasible_slots",
    proposals,
    unscheduledTasks,
    overdueTaskCount: overdueTasks.length,
    totalProposedMinutes: proposals.reduce(
      (total, proposal) => total + proposal.estimatedDuration,
      0
    ),
    totalUnscheduledCount: unscheduledTasks.length,
  };
}
