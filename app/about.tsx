
import React from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import {
  Target,
  ChevronLeft,
  Sparkles,
  ListChecks,
  Timer,
  ChartNoAxesCombined,
  Bell,
  CheckCircle2,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";

const features = [
  {
    icon: Sparkles,
    title: "AI Goal Breakdown",
    description:
      "Turn your goals into manageable tasks with an AI-generated roadmap that you can review and approve.",
  },
  {
    icon: ListChecks,
    title: "Task Management",
    description:
      "Organize your work, track tasks, and monitor your progress toward completing your goals.",
  },
  {
    icon: Timer,
    title: "Focus Timer",
    description:
      "Stay focused with Pomodoro sessions, short breaks, and long breaks.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Productivity Analytics",
    description:
      "Understand your productivity through progress summaries, task activity, and focus-time statistics.",
  },
  {
    icon: Bell,
    title: "Daily Reminders",
    description:
      "Set reminders to help you stay consistent with your goals and daily activities.",
  },
];

export default function AboutScreen() {
  const colors = useTheme();

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background },
      ]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backButton,
            { backgroundColor: colors.surfaceSecondary },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={23} color={colors.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          About GoalMate
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App identity */}

        <View style={styles.heroSection}>
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: colors.primary },
            ]}
          >
            <Target size={42} color="#FFFFFF" />
          </View>

          <Text style={[styles.appName, { color: colors.text }]}>
            GoalMate
          </Text>

          <Text
            style={[
              styles.tagline,
              { color: colors.textSecondary },
            ]}
          >
            Plan better. Work smarter. Achieve more.
          </Text>

          <View
            style={[
              styles.versionBadge,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Text
              style={[
                styles.versionText,
                { color: colors.textSecondary },
              ]}
            >
              Version 1.0.0
            </Text>
          </View>
        </View>

        {/* About the app */}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About the App
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.description,
                { color: colors.textSecondary },
              ]}
            >
              GoalMate is a productivity and goal management application
              designed to help you turn your ambitions into actionable
              plans.
              {"\n\n"}
              Create goals, break them into manageable tasks with AI,
              stay focused with dedicated work sessions, and understand
              your progress through productivity analytics.
              {"\n\n"}
              Our aim is to make planning easier and help you build
              consistent habits toward achieving your goals.
            </Text>
          </View>
        </View>

        {/* Features */}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Key Features
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <View key={feature.title}>
                  <View style={styles.featureItem}>
                    <View
                      style={[
                        styles.featureIcon,
                        { backgroundColor: colors.primary + "18" },
                      ]}
                    >
                      <Icon size={21} color={colors.primary} />
                    </View>

                    <View style={styles.featureInfo}>
                      <Text
                        style={[
                          styles.featureTitle,
                          { color: colors.text },
                        ]}
                      >
                        {feature.title}
                      </Text>

                      <Text
                        style={[
                          styles.featureDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {feature.description}
                      </Text>
                    </View>
                  </View>

                  {index !== features.length - 1 && (
                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Purpose */}

        <View style={styles.section}>
          <View
            style={[
              styles.purposeCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <CheckCircle2 size={24} color={colors.primary} />

            <Text
              style={[
                styles.purposeTitle,
                { color: colors.text },
              ]}
            >
              Our Purpose
            </Text>

            <Text
              style={[
                styles.purposeDescription,
                { color: colors.textSecondary },
              ]}
            >
              Big achievements begin with small, consistent actions.
              GoalMate is here to help you plan those actions, stay
              focused, and keep moving forward.
            </Text>
          </View>
        </View>

        {/* Footer */}

        <View style={styles.footer}>
          <Text style={[styles.footerName, { color: colors.text }]}>
            GoalMate
          </Text>

          <Text
            style={[
              styles.footerText,
              { color: colors.textMuted },
            ]}
          >
            Plan better. Work smarter. Achieve more.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  headerSpacer: {
    width: 42,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 35,
  },

  heroSection: {
    alignItems: "center",
    paddingTop: 25,
    paddingBottom: 30,
  },

  logoContainer: {
    width: 82,
    height: 82,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  appName: {
    fontSize: 27,
    fontWeight: "800",
  },

  tagline: {
    fontSize: 14,
    marginTop: 7,
    textAlign: "center",
  },

  versionBadge: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 14,
  },

  versionText: {
    fontSize: 12,
    fontWeight: "600",
  },

  section: {
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 13,
  },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
  },

  description: {
    fontSize: 14,
    lineHeight: 23,
  },

  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },

  featureIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  featureInfo: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 5,
  },

  featureDescription: {
    fontSize: 13,
    lineHeight: 20,
  },

  divider: {
    height: 1,
    marginVertical: 9,
  },

  purposeCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
  },

  purposeTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },

  purposeDescription: {
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
  },

  footer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 15,
  },

  footerName: {
    fontSize: 15,
    fontWeight: "700",
  },

  footerText: {
    fontSize: 12,
    marginTop: 5,
  },
});
