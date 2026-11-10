
import React, { useCallback, useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import {
  Target,
  CheckCircle2,
  Clock3,
  Flame,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  CalendarDays,
  Zap,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/theme";

import AppHeader from "@/components/common/AppHeader";
import AppCard from "@/components/common/AppCard";
import ProgressRing from "@/components/common/ProgressRing";
import ProgressBar from "@/components/common/ProgressBar";

import { useTaskStore } from "@/store/taskStore";
import { useGoalStore } from "@/store/goalStore";
import { useFocusSessionStore } from "@/store/focusSessionStore";

import type { Task } from "@/types/task";

// Convert a SQLite timestamp into the device's local date.
function getLocalDateFromTimestamp(
  timestamp: string | null
): string | null {
  if (!timestamp) return null;

  const normalized = timestamp.includes("T")
    ? timestamp
    : `${timestamp.replace(" ", "T")}Z`;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLocalHour(timestamp: string): number | null {
  const normalized = timestamp.includes("T")
    ? timestamp
    : `${timestamp.replace(" ", "T")}Z`;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return null;

  return date.getHours();
}

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatFocusTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;

  if (remainingMinutes === 0) return `${hours}h`;

  return `${hours}h ${remainingMinutes}m`;
}

function calculateStreak(completedDates: Set<string>): number {
  const today = new Date();
  const todayString = getDateString(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayString = getDateString(yesterday);

  // A streak remains active if the last completed day was yesterday.
  let currentDate = completedDates.has(todayString)
    ? today
    : completedDates.has(yesterdayString)
      ? yesterday
      : null;

  if (!currentDate) return 0;

  let streak = 0;

  while (completedDates.has(getDateString(currentDate))) {
    streak += 1;

    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

export default function AnalyticsScreen() {
  const colors = useTheme();

  const tasks = useTaskStore((state) => state.tasks);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);

  const goals = useGoalStore((state) => state.goals);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);

  const sessions = useFocusSessionStore(
    (state) => state.sessions
  );
  const fetchSessions = useFocusSessionStore(
    (state) => state.fetchSessions
  );

  const refreshFocusStats = useFocusSessionStore(
    (state) => state.refreshFocusStats
  );

  useFocusEffect(
    useCallback(() => {
      const today = getDateString(new Date());

      Promise.all([
        fetchTasks(),
        fetchGoals(),
        fetchSessions(),
        refreshFocusStats(today),
      ]).catch((error) => {
        console.error("Failed to refresh analytics:", error);
      });
    }, [
      fetchTasks,
      fetchGoals,
      fetchSessions,
      refreshFocusStats,
    ])
  );

  const analytics = useMemo(() => {
    const completedTasks = tasks.filter(
      (task) => task.status === "completed"
    );

    const validTasks = tasks.filter(
      (task) => task.status !== "cancelled"
    );

    const productivityScore =
      validTasks.length > 0
        ? Math.round(
            (completedTasks.length / validTasks.length) * 100
          )
        : 0;

    const activeGoals = goals.filter(
      (goal) => goal.status === "active"
    );

    const completedGoals = goals.filter(
      (goal) => goal.status === "completed"
    );

    // Weekly completed tasks, including today.
    const weeklyData = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));

      const dateString = getDateString(date);

      const completed = completedTasks.filter(
        (task) =>
          getLocalDateFromTimestamp(task.completed_at) === dateString
      ).length;

      return {
        day: date.toLocaleDateString("en-US", {
          weekday: "short",
        }),
        date: dateString,
        completed,
      };
    });

    const totalWeeklyTasks = weeklyData.reduce(
      (total, item) => total + item.completed,
      0
    );

    const maxTasks = Math.max(
      1,
      ...weeklyData.map((item) => item.completed)
    );

    // Calculate the current productivity streak.
    const completedDates = new Set<string>();

    completedTasks.forEach((task) => {
      const date = getLocalDateFromTimestamp(task.completed_at);

      if (date) completedDates.add(date);
    });

    const currentStreak = calculateStreak(completedDates);

    // Calculate focus time using completed focus sessions.
    const focusMinutes = sessions
      .filter(
        (session) =>
          session.status === "completed" &&
          session.session_type === "focus"
      )
      .reduce(
        (total, session) => total + (session.duration || 0),
        0
      );

    // Group completed tasks by their local completion hour.
    const activityCounts = {
      morning: 0,
      afternoon: 0,
      evening: 0,
    };

    completedTasks.forEach((task) => {
      if (!task.completed_at) return;

      const hour = getLocalHour(task.completed_at);

      if (hour === null) return;

      if (hour >= 5 && hour < 12) {
        activityCounts.morning += 1;
      } else if (hour >= 12 && hour < 17) {
        activityCounts.afternoon += 1;
      } else {
        activityCounts.evening += 1;
      }
    });

    const totalTimedTasks =
      activityCounts.morning +
      activityCounts.afternoon +
      activityCounts.evening;

    const activityData = [
      {
        label: "Morning",
        value:
          totalTimedTasks > 0
            ? Math.round(
                (activityCounts.morning / totalTimedTasks) * 100
              )
            : 0,
      },
      {
        label: "Afternoon",
        value:
          totalTimedTasks > 0
            ? Math.round(
                (activityCounts.afternoon / totalTimedTasks) * 100
              )
            : 0,
      },
      {
        label: "Evening",
        value:
          totalTimedTasks > 0
            ? Math.round(
                (activityCounts.evening / totalTimedTasks) * 100
              )
            : 0,
      },
    ];

    // Calculate progress for each active goal.
    const goalProgress = activeGoals.map((goal) => {
      const goalTasks = tasks.filter(
        (task) => task.goal_id === goal.id
      );

      const goalCompletedTasks = goalTasks.filter(
        (task) => task.status === "completed"
      );

      const progress =
        goalTasks.length > 0
          ? Math.round(
              (goalCompletedTasks.length / goalTasks.length) * 100
            )
          : 0;

      return {
        id: goal.id,
        title: goal.title,
        progress,
      };
    });

    // Find the most productive day of this week.
    const bestDay = [...weeklyData].sort(
      (a, b) => b.completed - a.completed
    )[0];

    // Find the least productive day with actual task completions.
    const leastProductiveDay = [...weeklyData]
      .filter((item) => item.completed > 0)
      .sort((a, b) => a.completed - b.completed)[0];

    return {
      completedTasks: completedTasks.length,
      validTasks: validTasks.length,
      productivityScore,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      focusMinutes,
      currentStreak,
      weeklyData,
      totalWeeklyTasks,
      maxTasks,
      activityData,
      totalTimedTasks,
      goalProgress,
      bestDay,
      leastProductiveDay,
    };
  }, [tasks, goals, sessions]);

  const formatGoalProgress = (progress: number) =>
    `${progress}%`;

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
        <AppHeader
          title="Analytics"
          subtitle="Understand your productivity and growth."
        />

        <View style={styles.periodRow}>
          <CalendarDays
            size={17}
            color={colors.textSecondary}
          />

          <Text
            style={[
              styles.periodText,
              { color: colors.textSecondary },
            ]}
          >
            Your weekly performance
          </Text>
        </View>

        {/* Productivity score */}
        <AppCard style={styles.scoreCard}>
          <View style={styles.scoreContent}>
            <View style={styles.scoreInfo}>
              <Text
                style={[
                  styles.scoreLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Productivity Score
              </Text>

              <Text
                style={[
                  styles.scoreValue,
                  { color: colors.text },
                ]}
              >
                {analytics.productivityScore}
                <Text
                  style={[
                    styles.scoreOutOf,
                    { color: colors.textSecondary },
                  ]}
                >
                  /100
                </Text>
              </Text>

              <View style={styles.trendRow}>
                <TrendingUp
                  size={16}
                  color={colors.success}
                />

                <Text
                  style={[
                    styles.trendText,
                    { color: colors.success },
                  ]}
                >
                  Overall completion rate
                </Text>
              </View>

              <Text
                style={[
                  styles.scoreDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Based on all non-cancelled tasks
              </Text>
            </View>

            <ProgressRing
              progress={analytics.productivityScore}
              size={112}
              strokeWidth={10}
              color={colors.primary}
              label="Score"
            />
          </View>
        </AppCard>

        {/* Statistics */}
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Performance Overview
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <AppCard style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: colors.successLight },
              ]}
            >
              <CheckCircle2
                size={21}
                color={colors.success}
              />
            </View>

            <Text
              style={[styles.statValue, { color: colors.text }]}
            >
              {analytics.completedTasks}
            </Text>

            <Text
              style={[
                styles.statLabel,
                { color: colors.textSecondary },
              ]}
            >
              Tasks Completed
            </Text>

            <Text
              style={[
                styles.statTrend,
                { color: colors.success },
              ]}
            >
              {analytics.totalWeeklyTasks} this week
            </Text>
          </AppCard>

          <AppCard style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: colors.primary + "18" },
              ]}
            >
              <Target size={21} color={colors.primary} />
            </View>

            <Text
              style={[styles.statValue, { color: colors.text }]}
            >
              {analytics.activeGoals}
            </Text>

            <Text
              style={[
                styles.statLabel,
                { color: colors.textSecondary },
              ]}
            >
              Active Goals
            </Text>

            <Text
              style={[
                styles.statTrend,
                { color: colors.textSecondary },
              ]}
            >
              {analytics.completedGoals} completed
            </Text>
          </AppCard>

          <AppCard style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: colors.warningLight },
              ]}
            >
              <Clock3 size={21} color={colors.warning} />
            </View>

            <Text
              style={[styles.statValue, { color: colors.text }]}
            >
              {formatFocusTime(analytics.focusMinutes)}
            </Text>

            <Text
              style={[
                styles.statLabel,
                { color: colors.textSecondary },
              ]}
            >
              Total Focus Time
            </Text>

            <Text
              style={[
                styles.statTrend,
                { color: colors.textSecondary },
              ]}
            >
              From completed sessions
            </Text>
          </AppCard>

          <AppCard style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: colors.dangerLight },
              ]}
            >
              <Flame size={21} color={colors.danger} />
            </View>

            <Text
              style={[styles.statValue, { color: colors.text }]}
            >
              {analytics.currentStreak} Days
            </Text>

            <Text
              style={[
                styles.statLabel,
                { color: colors.textSecondary },
              ]}
            >
              Current Streak
            </Text>

            <Text
              style={[
                styles.statTrend,
                { color: colors.success },
              ]}
            >
              {analytics.currentStreak > 0
                ? "Keep it going!"
                : "Start your streak today"}
            </Text>
          </AppCard>
        </View>

        {/* Weekly chart */}
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Weekly Task Activity
          </Text>
        </View>

        <AppCard style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text
                style={[
                  styles.chartValue,
                  { color: colors.text },
                ]}
              >
                {analytics.totalWeeklyTasks}
              </Text>

              <Text
                style={[
                  styles.chartSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Tasks completed this week
              </Text>
            </View>

            <View
              style={[
                styles.chartBadge,
                { backgroundColor: colors.successLight },
              ]}
            >
              <TrendingUp
                size={15}
                color={colors.success}
              />

              <Text
                style={[
                  styles.chartBadgeText,
                  { color: colors.success },
                ]}
              >
                Last 7 days
              </Text>
            </View>
          </View>

          <View style={styles.chart}>
            {analytics.weeklyData.map((item) => {
              const barHeight =
                (item.completed / analytics.maxTasks) * 120;

              const isToday =
                item.date === getDateString(new Date());

              return (
                <View
                  key={item.date}
                  style={styles.barColumn}
                >
                  <Text
                    style={[
                      styles.barValue,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.completed}
                  </Text>

                  <View
                    style={[
                      styles.barTrack,
                      {
                        backgroundColor: colors.surfaceSecondary,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.bar,
                        {
                          height: barHeight,
                          backgroundColor: isToday
                            ? colors.secondary
                            : colors.primary,
                        },
                      ]}
                    />
                  </View>

                  <Text
                    style={[
                      styles.barLabel,
                      {
                        color: isToday
                          ? colors.primary
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {item.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </AppCard>

        {/* Goal progress */}
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Goal Progress
          </Text>
        </View>

        <AppCard style={styles.goalProgressCard}>
          {analytics.goalProgress.length > 0 ? (
            analytics.goalProgress.map((goal, index) => (
              <View
                key={goal.id}
                style={styles.goalProgressItem}
              >
                <View style={styles.goalProgressHeader}>
                  <Text
                    style={[
                      styles.goalName,
                      { color: colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {goal.title}
                  </Text>

                  <Text
                    style={[
                      styles.goalPercentage,
                      { color: colors.primary },
                    ]}
                  >
                    {formatGoalProgress(goal.progress)}
                  </Text>
                </View>

                <ProgressBar
                  progress={goal.progress}
                  height={8}
                  color={
                    index % 3 === 0
                      ? colors.primary
                      : index % 3 === 1
                        ? colors.secondary
                        : colors.success
                  }
                />
              </View>
            ))
          ) : (
            <Text
              style={[
                styles.emptyText,
                { color: colors.textSecondary },
              ]}
            >
              No active goals yet. Create a goal to track its progress.
            </Text>
          )}
        </AppCard>

        {/* Activity by time */}
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Activity Distribution
          </Text>
        </View>

        <AppCard style={styles.activityCard}>
          {analytics.activityData.map((item) => (
            <View
              key={item.label}
              style={styles.activityItem}
            >
              <View style={styles.activityHeader}>
                <Text
                  style={[
                    styles.activityLabel,
                    { color: colors.text },
                  ]}
                >
                  {item.label}
                </Text>

                <Text
                  style={[
                    styles.activityValue,
                    { color: colors.textSecondary },
                  ]}
                >
                  {item.value}%
                </Text>
              </View>

              <ProgressBar
                progress={item.value}
                height={7}
                color={colors.primary}
              />
            </View>
          ))}

          {analytics.totalTimedTasks === 0 && (
            <Text
              style={[
                styles.emptyText,
                { color: colors.textSecondary },
              ]}
            >
              Complete tasks to see when you are most active.
            </Text>
          )}
        </AppCard>

        {/* Productivity insights */}
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Productivity Insights
          </Text>
        </View>

        <AppCard style={styles.insightCard}>
          <View
            style={[
              styles.insightIcon,
              { backgroundColor: colors.warningLight },
            ]}
          >
            <Lightbulb
              size={22}
              color={colors.warning}
            />
          </View>

          <View style={styles.insightContent}>
            <Text
              style={[
                styles.insightTitle,
                { color: colors.text },
              ]}
            >
              Your most productive day
            </Text>

            <Text
              style={[
                styles.insightDescription,
                { color: colors.textSecondary },
              ]}
            >
              {analytics.bestDay.completed > 0
                ? `${analytics.bestDay.day} was your most productive day with ${analytics.bestDay.completed} completed tasks.`
                : "No tasks have been completed in the last seven days. Start with one manageable task."}
            </Text>
          </View>
        </AppCard>

        <AppCard style={styles.insightCard}>
          <View
            style={[
              styles.insightIcon,
              { backgroundColor: colors.successLight },
            ]}
          >
            <Zap size={22} color={colors.success} />
          </View>

          <View style={styles.insightContent}>
            <Text
              style={[
                styles.insightTitle,
                { color: colors.text },
              ]}
            >
              Your consistency
            </Text>

            <Text
              style={[
                styles.insightDescription,
                { color: colors.textSecondary },
              ]}
            >
              {analytics.currentStreak > 0
                ? `You have maintained a ${analytics.currentStreak}-day completion streak. Keep completing tasks regularly.`
                : "You do not have an active streak yet. Completing at least one task each day can help build consistency."}
            </Text>
          </View>
        </AppCard>

        <AppCard style={styles.insightCard}>
          <View
            style={[
              styles.insightIcon,
              { backgroundColor: colors.dangerLight },
            ]}
          >
            <TrendingDown
              size={22}
              color={colors.danger}
            />
          </View>

          <View style={styles.insightContent}>
            <Text
              style={[
                styles.insightTitle,
                { color: colors.text },
              ]}
            >
              Room for improvement
            </Text>

            <Text
              style={[
                styles.insightDescription,
                { color: colors.textSecondary },
              ]}
            >
              {analytics.leastProductiveDay
                ? `${analytics.leastProductiveDay.day} had the fewest completed tasks (${analytics.leastProductiveDay.completed}) among days with activity. Consider planning smaller tasks on less productive days.`
                : "Your weekly activity will appear here once you start completing tasks."}
            </Text>
          </View>
        </AppCard>

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

  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },

  periodText: {
    fontSize: Typography.fontSize.sm,
  },

  scoreCard: {
    marginTop: Spacing.lg,
  },

  scoreContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
  },

  scoreInfo: {
    flex: 1,
    gap: Spacing.sm,
  },

  scoreLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },

  scoreValue: {
    fontSize: 38,
    fontWeight: Typography.fontWeight.bold,
  },

  scoreOutOf: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },

  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  trendText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },

  scoreDescription: {
    fontSize: Typography.fontSize.xs,
  },

  sectionHeader: {
    marginTop: Spacing["2xl"],
    marginBottom: Spacing.md,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },

  statCard: {
    width: "48%",
    flexGrow: 1,
    minHeight: 145,
    gap: Spacing.xs,
  },

  statIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },

  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },

  statLabel: {
    fontSize: Typography.fontSize.xs,
  },

  statTrend: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: 3,
  },

  chartCard: {
    gap: Spacing.xl,
  },

  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  chartValue: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
  },

  chartSubtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: 3,
  },

  chartBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },

  chartBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },

  chart: {
    flexDirection: "row",
    height: 165,
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },

  barColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },

  barValue: {
    fontSize: Typography.fontSize.xs,
  },

  barTrack: {
    width: "100%",
    height: 125,
    borderRadius: Radius.md,
    justifyContent: "flex-end",
    overflow: "hidden",
  },

  bar: {
    width: "100%",
    borderRadius: Radius.md,
  },

  barLabel: {
    fontSize: Typography.fontSize.xs,
  },

  goalProgressCard: {
    gap: Spacing.xl,
  },

  goalProgressItem: {
    gap: Spacing.sm,
  },

  goalProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  goalName: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginRight: Spacing.sm,
  },

  goalPercentage: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },

  activityCard: {
    gap: Spacing.lg,
  },

  activityItem: {
    gap: Spacing.sm,
  },

  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  activityLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },

  activityValue: {
    fontSize: Typography.fontSize.sm,
  },

  emptyText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.normal,
  },

  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  insightIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  insightContent: {
    flex: 1,
    gap: Spacing.sm,
  },

  insightTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },

  insightDescription: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.normal,
  },

  bottomSpace: {
    height: Spacing.xl,
  },
});
