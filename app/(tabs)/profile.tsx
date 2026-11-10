
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  UserRound,
  Settings,
  Bell,
  Moon,
  Sun,
  ShieldCheck,
  HelpCircle,
  Info,
  ChevronRight,
  Target,
  CheckCircle2,
  Clock3,
  Flame,
  LogOut,
  Pencil,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/theme";

import AppHeader from "@/components/common/AppHeader";
import AppCard from "@/components/common/AppCard";

export default function ProfileScreen() {
  const colors = useTheme();

  const showComingSoon = (feature: string) => {
    Alert.alert(
      "Coming soon",
      `${feature} settings will be available in a future update.`
    );
  };

  const settingsItems = [
    {
      title: "Notifications",
      subtitle: "Manage reminders and alerts",
      icon: Bell,
      action: () => showComingSoon("Notifications"),
    },
    {
      title: "Appearance",
      subtitle: "Light and dark theme preferences",
      icon: Moon,
      action: () => showComingSoon("Appearance"),
    },
    {
      title: "Privacy & Security",
      subtitle: "Manage your privacy settings",
      icon: ShieldCheck,
      action: () => showComingSoon("Privacy & Security"),
    },
  ];

  const supportItems = [
    {
      title: "Help & Support",
      subtitle: "Get help using GoalMate",
      icon: HelpCircle,
      action: () => showComingSoon("Help & Support"),
    },
    {
      title: "About GoalMate",
      subtitle: "Learn more about the application",
      icon: Info,
      action: () => showComingSoon("About GoalMate"),
    },
  ];

  const renderSettingItem = (
    item: (typeof settingsItems)[number]
  ) => {
    const Icon = item.icon;

    return (
      <Pressable
        key={item.title}
        onPress={item.action}
        style={styles.settingItem}
      >
        <View
          style={[
            styles.settingIcon,
            { backgroundColor: colors.primary + "18" },
          ]}
        >
          <Icon size={20} color={colors.primary} />
        </View>

        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            {item.title}
          </Text>

          <Text
            style={[
              styles.settingSubtitle,
              { color: colors.textSecondary },
            ]}
          >
            {item.subtitle}
          </Text>
        </View>

        <ChevronRight size={19} color={colors.textMuted} />
      </Pressable>
    );
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
          title="My Profile"
          subtitle="Manage your account and preferences."
        />

        {/* Profile Information */}

        <AppCard style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <UserRound size={38} color={colors.primary} />
            </View>

            <Pressable
              style={[
                styles.editButton,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={() => showComingSoon("Edit profile")}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Pencil size={17} color={colors.text} />
            </Pressable>
          </View>

          <Text style={[styles.userName, { color: colors.text }]}>
            GoalMate User
          </Text>

          <Text
            style={[
              styles.userEmail,
              { color: colors.textSecondary },
            ]}
          >
            Welcome to GoalMate
          </Text>

          <View
            style={[
              styles.memberBadge,
              { backgroundColor: colors.successLight },
            ]}
          >
            <CheckCircle2 size={14} color={colors.success} />

            <Text
              style={[
                styles.memberText,
                { color: colors.success },
              ]}
            >
              Active Member
            </Text>
          </View>
        </AppCard>

        {/* Productivity Summary */}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            My Productivity
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <AppCard style={styles.statCard}>
            <Target size={21} color={colors.primary} />

            <Text style={[styles.statValue, { color: colors.text }]}>
              4
            </Text>

            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Active Goals
            </Text>
          </AppCard>

          <AppCard style={styles.statCard}>
            <CheckCircle2 size={21} color={colors.success} />

            <Text style={[styles.statValue, { color: colors.text }]}>
              37
            </Text>

            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Tasks Done
            </Text>
          </AppCard>

          <AppCard style={styles.statCard}>
            <Clock3 size={21} color={colors.warning} />

            <Text style={[styles.statValue, { color: colors.text }]}>
              18.5h
            </Text>

            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Focus Hours
            </Text>
          </AppCard>

          <AppCard style={styles.statCard}>
            <Flame size={21} color={colors.danger} />

            <Text style={[styles.statValue, { color: colors.text }]}>
              5 Days
            </Text>

            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Current Streak
            </Text>
          </AppCard>
        </View>

        {/* Settings */}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Preferences
          </Text>
        </View>

        <AppCard style={styles.settingsCard}>
          {settingsItems.map(renderSettingItem)}
        </AppCard>

        {/* Support */}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Support & Information
          </Text>
        </View>

        <AppCard style={styles.settingsCard}>
          {supportItems.map(renderSettingItem)}
        </AppCard>

        {/* App information */}

        <View
          style={[
            styles.appInfo,
            { borderTopColor: colors.border },
          ]}
        >
          <View style={styles.appLogo}>
            <Target size={23} color="#FFFFFF" />
          </View>

          <Text style={[styles.appName, { color: colors.text }]}>
            GoalMate
          </Text>

          <Text
            style={[
              styles.appVersion,
              { color: colors.textSecondary },
            ]}
          >
            Version 1.0.0
          </Text>

          <Text
            style={[
              styles.appTagline,
              { color: colors.textMuted },
            ]}
          >
            Plan better. Work smarter. Achieve more.
          </Text>
        </View>

        {/* Sign out placeholder */}

        <Pressable
          onPress={() => showComingSoon("Sign out")}
          style={styles.logoutButton}
        >
          <LogOut size={19} color={colors.danger} />

          <Text style={[styles.logoutText, { color: colors.danger }]}>
            Sign Out
          </Text>
        </Pressable>

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

  profileCard: {
    alignItems: "center",
    marginTop: Spacing.xl,
    paddingVertical: Spacing["2xl"],
  },

  profileTop: {
    position: "relative",
    marginBottom: Spacing.md,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  editButton: {
    position: "absolute",
    right: -4,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  userName: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },

  userEmail: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
  },

  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },

  memberText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
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
    minHeight: 120,
    gap: Spacing.sm,
  },

  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },

  statLabel: {
    fontSize: Typography.fontSize.xs,
  },

  settingsCard: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },

  settingItem: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  settingInfo: {
    flex: 1,
    gap: 4,
  },

  settingTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  settingSubtitle: {
    fontSize: Typography.fontSize.xs,
  },

  appInfo: {
    alignItems: "center",
    borderTopWidth: 1,
    marginTop: Spacing["3xl"],
    paddingTop: Spacing["2xl"],
    gap: Spacing.sm,
  },

  appLogo: {
    width: 46,
    height: 46,
    borderRadius: Radius.lg,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },

  appName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },

  appVersion: {
    fontSize: Typography.fontSize.xs,
  },

  appTagline: {
    fontSize: Typography.fontSize.xs,
    textAlign: "center",
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing["2xl"],
    paddingVertical: Spacing.md,
  },

  logoutText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },

  bottomSpace: {
    height: Spacing.xl,
  },
});
