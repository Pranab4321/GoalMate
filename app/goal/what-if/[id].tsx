
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Minus,
  Plus,
  RotateCcw,
  Play,
  TrendingUp,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import AppHeader from "@/components/common/AppHeader";
import AppCard from "@/components/common/AppCard";
import AppButton from "@/components/common/AppButton";

import { getGoalById } from "@/database/goalRepository";
import type { Goal } from "@/types/goal";

import {
  getGoalWhatIfSimulation,
} from "@/services/whatIfSimulationDataService";

import type {
  WhatIfSimulationResult,
} from "@/services/whatIfSimulationService";

const formatDateForStorage = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDate = (value: string | null): Date | null => {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value: string | null): string => {
  const date = parseDate(value);

  if (!date) return "No deadline";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const STATUS_LABELS: Record<string, string> = {
  achievable: "Achievable",
  at_risk: "At Risk",
  unachievable: "Unachievable",
  completed: "Completed",
  archived: "Archived",
  no_deadline: "No Deadline",
  invalid_deadline: "Invalid Deadline",
  overdue: "Deadline Passed",
  no_tasks: "No Remaining Tasks",
  invalid_daily_availability: "Invalid Daily Availability",
  missing_estimates: "Missing Task Estimates",
};

export default function WhatIfSimulationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const { id } = useLocalSearchParams<{ id: string }>();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [dailyHours, setDailyHours] = useState(2);
  const [deadline, setDeadline] = useState<Date | null>(null);

  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  const [simulation, setSimulation] =
    useState<WhatIfSimulationResult | null>(null);

  const loadGoal = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await getGoalById(id);

      if (!result) {
        Alert.alert("Goal not found", "This goal could not be loaded.");
        router.back();
        return;
      }

      setGoal(result);
      setDailyHours(Number(result.daily_available_hours ?? 2));
      setDeadline(parseDate(result.deadline));
      setSimulation(null);
    } catch (error) {
      console.error("Failed to load goal for simulation:", error);
      Alert.alert("Error", "Unable to load this goal.");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  const handleRunSimulation = async () => {
    if (!goal) return;

    try {
      setIsSimulating(true);

      const result = await getGoalWhatIfSimulation(
        goal.id,
        {
          dailyAvailableHours: dailyHours,
          deadline: deadline
            ? formatDateForStorage(deadline)
            : null,
        }
      );

      if (!result) {
        Alert.alert("Error", "Unable to calculate this simulation.");
        return;
      }

      setSimulation(result);
    } catch (error) {
      console.error("What-if simulation failed:", error);

      Alert.alert(
        "Simulation failed",
        error instanceof Error
          ? error.message
          : "Unable to calculate the simulated scenario."
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    if (!goal) return;

    setDailyHours(Number(goal.daily_available_hours ?? 2));
    setDeadline(parseDate(goal.deadline));
    setSimulation(null);
  };

  const renderResult = (
    title: string,
    result: WhatIfSimulationResult["original"]
  ) => {
    const statusColor =
      result.status === "achievable" || result.status === "completed"
        ? theme.success
        : result.status === "at_risk"
          ? theme.warning
          : result.status === "unachievable" || result.status === "overdue"
            ? theme.danger
            : theme.textSecondary;

    return (
      <AppCard padding={16}>
        <Text style={[styles.resultHeading, { color: theme.text }]}>
          {title}
        </Text>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColor + "18" },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {STATUS_LABELS[result.status] ?? result.status}
          </Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>
            Remaining workload
          </Text>
          <Text style={[styles.resultValue, { color: theme.text }]}>
            {(result.remainingWorkloadMinutes / 60).toFixed(1)} hours
          </Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>
            Available time
          </Text>
          <Text style={[styles.resultValue, { color: theme.text }]}>
            {result.availableMinutes === null
              ? "Not available"
              : `${(result.availableMinutes / 60).toFixed(1)} hours`}
          </Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>
            Days remaining
          </Text>
          <Text style={[styles.resultValue, { color: theme.text }]}>
            {result.daysRemaining ?? "—"}
          </Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>
            Time utilization
          </Text>
          <Text style={[styles.resultValue, { color: theme.text }]}>
            {result.utilizationPercent === null
              ? "—"
              : `${result.utilizationPercent}%`}
          </Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>
            Tasks without estimates
          </Text>
          <Text style={[styles.resultValue, { color: theme.text }]}>
            {result.missingEstimateTaskCount}
          </Text>
        </View>
      </AppCard>
    );
  };

  if (isLoading || !goal) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textSecondary, marginTop: 12 }}>
          Loading simulation...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader
        title="What-if Simulation"
        subtitle={goal.title}
        style={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
        }}
        leftAction={
          <Pressable
            onPress={() => router.back()}
            style={styles.headerButton}
            accessibilityRole="button"
          >
            <ArrowLeft size={22} color={theme.text} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <TrendingUp size={25} color={theme.primary} />
          <Text style={[styles.introTitle, { color: theme.text }]}>
            Experiment with your goal
          </Text>
          <Text style={[styles.introDescription, { color: theme.textSecondary }]}>
            Change your available hours or deadline to see how they affect
            your goal's feasibility. These changes are temporary and will
            not update your saved goal.
          </Text>
        </View>

        <AppCard padding={18}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Daily available hours
          </Text>

          <View style={styles.hoursControl}>
            <Pressable
              onPress={() =>
                setDailyHours((value) => Math.max(0.5, value - 0.5))
              }
              disabled={dailyHours <= 0.5}
              style={[
                styles.stepButton,
                { backgroundColor: theme.surfaceSecondary },
                dailyHours <= 0.5 && styles.disabled,
              ]}
            >
              <Minus size={20} color={theme.text} />
            </Pressable>

            <View style={styles.hoursValueContainer}>
              <Text style={[styles.hoursValue, { color: theme.primary }]}>
                {dailyHours.toFixed(1)}
              </Text>
              <Text style={[styles.muted, { color: theme.textSecondary }]}>
                hours per day
              </Text>
            </View>

            <Pressable
              onPress={() =>
                setDailyHours((value) => Math.min(24, value + 0.5))
              }
              disabled={dailyHours >= 24}
              style={[
                styles.stepButton,
                { backgroundColor: theme.surfaceSecondary },
                dailyHours >= 24 && styles.disabled,
              ]}
            >
              <Plus size={20} color={theme.text} />
            </Pressable>
          </View>

          <Text style={[styles.helper, { color: theme.textSecondary }]}>
            Original availability: {goal.daily_available_hours} hours/day
          </Text>
        </AppCard>

        <AppCard padding={18}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Simulated goal deadline
          </Text>

          <Pressable
            onPress={() => setShowDeadlinePicker(true)}
            style={[
              styles.dateButton,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <Calendar size={19} color={theme.primary} />
            <Text style={[styles.dateText, { color: theme.text }]}>
              {deadline
                ? formatDate(formatDateForStorage(deadline))
                : "No deadline"}
            </Text>
          </Pressable>

          {showDeadlinePicker && (
            <DateTimePicker
              value={deadline ?? new Date()}
              mode="date"
              display="default"
              onChange={(_, selectedDate) => {
                setShowDeadlinePicker(false);
                if (selectedDate) setDeadline(selectedDate);
              }}
            />
          )}

          <Pressable
            onPress={() => setDeadline(null)}
            style={styles.clearButton}
          >
            <Text style={[styles.clearText, { color: theme.primary }]}>
              Remove simulated deadline
            </Text>
          </Pressable>

          <Text style={[styles.helper, { color: theme.textSecondary }]}>
            Original deadline: {formatDate(goal.deadline)}
          </Text>
        </AppCard>

        <AppButton
          title="Run Simulation"
          onPress={handleRunSimulation}
          loading={isSimulating}
          fullWidth
          leftIcon={<Play size={18} color="#FFFFFF" />}
        />

        <AppButton
          title="Reset to Original Values"
          onPress={handleReset}
          variant="outline"
          fullWidth
          leftIcon={<RotateCcw size={17} color={theme.primary} />}
        />

        {simulation && (
          <View style={styles.resultsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Scenario comparison
            </Text>

            {renderResult("Original scenario", simulation.original)}

            {renderResult("Simulated scenario", simulation.simulated)}

            <AppCard padding={16}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                What changed?
              </Text>

              <Text style={[styles.helper, { color: theme.textSecondary }]}>
                Daily availability:{" "}
                {simulation.changes.dailyAvailableHoursChanged
                  ? `${goal.daily_available_hours} → ${dailyHours} hours/day`
                  : "No change"}
              </Text>

              <Text style={[styles.helper, { color: theme.textSecondary }]}>
                Deadline:{" "}
                {simulation.changes.deadlineChanged
                  ? `${formatDate(goal.deadline)} → ${
                      deadline
                        ? formatDate(formatDateForStorage(deadline))
                        : "No deadline"
                    }`
                  : "No change"}
              </Text>
            </AppCard>
          </View>
        )}

        <View style={styles.notice}>
          <Clock size={17} color={theme.textSecondary} />
          <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
            Simulation is temporary. Your saved goal, tasks, deadlines,
            and scheduled dates are never modified.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  headerButton: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: {
    gap: 8,
    marginBottom: 4,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  introDescription: {
    fontSize: 13,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  hoursControl: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.35,
  },
  hoursValueContainer: {
    alignItems: "center",
  },
  hoursValue: {
    fontSize: 32,
    fontWeight: "800",
  },
  muted: {
    fontSize: 13,
  },
  helper: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  dateButton: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  clearButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 5,
  },
  clearText: {
    fontSize: 13,
    fontWeight: "600",
  },
  resultsSection: {
    gap: 12,
    marginTop: 4,
  },
  resultHeading: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 11,
    gap: 8,
  },
  resultValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
