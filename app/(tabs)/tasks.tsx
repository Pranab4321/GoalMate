
import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import {
  Plus,
  CheckCircle2,
  Circle,
  Clock3,
  CalendarDays,
  ListTodo,
  Target,
  ArrowRight,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/theme";

import AppHeader from "@/components/common/AppHeader";
import AppCard from "@/components/common/AppCard";
import DifficultyBadge from "@/components/common/DifficultyBadge";
import EmptyState from "@/components/common/EmptyState";
import AppButton from "@/components/common/AppButton";

import { useTaskStore } from "@/store/taskStore";
import { useGoalStore } from "@/store/goalStore";
import type { Task, TaskStatus } from "@/types/task";

type TaskFilter = "all" | "pending" | "in_progress" | "completed";

type TaskPriority = "high" | "medium" | "low";

export default function TasksScreen() {
  const colors = useTheme();
  const router = useRouter();

  const tasks = useTaskStore((state) => state.tasks);
  const isLoading = useTaskStore((state) => state.isLoading);
  const error = useTaskStore((state) => state.error);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const markTaskCompleted = useTaskStore(
    (state) => state.markTaskCompleted
  );
  const editTask = useTaskStore((state) => state.editTask);
  const clearError = useTaskStore((state) => state.clearError);

  const goals = useGoalStore((state) => state.goals);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);

  const [selectedFilter, setSelectedFilter] =
    useState<TaskFilter>("all");

  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(
    null
  );

  const [expandedGoalIds, setExpandedGoalIds] = useState<string[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchGoals();
  }, [fetchTasks, fetchGoals]);

  const completedCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const pendingCount = tasks.filter(
    (task) =>
      task.status === "pending" || task.status === "in_progress"
  ).length;

  const filteredTasks = useMemo(() => {
    if (selectedFilter === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.status === selectedFilter);
  }, [tasks, selectedFilter]);

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return colors.danger;
      case "medium":
        return colors.warning;
      case "low":
        return colors.success;
    }
  };

  const getPriorityBackground = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return colors.dangerLight;
      case "medium":
        return colors.warningLight;
      case "low":
        return colors.successLight;
    }
  };

  const getGoalTitle = (goalId: string | null) => {
    if (!goalId) {
      return "Independent Task";
    }

    return (
      goals.find((goal) => goal.id === goalId)?.title ??
      "Goal unavailable"
    );
  };

  const formatTime = (time: string | null) => {
    if (!time) {
      return "No time set";
    }

    const parts = time.split(":");

    if (parts.length < 2) {
      return time;
    }

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return time;
    }

    return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(
      "en-IN",
      {
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) {
      return "Not estimated";
    }

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const handleToggleTask = async (task: Task) => {
    if (updatingTaskId) {
      return;
    }

    try {
      setUpdatingTaskId(task.id);

      if (task.status === "completed") {
        await editTask(task.id, {
          status: "pending",
          completed_at: null,
        });
      } else {
        await markTaskCompleted(task.id);
      }
    } catch {
      Alert.alert(
        "Update failed",
        "Unable to update this task. Please try again."
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleRetry = () => {
    clearError();
    fetchTasks();
    fetchGoals();
  };

  const toggleGoal = (goalId: string) => {
    setExpandedGoalIds((current) =>
      current.includes(goalId)
        ? current.filter((id) => id !== goalId)
        : [...current, goalId]
    );
  };

  const renderTaskCard = (task: Task) => {
    const isCompleted = task.status === "completed";
    const priority = task.priority as TaskPriority;

    return (
      <AppCard key={task.id} style={styles.taskCard}>
        <View style={styles.taskTopRow}>
          <Pressable
            onPress={() => handleToggleTask(task)}
            disabled={updatingTaskId !== null}
            hitSlop={10}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isCompleted }}
            accessibilityLabel={`Mark ${task.title} ${isCompleted ? "pending" : "completed"}`}
          >
            {updatingTaskId === task.id ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : isCompleted ? (
              <CheckCircle2 size={25} color={colors.success} />
            ) : (
              <Circle size={25} color={colors.textMuted} />
            )}
          </Pressable>

          <Pressable style={styles.taskInfo} onPress={() => openTask(task.id)}>
            <Text style={[styles.taskTitle, { color: colors.text, textDecorationLine: isCompleted ? "line-through" : "none", opacity: isCompleted ? 0.55 : 1 }]}>
              {task.title}
            </Text>
            <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>
              {task.description || "No description provided."}
            </Text>
          </Pressable>

          <Pressable onPress={() => openTask(task.id)} hitSlop={8}>
            <ArrowRight size={19} color={colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.taskMeta}>
          <View style={styles.metaItem}>
            <Clock3 size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatTime(task.scheduled_time)}</Text>
          </View>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatDuration(task.estimated_duration)}</Text>
        </View>

        <View style={styles.badgeRow}>
          <DifficultyBadge difficulty={task.difficulty} />
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityBackground(priority) }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(priority) }]}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Text>
          </View>
        </View>
      </AppCard>
    );
  };

  const openTask = (id: string) => {
    router.push(`/task/${id}`);
  };

  const filters: { label: string; value: TaskFilter }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
  ];

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background },
      ]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}

        <AppHeader
          title="My Tasks"
          subtitle="Organize your day, one task at a time."
          rightAction={
            <Pressable
              onPress={() => router.push("/task/create")}
              style={[
                styles.addButton,
                { backgroundColor: colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Add task"
            >
              <Plus size={22} color="#FFFFFF" />
            </Pressable>
          }
        />

        {/* Date */}

        <View style={styles.dateRow}>
          <CalendarDays
            size={17}
            color={colors.textSecondary}
          />

          <Text
            style={[
              styles.dateText,
              { color: colors.textSecondary },
            ]}
          >
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* Summary */}

        <View style={styles.summaryRow}>
          <AppCard style={styles.summaryCard}>
            <ListTodo size={22} color={colors.primary} />

            <Text
              style={[
                styles.summaryNumber,
                { color: colors.text },
              ]}
            >
              {tasks.length}
            </Text>

            <Text
              style={[
                styles.summaryLabel,
                { color: colors.textSecondary },
              ]}
            >
              Total Tasks
            </Text>
          </AppCard>

          <AppCard style={styles.summaryCard}>
            <Clock3 size={22} color={colors.warning} />

            <Text
              style={[
                styles.summaryNumber,
                { color: colors.text },
              ]}
            >
              {pendingCount}
            </Text>

            <Text
              style={[
                styles.summaryLabel,
                { color: colors.textSecondary },
              ]}
            >
              Pending
            </Text>
          </AppCard>

          <AppCard style={styles.summaryCard}>
            <CheckCircle2 size={22} color={colors.success} />

            <Text
              style={[
                styles.summaryNumber,
                { color: colors.text },
              ]}
            >
              {completedCount}
            </Text>

            <Text
              style={[
                styles.summaryLabel,
                { color: colors.textSecondary },
              ]}
            >
              Completed
            </Text>
          </AppCard>
        </View>

        {/* Progress */}

        <AppCard style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text
              style={[
                styles.progressTitle,
                { color: colors.text },
              ]}
            >
              Task Completion Progress
            </Text>

            <Text
              style={[
                styles.progressPercentage,
                { color: colors.primary },
              ]}
            >
              {tasks.length > 0
                ? Math.round((completedCount / tasks.length) * 100)
                : 0}
              %
            </Text>
          </View>

          <View
            style={[
              styles.progressTrack,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    tasks.length > 0
                      ? (completedCount / tasks.length) * 100
                      : 0
                  }%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.progressDescription,
              { color: colors.textSecondary },
            ]}
          >
            {completedCount} of {tasks.length} tasks completed
          </Text>
        </AppCard>

        {/* Filters */}

        <View style={styles.filterSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text },
            ]}
          >
            Your Schedule
          </Text>

          <View
            style={[
              styles.filterContainer,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            {filters.map((filter) => {
              const isSelected =
                selectedFilter === filter.value;

              return (
                <Pressable
                  key={filter.value}
                  onPress={() => setSelectedFilter(filter.value)}
                  style={[
                    styles.filterButton,
                    isSelected && {
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color: isSelected
                          ? colors.primary
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Loading */}

        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text
              style={[
                styles.stateText,
                { color: colors.textSecondary },
              ]}
            >
              Loading your tasks...
            </Text>
          </View>
        ) : error ? (
          /* Error */

          <View style={styles.stateContainer}>
            <Text
              style={[
                styles.errorText,
                { color: colors.danger },
              ]}
            >
              {error}
            </Text>

            <AppButton
              title="Try Again"
              onPress={handleRetry}
              variant="outline"
              leftIcon={
                <RefreshCw
                  size={17}
                  color={colors.primary}
                />
              }
            />
          </View>
        ) : goals.length === 0 && filteredTasks.length === 0 ? (
          <EmptyState
            title="No goals or tasks yet"
            description="Create a goal first, then add tasks to make progress toward it."
            icon={<Target size={34} color={colors.primary} />}
            actionLabel="Create Goal"
            onAction={() => router.push("/goal/create")}
          />
        ) : (
          <View style={styles.goalSections}>
            {goals.map((goal) => {
              const goalTasks = filteredTasks.filter(
                (task) => task.goal_id === goal.id
              );
              const allGoalTasks = tasks.filter(
                (task) => task.goal_id === goal.id
              );
              const goalCompleted = allGoalTasks.filter(
                (task) => task.status === "completed"
              ).length;
              const goalProgress = allGoalTasks.length
                ? Math.round((goalCompleted / allGoalTasks.length) * 100)
                : 0;
              const isExpanded = expandedGoalIds.includes(goal.id);

              return (
                <AppCard key={goal.id} style={styles.goalSectionCard}>
                  <Pressable
                    onPress={() => toggleGoal(goal.id)}
                    style={styles.goalSectionHeader}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                  >
                    <View style={styles.goalSectionIcon}>
                      <Target size={20} color={colors.primary} />
                    </View>
                    <View style={styles.goalSectionInfo}>
                      <Text style={[styles.goalSectionTitle, { color: colors.text }]} numberOfLines={2}>
                        {goal.title}
                      </Text>
                      <Text style={[styles.goalSectionSubtitle, { color: colors.textSecondary }]}>
                        {allGoalTasks.length} {allGoalTasks.length === 1 ? "task" : "tasks"} · {goalCompleted} completed
                      </Text>
                    </View>
                    {isExpanded ? (
                      <ChevronDown size={21} color={colors.textSecondary} />
                    ) : (
                      <ChevronRight size={21} color={colors.textSecondary} />
                    )}
                  </Pressable>

                  <View style={[styles.goalProgressTrack, { backgroundColor: colors.surfaceSecondary }]}>
                    <View style={[styles.goalProgressFill, { width: `${goalProgress}%`, backgroundColor: colors.primary }]} />
                  </View>

                  {isExpanded && (
                    <View style={styles.expandedGoalContent}>
                      {goalTasks.length > 0 ? (
                        <View style={styles.taskList}>
                          {goalTasks.map(renderTaskCard)}
                        </View>
                      ) : (
                        <View style={styles.noGoalTasks}>
                          <Text style={[styles.noGoalTasksText, { color: colors.textSecondary }]}>
                            {allGoalTasks.length === 0
                              ? "No tasks have been added to this goal yet."
                              : "No tasks match the selected filter."}
                          </Text>
                          {allGoalTasks.length === 0 && (
                            <AppButton
                              title="Add Task to This Goal"
                              size="small"
                              onPress={() => router.push(`/task/create?goalId=${goal.id}`)}
                              leftIcon={<Plus size={16} color="#FFFFFF" />}
                            />
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </AppCard>
              );
            })}

            {(() => {
              const independentTasks = filteredTasks.filter((task) => !task.goal_id);
              const allIndependentTasks = tasks.filter((task) => !task.goal_id);
              const isExpanded = expandedGoalIds.includes("__independent__");

              if (allIndependentTasks.length === 0) return null;

              return (
                <AppCard style={styles.goalSectionCard}>
                  <Pressable
                    onPress={() => toggleGoal("__independent__")}
                    style={styles.goalSectionHeader}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                  >
                    <View style={[styles.goalSectionIcon, { backgroundColor: colors.surfaceSecondary }]}>
                      <ListTodo size={20} color={colors.textSecondary} />
                    </View>
                    <View style={styles.goalSectionInfo}>
                      <Text style={[styles.goalSectionTitle, { color: colors.text }]}>Independent Tasks</Text>
                      <Text style={[styles.goalSectionSubtitle, { color: colors.textSecondary }]}>
                        {allIndependentTasks.length} {allIndependentTasks.length === 1 ? "task" : "tasks"} not linked to a goal
                      </Text>
                    </View>
                    {isExpanded ? (
                      <ChevronDown size={21} color={colors.textSecondary} />
                    ) : (
                      <ChevronRight size={21} color={colors.textSecondary} />
                    )}
                  </Pressable>
                  {isExpanded && (
                    <View style={styles.expandedGoalContent}>
                      {independentTasks.length > 0 ? (
                        <View style={styles.taskList}>{independentTasks.map(renderTaskCard)}</View>
                      ) : (
                        <Text style={[styles.noGoalTasksText, { color: colors.textSecondary }]}>
                          No independent tasks match the selected filter.
                        </Text>
                      )}
                    </View>
                  )}
                </AppCard>
              );
            })()}
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing["5xl"],
  },

  addButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },

  dateText: {
    fontSize: Typography.fontSize.sm,
  },

  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },

  summaryCard: {
    flex: 1,
    minHeight: 112,
    padding: Spacing.md,
    gap: Spacing.xs,
  },

  summaryNumber: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },

  summaryLabel: {
    fontSize: Typography.fontSize.xs,
  },

  progressCard: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },

  progressPercentage: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },

  progressTrack: {
    height: 9,
    width: "100%",
    borderRadius: Radius.full,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: Radius.full,
  },

  progressDescription: {
    fontSize: Typography.fontSize.xs,
  },

  filterSection: {
    marginTop: Spacing["2xl"],
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },

  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 4,
    borderRadius: Radius.lg,
    gap: 4,
  },

  filterButton: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
  },

  filterText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },

  taskList: {
    gap: Spacing.md,
  },

  goalSections: {
    gap: Spacing.md,
  },

  goalSectionCard: {
    gap: Spacing.md,
  },

  goalSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  goalSectionIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: "rgba(124, 58, 237, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  goalSectionInfo: {
    flex: 1,
    gap: 4,
  },

  goalSectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },

  goalSectionSubtitle: {
    fontSize: Typography.fontSize.xs,
  },

  goalProgressTrack: {
    height: 6,
    borderRadius: Radius.full,
    overflow: "hidden",
  },

  goalProgressFill: {
    height: "100%",
    borderRadius: Radius.full,
  },

  expandedGoalContent: {
    gap: Spacing.md,
  },

  noGoalTasks: {
    gap: Spacing.md,
    alignItems: "flex-start",
    paddingVertical: Spacing.sm,
  },

  noGoalTasksText: {
    fontSize: Typography.fontSize.sm,
  },

  taskCard: {
    gap: Spacing.md,
  },

  taskTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },

  taskInfo: {
    flex: 1,
    gap: 5,
  },

  taskTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    lineHeight: Typography.lineHeight.normal,
  },

  taskDescription: {
    fontSize: Typography.fontSize.xs,
    lineHeight: 18,
  },

  goalAssociation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  goalText: {
    fontSize: Typography.fontSize.xs,
    flex: 1,
  },

  taskFooter: {
    gap: Spacing.md,
  },

  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metaText: {
    fontSize: Typography.fontSize.xs,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },

  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },

  priorityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },

  stateContainer: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },

  stateText: {
    fontSize: Typography.fontSize.sm,
  },

  errorText: {
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
  },

  bottomSpace: {
    height: Spacing.xl,
  },
});
