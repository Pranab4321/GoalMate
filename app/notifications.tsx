import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCircle2,
  Clock3,
  Settings,
  ShieldAlert,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/theme";
import AppHeader from "@/components/common/AppHeader";
import AppCard from "@/components/common/AppCard";
import AppButton from "@/components/common/AppButton";
import { useSettingsStore } from "@/store/settingsStore";
import { getDailyReminderStatus, type DailyReminderStatus } from "@/services/notificationService";

function formatReminderTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export default function NotificationsScreen() {
  const colors = useTheme();
  const router = useRouter();
  const settings = useSettingsStore((state) => state.settings);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);
  const [reminderStatus, setReminderStatus] = useState<DailyReminderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const refreshNotificationInfo = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      await fetchSettings();
      const latestSettings = useSettingsStore.getState().settings;
      if (latestSettings) {
        const status = await getDailyReminderStatus(latestSettings);
        setReminderStatus(status);
      }
    } catch (error) {
      console.error("Failed to load notification centre:", error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [fetchSettings]);

  useFocusEffect(
    useCallback(() => {
      void refreshNotificationInfo();
    }, [refreshNotificationInfo])
  );

  const reminderEnabled = Boolean(
    settings?.notifications_enabled && settings?.daily_reminder_enabled
  );

  let statusTitle = "Reminder is scheduled";
  let statusDescription = "GoalMate will remind you every day at the selected time.";
  let StatusIcon = CheckCircle2;
  let statusColor: string = colors.success;
  let statusBackground: string = colors.successLight;

  if (reminderStatus?.status === "disabled") {
    statusTitle = "Daily reminder is turned off";
    statusDescription = "You can enable it anytime from your notification preferences.";
    StatusIcon = BellOff;
    statusColor = colors.textSecondary;
    statusBackground = colors.surfaceSecondary;
  } else if (reminderStatus?.status === "permission-denied") {
    statusTitle = "Notification permission is off";
    statusDescription = reminderStatus.canAskAgain
      ? "Allow notifications on your device to receive the daily reminder."
      : "Notifications are blocked by your device. Enable them in your phone settings.";
    StatusIcon = ShieldAlert;
    statusColor = colors.warning;
    statusBackground = colors.warningLight;
  } else if (reminderStatus?.status === "not-scheduled") {
    statusTitle = "Reminder is not scheduled";
    statusDescription = "Your preference is enabled, but no GoalMate daily reminder is currently scheduled.";
    StatusIcon = Bell;
    statusColor = colors.warning;
    statusBackground = colors.warningLight;
  } else if (reminderStatus?.status === "unsupported") {
    statusTitle = "Reminders are unavailable";
    statusDescription = "Local scheduled notifications are not supported on this platform.";
    StatusIcon = BellOff;
    statusColor = colors.textSecondary;
    statusBackground = colors.surfaceSecondary;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader
          title="Notification Centre"
          subtitle="Your reminders and alerts"
          leftAction={
            <Pressable
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: colors.surface }]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={20} color={colors.text} />
            </Pressable>
          }
        />

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>Checking your reminders...</Text>
          </View>
        ) : loadError ? (
          <AppCard padding={Spacing.xl}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Unable to load notifications</Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>Please try again.</Text>
            <AppButton title="Try again" onPress={() => void refreshNotificationInfo()} style={styles.actionButton} />
          </AppCard>
        ) : (
          <>
            <View style={styles.sectionHeading}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your reminders</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>A quick overview of what GoalMate has scheduled</Text>
            </View>

            <AppCard padding={Spacing.xl}>
              <View style={styles.statusHeader}>
                <View style={[styles.statusIcon, { backgroundColor: statusBackground }]} >
                  <StatusIcon size={23} color={statusColor} />
                </View>
                <View style={styles.statusCopy}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{statusTitle}</Text>
                  <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{statusDescription}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.reminderRow}>
                <View style={styles.reminderLabel}>
                  <Clock3 size={18} color={colors.primary} />
                  <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Daily reminder time</Text>
                </View>
                <Text style={[styles.timeValue, { color: colors.text }]}>
                  {settings?.daily_reminder_time ? formatReminderTime(settings.daily_reminder_time) : "Not set"}
                </Text>
              </View>
              <View style={styles.reminderRow}>
                <View style={styles.reminderLabel}>
                  <Bell size={18} color={colors.primary} />
                  <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Reminder preference</Text>
                </View>
                <Text style={[styles.preferenceValue, { color: reminderEnabled ? colors.success : colors.textSecondary }]}>
                  {reminderEnabled ? "Enabled" : "Disabled"}
                </Text>
              </View>
            </AppCard>

            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSecondary }]} >
                <Bell size={25} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No other notifications</Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                When GoalMate has more in-app notification types, they will appear here.
              </Text>
            </View>

            <AppButton
              title="Manage notification settings"
              onPress={() => router.push("/(tabs)/profile")}
              variant="outline"
              fullWidth
              leftIcon={<Settings size={18} color={colors.primary} />}
              style={styles.settingsButton}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing["4xl"], gap: Spacing.lg },
  backButton: { width: 42, height: 42, borderRadius: Radius.md, alignItems: "center", justifyContent: "center" },
  sectionHeading: { gap: 4, marginTop: Spacing.sm },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold },
  sectionSubtitle: { fontSize: Typography.fontSize.sm, lineHeight: 20 },
  loading: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: Spacing.md },
  helperText: { fontSize: Typography.fontSize.sm },
  statusHeader: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.md },
  statusIcon: { width: 46, height: 46, borderRadius: Radius.lg, alignItems: "center", justifyContent: "center" },
  statusCopy: { flex: 1, gap: 5 },
  cardTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  bodyText: { fontSize: Typography.fontSize.sm, lineHeight: 20 },
  divider: { height: 1, marginVertical: Spacing.lg },
  reminderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.md, marginTop: Spacing.sm },
  reminderLabel: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, flex: 1 },
  rowLabel: { fontSize: Typography.fontSize.sm },
  timeValue: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  preferenceValue: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold },
  emptyState: { alignItems: "center", paddingHorizontal: Spacing.xl, paddingVertical: Spacing["2xl"], gap: Spacing.sm },
  emptyIcon: { width: 54, height: 54, borderRadius: Radius.full, alignItems: "center", justifyContent: "center", marginBottom: Spacing.xs },
  emptyTitle: { fontSize: Typography.fontSize.md, fontWeight: Typography.fontWeight.semibold },
  emptyDescription: { fontSize: Typography.fontSize.sm, lineHeight: 21, textAlign: "center" },
  settingsButton: { marginTop: Spacing.xs },
  actionButton: { marginTop: Spacing.md, alignSelf: "flex-start" },
});
