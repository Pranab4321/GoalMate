import React, { useCallback, useEffect, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";

import {
  Bell,
  Target,
  CheckCircle2,
  Clock3,
  Flame,
  Plus,
  ArrowRight,
  CalendarDays,
  Sparkles,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/theme";

import AppHeader from "@/components/common/AppHeader";
import AppCard from "@/components/common/AppCard";
import AppButton from "@/components/common/AppButton";
import ProgressBar from "@/components/common/ProgressBar";
import ProgressRing from "@/components/common/ProgressRing";
import DifficultyBadge from "@/components/common/DifficultyBadge";

import { useGoalStore } from "@/store/goalStore";
import { useTaskStore } from "@/store/taskStore";
import { useFocusSessionStore } from "@/store/focusSessionStore";

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(time: string | null) {
  if (!time) return "No time set";

  const [hours, minutes] = time.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDeadline(date: string | null) {
  if (!date) return "No deadline";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDaysRemaining(date: string | null) {
  if (!date) return null;

  const deadline = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(deadline.getTime())) return null;

  return Math.ceil(
    (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export default function HomeScreen() {
  const colors = useTheme();
  const router = useRouter();

  const {
    goals,
    fetchGoals,
    isLoading: isGoalLoading,
  } = useGoalStore();

  const {
    tasks,
    fetchTasks,
    isLoading: isTaskLoading,
  } = useTaskStore();

  const {
    totalFocusMinutes,
    refreshFocusStats,
  } = useFocusSessionStore();

  const loadDashboard = useCallback(async () => {
  try {
    const today = getLocalDateString(new Date());

    await Promise.all([
      fetchGoals(),
      fetchTasks(),
      refreshFocusStats(today),
    ]);
  } catch (error) {
    console.error("Dashboard loading failed:", error);
  }
}, [fetchGoals, fetchTasks, refreshFocusStats]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const currentDateObject = new Date();
  const today = getLocalDateString(currentDateObject);

  const currentHour = currentDateObject.getHours();

  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
        ? "Good afternoon"
        : "Good evening";

  const currentDate = currentDateObject.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const activeGoals = useMemo(
    () => goals.filter((goal) => goal.status === "active"),
    [goals]
  );

  const todayTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.scheduled_date === today &&
          task.status !== "cancelled"
      ),
    [tasks, today]
  );

  const completedTasks = todayTasks.filter(
    (task) => task.status === "completed"
  ).length;

  const pendingTasks = todayTasks.filter(
    (task) => task.status === "pending"
  ).length;

  const taskProgress =
    todayTasks.length > 0
      ? (completedTasks / todayTasks.length) * 100
      : 0;

  const totalCompletedTasks = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const upcomingDeadlines = useMemo(() => {
    const goalDeadlines = goals
      .filter(
        (goal) =>
          goal.status === "active" &&
          goal.deadline &&
          getDaysRemaining(goal.deadline) !== null &&
          getDaysRemaining(goal.deadline)! >= 0
      )
      .map((goal) => ({
        id: goal.id,
        title: goal.title,
        subtitle: `${goal.category} goal`,
        deadline: goal.deadline!,
        progress: goal.progress,
        type: "goal" as const,
      }));

    const taskDeadlines = tasks
      .filter(
        (task) =>
          task.status !== "completed" &&
          task.status !== "cancelled" &&
          task.deadline &&
          getDaysRemaining(task.deadline) !== null &&
          getDaysRemaining(task.deadline)! >= 0
      )
      .map((task) => ({
        id: task.id,
        title: task.title,
        subtitle: "Task deadline",
        deadline: task.deadline!,
        progress: 0,
        type: "task" as const,
      }));

    return [...goalDeadlines, ...taskDeadlines]
      .sort(
        (a, b) =>
          new Date(`${a.deadline}T00:00:00`).getTime() -
          new Date(`${b.deadline}T00:00:00`).getTime()
      )
      .slice(0, 3);
  }, [goals, tasks]);

  const focusHours = Math.floor(totalFocusMinutes / 60);
  const focusRemainingMinutes = totalFocusMinutes % 60;

  const focusTimeText =
    focusHours > 0
      ? `${focusHours}h ${focusRemainingMinutes}m`
      : `${focusRemainingMinutes}m`;

  const handleTaskPress = (taskId: string) => {
    router.push(`/task/${taskId}`);
  };

  const isLoading = isGoalLoading || isTaskLoading;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}

        <AppHeader
          title={`${greeting}!`}
          subtitle="Let's make today productive."
          rightAction={
            <Pressable
              style={[
                styles.notificationButton,
                { backgroundColor: colors.surface },
              ]}
              onPress={() => {}}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Bell size={21} color={colors.text} />

              <View
                style={[
                  styles.notificationDot,
                  { backgroundColor: colors.danger },
                ]}
              />
            </Pressable>
          }
        />

        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          {currentDate}
        </Text>

        {isLoading && goals.length === 0 && tasks.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary }}>
              Loading your dashboard...
            </Text>
          </View>
        ) : (
          <>
            {/* Daily overview */}

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Your Overview
              </Text>
            </View>

            <View style={styles.statsRow}>
              <AppCard style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: colors.primary + "18" },
                  ]}
                >
                  <Target size={20} color={colors.primary} />
                </View>

                <Text style={[styles.statValue, { color: colors.text }]}>
                  {activeGoals.length}
                </Text>

                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Active Goals
                </Text>
              </AppCard>

              <AppCard style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: colors.successLight },
                  ]}
                >
                  <CheckCircle2 size={20} color={colors.success} />
                </View>

                <Text style={[styles.statValue, { color: colors.text }]}>
                  {completedTasks}/{todayTasks.length}
                </Text>

                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Tasks Done
                </Text>
              </AppCard>
            </View>

            <View style={styles.statsRow}>
              <AppCard style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: colors.warningLight },
                  ]}
                >
                  <Clock3 size={20} color={colors.warning} />
                </View>

                <Text style={[styles.statValue, { color: colors.text }]}>
                  {focusTimeText}
                </Text>

                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Total Focus Time
                </Text>
              </AppCard>

              <AppCard style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: colors.dangerLight },
                  ]}
                >
                  <Flame size={20} color={colors.danger} />
                </View>

                <Text style={[styles.statValue, { color: colors.text }]}>
                  {totalCompletedTasks}
                </Text>

                <Text
                  style={[styles.statLabel, { color: colors.textSecondary }]}
                >
                  Total Completed
                </Text>
              </AppCard>
            </View>

            {/* Daily productivity */}

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Daily Productivity
              </Text>
            </View>

            <AppCard style={styles.productivityCard}>
              <View style={styles.productivityContent}>
                <View style={styles.productivityInfo}>
                  <Text
                    style={[
                      styles.productivityTitle,
                      { color: colors.text },
                    ]}
                  >
                    Today's Progress
                  </Text>

                  <Text
                    style={[
                      styles.productivityDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {pendingTasks > 0
                      ? "Keep going! Every small step counts."
                      : todayTasks.length > 0
                        ? "Amazing! You completed today's tasks."
                        : "Schedule tasks to start tracking your progress."}
                  </Text>

                  <Text
                    style={[styles.completedText, { color: colors.success }]}
                  >
                    {completedTasks} of {todayTasks.length} tasks completed
                  </Text>
                </View>

                <ProgressRing
                  progress={taskProgress}
                  size={105}
                  strokeWidth={9}
                  label="Done"
                />
              </View>

              <ProgressBar
                progress={taskProgress}
                height={8}
                color={colors.success}
              />
            </AppCard>

            {/* Quick actions */}

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Quick Actions
              </Text>
            </View>

            <View style={styles.quickActions}>
              <AppButton
                title="Create Goal"
                onPress={() => router.push("/goal/create")}
                leftIcon={<Plus size={18} color="#FFFFFF" />}
                fullWidth
              />

              <AppButton
                title="View Tasks"
                variant="outline"
                onPress={() => router.push("/(tabs)/tasks")}
                leftIcon={<CheckCircle2 size={18} color={colors.primary} />}
                fullWidth
              />
            </View>

            {/* Today's tasks */}

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Today's Tasks
              </Text>

              <Pressable
                onPress={() => router.push("/(tabs)/tasks")}
                style={styles.viewAllButton}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View all
                </Text>
                <ArrowRight size={16} color={colors.primary} />
              </Pressable>
            </View>

            <View style={styles.taskList}>
              {todayTasks.length === 0 ? (
                <AppCard padding={20}>
                  <View style={styles.emptyContainer}>
                    <CalendarDays size={32} color={colors.textMuted} />

                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                      No tasks scheduled for today
                    </Text>

                    <Text
                      style={[
                        styles.emptyDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Add a task and schedule it for today to see it here.
                    </Text>

                    <AppButton
                      title="Create Task"
                      onPress={() => router.push("/task/create")}
                      leftIcon={<Plus size={17} color="#FFFFFF" />}
                    />
                  </View>
                </AppCard>
              ) : (
                todayTasks.map((task) => (
                  <Pressable
                    key={task.id}
                    onPress={() => handleTaskPress(task.id)}
                  >
                    <AppCard padding={14}>
                      <View style={styles.taskRow}>
                        <View style={styles.taskIcon}>
                          {task.status === "completed" ? (
                            <CheckCircle2
                              size={23}
                              color={colors.success}
                            />
                          ) : (
                            <View
                              style={[
                                styles.uncheckedCircle,
                                { borderColor: colors.border },
                              ]}
                            />
                          )}
                        </View>

                        <View style={styles.taskInfo}>
                          <Text
                            style={[
                              styles.taskTitle,
                              {
                                color: colors.text,
                                textDecorationLine:
                                  task.status === "completed"
                                    ? "line-through"
                                    : "none",
                                opacity:
                                  task.status === "completed" ? 0.6 : 1,
                              },
                            ]}
                          >
                            {task.title}
                          </Text>

                          <View style={styles.taskMeta}>
                            <Clock3
                              size={13}
                              color={colors.textSecondary}
                            />

                            <Text
                              style={[
                                styles.taskTime,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {formatTime(task.scheduled_time)}
                            </Text>
                          </View>
                        </View>

                        <DifficultyBadge difficulty={task.difficulty} />
                      </View>
                    </AppCard>
                  </Pressable>
                ))
              )}
            </View>

            {/* Active goals */}

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Active Goals
              </Text>

              <Pressable
                onPress={() => router.push("/(tabs)/goals")}
                style={styles.viewAllButton}
              >
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View all
                </Text>
                <ArrowRight size={16} color={colors.primary} />
              </Pressable>
            </View>

            {activeGoals.length === 0 ? (
              <AppCard padding={20}>
                <View style={styles.emptyContainer}>
                  <Target size={32} color={colors.textMuted} />

                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    No active goals
                  </Text>

                  <Text
                    style={[
                      styles.emptyDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Create your first goal and start making progress.
                  </Text>

                  <AppButton
                    title="Create Goal"
                    onPress={() => router.push("/goal/create")}
                    leftIcon={<Plus size={17} color="#FFFFFF" />}
                  />
                </View>
              </AppCard>
            ) : (
              activeGoals.slice(0, 3).map((goal) => {
                const goalTasks = tasks.filter(
                  (task) => task.goal_id === goal.id
                );

                const completed = goalTasks.filter(
                  (task) => task.status === "completed"
                ).length;

                const progress =
                  goalTasks.length > 0
                    ? (completed / goalTasks.length) * 100
                    : 0;

                return (
                  <Pressable
                    key={goal.id}
                    onPress={() => router.push(`/goal/${goal.id}`)}
                  >
                    <AppCard padding={15}>
                      <View style={styles.goalHeader}>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.deadlineTitle,
                              { color: colors.text },
                            ]}
                          >
                            {goal.title}
                          </Text>

                          <Text
                            style={[
                              styles.deadlineSubtitle,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {goal.category} · {completed}/{goalTasks.length} tasks
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.goalProgressText,
                            { color: colors.primary },
                          ]}
                        >
                          {Math.round(progress)}%
                        </Text>
                      </View>

                      <ProgressBar progress={progress} height={7} />
                    </AppCard>
                  </Pressable>
                );
              })
            )}

            {/* Upcoming deadline */}

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Upcoming Deadlines
              </Text>
            </View>

            {upcomingDeadlines.length === 0 ? (
              <AppCard padding={18}>
                <Text
                  style={[
                    styles.emptyDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  No upcoming deadlines. You're all caught up!
                </Text>
              </AppCard>
            ) : (
              upcomingDeadlines.map((item) => {
                const daysRemaining = getDaysRemaining(item.deadline);

                return (
                  <Pressable
                    key={`${item.type}-${item.id}`}
                    onPress={() =>
                      item.type === "goal"
                        ? router.push(`/goal/${item.id}`)
                        : router.push(`/task/${item.id}`)
                    }
                  >
                    <AppCard style={styles.deadlineCard}>
                      <View style={styles.deadlineRow}>
                        <View
                          style={[
                            styles.deadlineIcon,
                            { backgroundColor: colors.warningLight },
                          ]}
                        >
                          <CalendarDays
                            size={22}
                            color={colors.warning}
                          />
                        </View>

                        <View style={styles.deadlineInfo}>
                          <Text
                            style={[
                              styles.deadlineTitle,
                              { color: colors.text },
                            ]}
                          >
                            {item.title}
                          </Text>

                          <Text
                            style={[
                              styles.deadlineSubtitle,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {item.subtitle} · {formatDeadline(item.deadline)}
                          </Text>
                        </View>

                        <Text
                          style={[
                            styles.deadlineDays,
                            { color: colors.warning },
                          ]}
                        >
                          {daysRemaining === 0
                            ? "Today"
                            : daysRemaining === 1
                              ? "1 day"
                              : `${daysRemaining} days`}
                        </Text>
                      </View>

                      {item.type === "goal" ? (
                        <ProgressBar
                          progress={item.progress}
                          height={7}
                        />
                      ) : null}
                    </AppCard>
                  </Pressable>
                );
              })
            )}

            {/* AI motivation */}

            <AppCard
              style={[
                styles.motivationCard,
                { backgroundColor: colors.primary },
              ]}
            >
              <View style={styles.motivationHeader}>
                <Sparkles size={20} color="#FFFFFF" />

                <Text style={styles.motivationLabel}>
                  GOALMATE MOTIVATION
                </Text>
              </View>

              <Text style={styles.motivationText}>
                "Success is the sum of small efforts, repeated day in and day out."
              </Text>

              <Text style={styles.motivationFooter}>
                Stay consistent. You've got this!
              </Text>
            </AppCard>
          </>
        )}
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
    gap: Spacing.sm,
  },

  loadingContainer: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationDot: {
    position: "absolute",
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },

  dateText: {
    fontSize: Typography.fontSize.sm,
    marginTop: -Spacing.xs,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },

  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  statCard: {
    flex: 1,
    minHeight: 125,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },

  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },

  statLabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: 3,
  },

  productivityCard: {
    gap: Spacing.lg,
  },

  productivityContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },

  productivityInfo: {
    flex: 1,
    gap: Spacing.sm,
  },

  productivityTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },

  productivityDescription: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.normal,
  },

  completedText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: Spacing.xs,
  },

  quickActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  viewAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  taskList: {
    gap: Spacing.sm,
  },

  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  taskIcon: {
    width: 28,
    alignItems: "center",
  },

  uncheckedCircle: {
    width: 21,
    height: 21,
    borderRadius: Radius.full,
    borderWidth: 2,
  },

  taskInfo: {
    flex: 1,
    gap: 6,
  },

  taskTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  taskMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  taskTime: {
    fontSize: Typography.fontSize.xs,
  },

  deadlineCard: {
    gap: Spacing.md,
  },

  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  deadlineIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  deadlineInfo: {
    flex: 1,
    gap: 4,
  },

  deadlineTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  deadlineSubtitle: {
    fontSize: Typography.fontSize.xs,
  },

  deadlineDays: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },

  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },

  goalProgressText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },

  emptyContainer: {
    alignItems: "center",
    gap: 12,
  },

  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
  },

  emptyDescription: {
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
    lineHeight: Typography.lineHeight.normal,
  },

  motivationCard: {
    marginTop: Spacing.xl,
    borderWidth: 0,
    gap: Spacing.md,
  },

  motivationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  motivationLabel: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 1,
  },

  motivationText: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.lg,
    lineHeight: 27,
    fontWeight: Typography.fontWeight.semibold,
  },

  motivationFooter: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.sm,
    opacity: 0.85,
  },
});