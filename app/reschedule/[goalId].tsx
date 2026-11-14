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
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import AppHeader from "@/components/common/AppHeader";
import AppCard from "@/components/common/AppCard";
import AppButton from "@/components/common/AppButton";
import { getGoalById } from "@/database/goalRepository";
import type { Goal } from "@/types/goal";
import type { ReschedulePlan, RescheduleFailureReason } from "@/services/rescheduleService";
import {
  applyRescheduleProposals,
  getGoalReschedulePlan,
} from "@/services/rescheduleDataService";
import { useTaskStore } from "@/store/taskStore";

const FAILURE_LABELS: Record<RescheduleFailureReason, string> = {
  missing_estimate: "Add a valid estimated duration before rescheduling.",
  invalid_task_deadline: "This task has an invalid deadline.",
  task_deadline_passed: "The task deadline has already passed.",
  no_available_capacity_before_deadline:
    "There is not enough available daily capacity before the deadline.",
  missing_deadline: "Set a task deadline or goal deadline before rescheduling.",
};

function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours > 0 && remainingMinutes > 0) return `${hours} hr ${remainingMinutes} min`;
  if (hours > 0) return `${hours} hr`;
  return `${remainingMinutes} min`;
}

export default function RescheduleReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const fetchTasks = useTaskStore((state) => state.fetchTasks);

  const [goal, setGoal] = useState<Goal | null>(null);
  const [plan, setPlan] = useState<ReschedulePlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlan = useCallback(async () => {
    if (!goalId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [goalResult, planResult] = await Promise.all([
        getGoalById(goalId),
        getGoalReschedulePlan(goalId),
      ]);

      setGoal(goalResult);
      setPlan(planResult);

      if (!goalResult || !planResult) {
        setError("This goal could not be found.");
      }
    } catch (loadError) {
      console.error("Failed to load rescheduling preview:", loadError);
      setError("Unable to create a rescheduling preview. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleApply = () => {
    if (!plan || !goalId || plan.proposals.length === 0) return;

    Alert.alert(
      "Apply proposed changes?",
      `GoalMate will update the scheduled dates of ${plan.proposals.length} task${plan.proposals.length === 1 ? "" : "s"}. Existing scheduled times and all other task details will remain unchanged.`,
      [
        { text: "Review again", style: "cancel" },
        {
          text: "Apply changes",
          onPress: async () => {
            setIsApplying(true);
            try {
              await applyRescheduleProposals(goalId, plan.proposals);
              await fetchTasks();
              Alert.alert(
                "Schedule updated",
                `${plan.proposals.length} task${plan.proposals.length === 1 ? " was" : "s were"} rescheduled successfully.`,
                [{ text: "Done", onPress: () => router.back() }]
              );
            } catch (applyError) {
              console.error("Failed to apply rescheduling plan:", applyError);
              Alert.alert(
                "Unable to apply schedule",
                applyError instanceof Error
                  ? applyError.message
                  : "Something went wrong. Your schedule was not changed."
              );
            } finally {
              setIsApplying(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader
        title="Review Rescheduling"
        style={{ paddingHorizontal: 16, paddingTop: insets.top + 8 }}
        leftAction={
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={styles.backAction}
          >
            <ArrowLeft size={22} color={theme.text} />
          </Pressable>
        }
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.mutedText, { color: theme.textSecondary }]}>
            Preparing your rescheduling preview...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <AlertCircle size={38} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <AppButton title="Try Again" onPress={loadPlan} leftIcon={<RefreshCw size={17} color="#FFFFFF" />} />
        </View>
      ) : plan && goal ? (
        <>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <AppCard padding={18}>
              <View style={styles.headingRow}>
                <CalendarClock size={24} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.goalTitle, { color: theme.text }]}>{goal.title}</Text>
                  <Text style={[styles.mutedText, { color: theme.textSecondary }]}>
                    Review the suggested dates before applying them.
                  </Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{plan.overdueTaskCount}</Text>
                  <Text style={[styles.mutedText, { color: theme.textSecondary }]}>Overdue</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: theme.success }]}>{plan.proposals.length}</Text>
                  <Text style={[styles.mutedText, { color: theme.textSecondary }]}>Can move</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: plan.unscheduledTasks.length ? theme.warning : theme.text }]}>{plan.unscheduledTasks.length}</Text>
                  <Text style={[styles.mutedText, { color: theme.textSecondary }]}>Need attention</Text>
                </View>
              </View>
            </AppCard>

            {plan.proposals.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Proposed date changes</Text>
                {plan.proposals.map((proposal) => (
                  <AppCard key={proposal.taskId} padding={16}>
                    <View style={styles.taskHeading}>
                      <Text style={[styles.taskTitle, { color: theme.text }]}>{proposal.taskTitle}</Text>
                      <CheckCircle2 size={20} color={theme.success} />
                    </View>
                    <View style={styles.dateChangeRow}>
                      <View style={styles.dateColumn}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Original date</Text>
                        <Text style={[styles.dateValue, { color: theme.text }]}>{formatDate(proposal.originalDate)}</Text>
                      </View>
                      <View style={styles.arrowContainer}>
                        <Text style={{ color: theme.primary, fontSize: 20 }}>→</Text>
                      </View>
                      <View style={styles.dateColumn}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Proposed date</Text>
                        <Text style={[styles.dateValue, { color: theme.success }]}>{formatDate(proposal.proposedDate)}</Text>
                      </View>
                    </View>
                    <View style={styles.metaRow}>
                      <Clock size={15} color={theme.textSecondary} />
                      <Text style={[styles.mutedText, { color: theme.textSecondary }]}>{formatDuration(proposal.estimatedDuration)}</Text>
                      <Text style={[styles.mutedText, { color: theme.textSecondary }]}>· {proposal.priority} priority</Text>
                    </View>
                    {proposal.scheduledTime ? (
                      <Text style={[styles.mutedText, { color: theme.textSecondary, marginTop: 6 }]}>Scheduled time remains {proposal.scheduledTime}</Text>
                    ) : null}
                  </AppCard>
                ))}
              </>
            ) : null}

            {plan.unscheduledTasks.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Tasks that need attention</Text>
                {plan.unscheduledTasks.map((task) => (
                  <AppCard key={task.taskId} padding={16}>
                    <View style={styles.taskHeading}>
                      <Text style={[styles.taskTitle, { color: theme.text, flex: 1 }]}>{task.taskTitle}</Text>
                      <AlertCircle size={19} color={theme.warning} />
                    </View>
                    <Text style={[styles.mutedText, { color: theme.textSecondary, marginTop: 6 }]}>
                      {FAILURE_LABELS[task.reason]}
                    </Text>
                    <Text style={[styles.mutedText, { color: theme.textMuted, marginTop: 5 }]}>Original date: {formatDate(task.originalDate)}</Text>
                  </AppCard>
                ))}
              </>
            ) : null}

            {plan.proposals.length === 0 && plan.unscheduledTasks.length === 0 ? (
              <AppCard padding={20}>
                <View style={styles.emptyState}>
                  <CheckCircle2 size={36} color={theme.success} />
                  <Text style={[styles.taskTitle, { color: theme.text }]}>Nothing to reschedule</Text>
                  <Text style={[styles.mutedText, { color: theme.textSecondary, textAlign: "center" }]}>
                    There are no overdue pending or in-progress tasks for this goal.
                  </Text>
                </View>
              </AppCard>
            ) : null}

            {plan.unscheduledTasks.length > 0 ? (
              <Text style={[styles.note, { color: theme.textSecondary }]}>
                Some tasks could not be assigned a new date. Review the reason shown for each task. These tasks will not be changed when you apply the available proposals.
              </Text>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, 16) }]}>
            <AppButton
              title="Cancel"
              onPress={() => router.back()}
              variant="outline"
              style={{ flex: 1 }}
            />
            <AppButton
              title={`Apply ${plan.proposals.length} change${plan.proposals.length === 1 ? "" : "s"}`}
              onPress={handleApply}
              disabled={plan.proposals.length === 0}
              loading={isApplying}
              style={{ flex: 1 }}
              leftIcon={<CheckCircle2 size={17} color="#FFFFFF" />}
            />
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  scrollContent: { padding: 16, paddingBottom: 24, gap: 14 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  goalTitle: { fontSize: 18, fontWeight: "700" },
  mutedText: { fontSize: 13, lineHeight: 19 },
  summaryRow: { flexDirection: "row", marginTop: 18, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(128,128,128,0.3)" },
  summaryItem: { flex: 1, alignItems: "center", gap: 3 },
  summaryValue: { fontSize: 23, fontWeight: "700" },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 4 },
  taskHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  taskTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  dateChangeRow: { flexDirection: "row", alignItems: "center", marginTop: 16, gap: 8 },
  dateColumn: { flex: 1, gap: 5 },
  label: { fontSize: 12, fontWeight: "600" },
  dateValue: { fontSize: 14, fontWeight: "700" },
  arrowContainer: { paddingHorizontal: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 },
  note: { fontSize: 12, lineHeight: 18, paddingHorizontal: 2 },
  emptyState: { alignItems: "center", gap: 10 },
  footer: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  backAction: { padding: 8 },
  errorText: { fontSize: 15, textAlign: "center", lineHeight: 22 },
});
