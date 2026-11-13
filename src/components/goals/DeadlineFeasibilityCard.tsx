import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AlertCircle, CheckCircle2, Clock3, RefreshCw, ShieldAlert, Target } from "lucide-react-native";

import AppCard from "@/components/common/AppCard";
import { useTheme } from "@/hooks/use-theme";
import type {
  DeadlineFeasibilityResult,
  DeadlineFeasibilityStatus,
} from "@/services/deadlineFeasibilityService";

interface DeadlineFeasibilityCardProps {
  result: DeadlineFeasibilityResult | null;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}

const statusContent: Record<DeadlineFeasibilityStatus, { title: string; description: string; color: "success" | "warning" | "danger" | "textMuted" }> = {
  achievable: { title: "Achievable", description: "Your remaining workload fits comfortably within your available time.", color: "success" },
  at_risk: { title: "At Risk", description: "You may finish on time, but there is limited room for unexpected delays.", color: "warning" },
  unachievable: { title: "Unachievable", description: "Your remaining workload exceeds the available time before the deadline.", color: "danger" },
  completed: { title: "Goal Completed", description: "This goal is already marked as completed.", color: "success" },
  archived: { title: "Goal Archived", description: "Feasibility is not calculated for archived goals.", color: "textMuted" },
  no_deadline: { title: "Deadline Not Set", description: "Add a deadline to calculate whether this goal can be completed on time.", color: "textMuted" },
  invalid_deadline: { title: "Invalid Deadline", description: "The saved deadline could not be understood. Please edit the goal deadline.", color: "danger" },
  overdue: { title: "Deadline Passed", description: "This goal's deadline has already passed.", color: "danger" },
  no_tasks: { title: "No Remaining Tasks", description: "There are no pending or in-progress tasks left to estimate.", color: "success" },
  invalid_daily_availability: { title: "Daily Time Needed", description: "Set a valid daily available time greater than zero to calculate feasibility.", color: "warning" },
  missing_estimates: { title: "Task Estimates Needed", description: "Some remaining tasks have no valid time estimate. Add estimates for a reliable result.", color: "warning" },
};

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
}

export default function DeadlineFeasibilityCard({
  result,
  isLoading,
  hasError,
  onRetry,
}: DeadlineFeasibilityCardProps) {
  const theme = useTheme();

  const renderMetric = (label: string, value: string) => (
    <View style={styles.metric}>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );

  return (
    <AppCard padding={18}>
      <View style={styles.header}>
        <View style={styles.headingRow}>
          <Target size={20} color={theme.primary} />
          <Text style={[styles.heading, { color: theme.text }]}>Deadline Feasibility</Text>
        </View>
        <Text style={[styles.caption, { color: theme.textSecondary }]}>
          Based on remaining task estimates and your daily available time
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.primary} />
          <Text style={{ color: theme.textSecondary }}>Calculating feasibility...</Text>
        </View>
      ) : hasError ? (
        <View style={styles.messageRow}>
          <AlertCircle size={20} color={theme.danger} />
          <View style={styles.messageContent}>
            <Text style={[styles.statusTitle, { color: theme.danger }]}>Unable to calculate</Text>
            <Text style={{ color: theme.textSecondary }}>There was a problem loading this goal's feasibility data.</Text>
            <Pressable onPress={onRetry} style={styles.retryButton}>
              <RefreshCw size={15} color={theme.primary} />
              <Text style={{ color: theme.primary, fontWeight: "600" }}>Try again</Text>
            </Pressable>
          </View>
        </View>
      ) : !result ? (
        <Text style={{ color: theme.textSecondary }}>Feasibility information is not available.</Text>
      ) : (
        <>
          {(() => {
            const content = statusContent[result.status];
            const statusColor = theme[content.color];
            const StatusIcon = result.status === "achievable" || result.status === "completed" || result.status === "no_tasks"
              ? CheckCircle2
              : result.status === "at_risk" || result.status === "missing_estimates" || result.status === "invalid_daily_availability"
                ? ShieldAlert
                : result.status === "unachievable" || result.status === "overdue" || result.status === "invalid_deadline"
                  ? AlertCircle
                  : Clock3;

            return (
              <View style={styles.statusBlock}>
                <View style={styles.statusRow}>
                  <StatusIcon size={21} color={statusColor} />
                  <Text style={[styles.statusTitle, { color: statusColor }]}>{content.title}</Text>
                </View>
                <Text style={[styles.description, { color: theme.textSecondary }]}>{content.description}</Text>
              </View>
            );
          })()}

          <View style={[styles.metrics, { borderTopColor: theme.border }]}>
            {renderMetric("Remaining tasks", String(result.remainingTaskCount))}
            {renderMetric("Known workload", formatDuration(result.remainingWorkloadMinutes))}
            {result.daysRemaining !== null && renderMetric("Days remaining", String(result.daysRemaining))}
          </View>

          {result.availableMinutes !== null && (
            <View style={[styles.detailBox, { backgroundColor: theme.surfaceSecondary }]}>
              <View style={styles.detailRow}>
                <Text style={{ color: theme.textSecondary }}>Available time</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{formatDuration(result.availableMinutes)}</Text>
              </View>
              {result.utilizationPercent !== null && (
                <View style={styles.detailRow}>
                  <Text style={{ color: theme.textSecondary }}>Time utilization</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{result.utilizationPercent}%</Text>
                </View>
              )}
              {result.spareMinutes !== null && result.spareMinutes >= 0 && (
                <View style={styles.detailRow}>
                  <Text style={{ color: theme.textSecondary }}>Spare capacity</Text>
                  <Text style={[styles.detailValue, { color: theme.success }]}>{formatDuration(result.spareMinutes)}</Text>
                </View>
              )}
            </View>
          )}

          {result.missingEstimateTaskCount > 0 && (
            <Text style={[styles.note, { color: theme.warning }]}>
              {result.missingEstimateTaskCount} remaining task(s) need a valid estimate.
            </Text>
          )}
        </>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 14 },
  headingRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  heading: { fontSize: 17, fontWeight: "700" },
  caption: { fontSize: 12, marginTop: 5, lineHeight: 18 },
  centered: { alignItems: "center", gap: 10, paddingVertical: 18 },
  messageRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  messageContent: { flex: 1, gap: 6 },
  statusBlock: { gap: 7 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusTitle: { fontSize: 16, fontWeight: "700" },
  description: { fontSize: 13, lineHeight: 19 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 18, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 16, paddingTop: 14 },
  metric: { minWidth: 82, flex: 1, gap: 4 },
  metricValue: { fontSize: 15, fontWeight: "700" },
  metricLabel: { fontSize: 11 },
  detailBox: { borderRadius: 10, padding: 12, marginTop: 14, gap: 9 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  detailValue: { fontSize: 13, fontWeight: "600" },
  note: { fontSize: 12, marginTop: 12, lineHeight: 18 },
  retryButton: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5, alignSelf: "flex-start" },
});
