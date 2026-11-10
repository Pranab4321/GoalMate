
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import {
  Plus,
  Target,
  CalendarDays,
  BookOpen,
  Code2,
  Dumbbell,
  BriefcaseBusiness,
  ArrowRight,
  RefreshCw,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/theme";

import AppHeader from "@/components/common/AppHeader";
import AppCard from "@/components/common/AppCard";
import AppButton from "@/components/common/AppButton";
import ProgressBar from "@/components/common/ProgressBar";
import EmptyState from "@/components/common/EmptyState";

import { useGoalStore } from "@/store/goalStore";
import type { Goal, GoalCategory } from "@/types/goal";

type FilterType = "all" | "active" | "completed";

export default function GoalsScreen() {
  const colors = useTheme();
  const router = useRouter();

  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>("all");

  const goals = useGoalStore((state) => state.goals);
  const isLoading = useGoalStore((state) => state.isLoading);
  const error = useGoalStore((state) => state.error);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);
  const clearError = useGoalStore((state) => state.clearError);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const filteredGoals = goals.filter((goal) => {
    if (selectedFilter === "all") {
      return true;
    }

    return goal.status === selectedFilter;
  });

  const activeCount = goals.filter(
    (goal) => goal.status === "active"
  ).length;

  const completedCount = goals.filter(
    (goal) => goal.status === "completed"
  ).length;

  const getGoalIcon = (category: GoalCategory) => {
    const iconProps = {
      size: 23,
      color: colors.primary,
    };

    switch (category) {
      case "Academic":
        return <BookOpen {...iconProps} />;

      case "Career":
        return <BriefcaseBusiness {...iconProps} />;

      case "Health":
        return <Dumbbell {...iconProps} />;

      case "Personal":
        return <Target {...iconProps} />;

      case "Finance":
        return <Target {...iconProps} />;

      default:
        return <Code2 {...iconProps} />;
    }
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) {
      return "No deadline";
    }

    const date = new Date(`${deadline.slice(0, 10)}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return deadline;
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (status: Goal["status"]) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "archived":
        return "Archived";
      default:
        return "In Progress";
    }
  };

  const getStatusColor = (status: Goal["status"]) => {
    if (status === "completed") {
      return colors.success;
    }

    if (status === "archived") {
      return colors.textSecondary;
    }

    return colors.warning;
  };

  const getStatusBackground = (status: Goal["status"]) => {
    if (status === "completed") {
      return colors.successLight;
    }

    if (status === "archived") {
      return colors.surfaceSecondary;
    }

    return colors.warningLight;
  };

  const openGoal = (id: string) => {
    router.push(`/goal/${id}`);
  };

  const handleRetry = () => {
    clearError();
    fetchGoals();
  };

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
          title="My Goals"
          subtitle="Turn your dreams into achievable goals."
          rightAction={
            <Pressable
              onPress={() => router.push("/goal/create")}
              style={[
                styles.addButton,
                { backgroundColor: colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Create new goal"
            >
              <Plus size={22} color="#FFFFFF" />
            </Pressable>
          }
        />

        {/* Goal Summary */}

        <View style={styles.summaryRow}>
          <AppCard style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: colors.primary + "18" },
              ]}
            >
              <Target size={21} color={colors.primary} />
            </View>

            <Text
              style={[styles.summaryNumber, { color: colors.text }]}
            >
              {goals.length}
            </Text>

            <Text
              style={[
                styles.summaryLabel,
                { color: colors.textSecondary },
              ]}
            >
              Total Goals
            </Text>
          </AppCard>

          <AppCard style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: colors.warningLight },
              ]}
            >
              <Target size={21} color={colors.warning} />
            </View>

            <Text
              style={[styles.summaryNumber, { color: colors.text }]}
            >
              {activeCount}
            </Text>

            <Text
              style={[
                styles.summaryLabel,
                { color: colors.textSecondary },
              ]}
            >
              Active
            </Text>
          </AppCard>

          <AppCard style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: colors.successLight },
              ]}
            >
              <Target size={21} color={colors.success} />
            </View>

            <Text
              style={[styles.summaryNumber, { color: colors.text }]}
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

        {/* Create Goal Banner */}

        <AppCard
          style={[
            styles.createBanner,
            { backgroundColor: colors.primary },
          ]}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>
                Have a new goal?
              </Text>

              <Text style={styles.bannerDescription}>
                Let AI break it into manageable tasks.
              </Text>
            </View>

            <View style={styles.bannerIcon}>
              <Target size={35} color="#FFFFFF" />
            </View>
          </View>

          <AppButton
            title="Create New Goal"
            onPress={() => router.push("/goal/create")}
            variant="secondary"
            fullWidth
            leftIcon={<Plus size={18} color={colors.text} />}
          />
        </AppCard>

        {/* Filters */}

        <View style={styles.filterSection}>
          <Text
            style={[styles.sectionTitle, { color: colors.text }]}
          >
            Your Goals
          </Text>

          <View
            style={[
              styles.filterContainer,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            {(
              ["all", "active", "completed"] as FilterType[]
            ).map((filter) => {
              const isSelected = selectedFilter === filter;

              return (
                <Pressable
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
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
                    {filter.charAt(0).toUpperCase() +
                      filter.slice(1)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Loading State */}

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
              Loading your goals...
            </Text>
          </View>
        ) : error ? (
          /* Error State */

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
                <RefreshCw size={17} color={colors.primary} />
              }
            />
          </View>
        ) : filteredGoals.length === 0 ? (
          /* Empty State */

          <EmptyState
            title={
              selectedFilter === "all"
                ? "No goals yet"
                : `No ${selectedFilter} goals`
            }
            description="Create a new goal and start making progress."
            icon={<Target size={34} color={colors.primary} />}
            actionLabel="Create Goal"
            onAction={() => router.push("/goal/create")}
          />
        ) : (
          /* Goal List */

          <View style={styles.goalList}>
            {filteredGoals.map((goal) => {
              const statusColor = getStatusColor(goal.status);
              const statusBackground =
                getStatusBackground(goal.status);

              return (
                <Pressable
                  key={goal.id}
                  onPress={() => openGoal(goal.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open goal ${goal.title}`}
                >
                  <AppCard style={styles.goalCard}>
                    <View style={styles.goalTopRow}>
                      <View
                        style={[
                          styles.goalIcon,
                          {
                            backgroundColor:
                              colors.primary + "18",
                          },
                        ]}
                      >
                        {getGoalIcon(goal.category)}
                      </View>

                      <View style={styles.goalHeading}>
                        <Text
                          style={[
                            styles.goalTitle,
                            { color: colors.text },
                          ]}
                        >
                          {goal.title}
                        </Text>

                        <Text
                          style={[
                            styles.goalCategory,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {goal.category}
                        </Text>
                      </View>

                      <ArrowRight
                        size={19}
                        color={colors.textMuted}
                      />
                    </View>

                    <Text
                      style={[
                        styles.goalDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {goal.description || "No description provided."}
                    </Text>

                    <View style={styles.progressHeader}>
                      <Text
                        style={[
                          styles.progressLabel,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Progress
                      </Text>

                      <Text
                        style={[
                          styles.progressValue,
                          { color: colors.primary },
                        ]}
                      >
                        {Math.round(goal.progress)}%
                      </Text>
                    </View>

                    <ProgressBar
                      progress={goal.progress}
                      height={8}
                      color={
                        goal.status === "completed"
                          ? colors.success
                          : colors.primary
                      }
                    />

                    <View style={styles.goalFooter}>
                      <View style={styles.deadlineInfo}>
                        <CalendarDays
                          size={15}
                          color={colors.textSecondary}
                        />

                        <Text
                          style={[
                            styles.deadlineText,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {formatDeadline(goal.deadline)}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusBackground },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusColor },
                          ]}
                        >
                          {getStatusLabel(goal.status)}
                        </Text>
                      </View>
                    </View>
                  </AppCard>
                </Pressable>
              );
            })}
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

  summaryRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },

  summaryCard: {
    flex: 1,
    padding: Spacing.md,
    minHeight: 115,
  },

  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },

  summaryNumber: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },

  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    marginTop: 3,
  },

  createBanner: {
    marginTop: Spacing.xl,
    backgroundColor: "#7C3AED",
    borderWidth: 0,
    gap: Spacing.lg,
  },

  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bannerTextContainer: {
    flex: 1,
    gap: Spacing.xs,
  },

  bannerTitle: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },

  bannerDescription: {
    color: "#FFFFFF",
    opacity: 0.85,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.normal,
  },

  bannerIcon: {
    marginLeft: Spacing.md,
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
    padding: 4,
    borderRadius: Radius.lg,
    gap: 4,
  },

  filterButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: Radius.md,
  },

  filterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  goalList: {
    gap: Spacing.md,
  },

  goalCard: {
    gap: Spacing.md,
  },

  goalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  goalHeading: {
    flex: 1,
    gap: 4,
  },

  goalTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },

  goalCategory: {
    fontSize: Typography.fontSize.xs,
  },

  goalDescription: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.normal,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  progressLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },

  progressValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },

  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },

  deadlineInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  deadlineText: {
    fontSize: Typography.fontSize.xs,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },

  statusText: {
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
