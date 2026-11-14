import { getDatabase } from "@/database/database";
import { getGoalById } from "@/database/goalRepository";
import { getTasksByGoalId } from "@/database/taskRepository";
import type { ReschedulePlan, RescheduleProposal } from "@/services/rescheduleService";
import { generateReschedulePlan } from "@/services/rescheduleService";

/**
 * Load one goal and its tasks from SQLite, then build a rescheduling preview.
 * This function is read-only: it does not update tasks, Zustand state, or SQLite.
 * Returns null when the requested goal no longer exists.
 */
export async function getGoalReschedulePlan(
  goalId: string,
  asOfDate: Date = new Date()
): Promise<ReschedulePlan | null> {
  const goal = await getGoalById(goalId);

  if (!goal) {
    return null;
  }

  const tasks = await getTasksByGoalId(goalId);
  return generateReschedulePlan(goal, tasks, asOfDate);
}

/**
 * Apply the complete set of proposals in one SQLite transaction.
 * The plan is recalculated inside the transaction to prevent applying stale
 * dates if task status, estimates, deadlines, or goal availability changed
 * after the review screen was opened.
 */
export async function applyRescheduleProposals(
  goalId: string,
  proposals: RescheduleProposal[]
): Promise<void> {
  if (proposals.length === 0) {
    throw new Error("There are no proposed task changes to apply.");
  }

  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    const goal = await getGoalById(goalId);
    if (!goal) {
      throw new Error("This goal no longer exists. Please return and try again.");
    }

    const tasks = await getTasksByGoalId(goalId);
    const freshPlan = generateReschedulePlan(goal, tasks);

    if (freshPlan.proposals.length !== proposals.length) {
      throw new Error(
        "The rescheduling plan has changed since this preview was created. Please refresh the plan before applying it."
      );
    }

    const freshById = new Map(
      freshPlan.proposals.map((proposal) => [proposal.taskId, proposal])
    );

    for (const proposal of proposals) {
      const currentProposal = freshById.get(proposal.taskId);
      if (
        !currentProposal ||
        currentProposal.originalDate !== proposal.originalDate ||
        currentProposal.proposedDate !== proposal.proposedDate
      ) {
        throw new Error(
          "One or more task details changed after this preview was created. Please refresh the plan before applying it."
        );
      }
    }

    for (const proposal of proposals) {
      await db.runAsync(
        `UPDATE tasks
         SET scheduled_date = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND goal_id = ?`,
        [proposal.proposedDate, proposal.taskId, goalId]
      );
    }
  });
}
