
import React from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import {
  ChevronLeft,
  Database,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Info,
  CheckCircle2,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";

const privacySections = [
  {
    icon: Database,
    title: "Your Data Storage",
    description:
      "GoalMate uses a local SQLite database on your device to store application data, including your goals, tasks, focus sessions, and preferences.",
    points: [
      "Your application data is stored locally on your device.",
      "Profile details and app preferences are saved in the local settings database.",
      "GoalMate does not use MongoDB to store this local application data.",
    ],
  },
  {
    icon: Sparkles,
    title: "AI Data Usage",
    description:
      "When you request an AI-generated goal roadmap, the information needed for that request is sent to the GoalMate backend and forwarded to Google's Gemini AI service to generate suggestions.",
    points: [
      "AI processing happens only when you request AI goal planning.",
      "The generated roadmap is shown for your review before it is saved.",
      "Avoid including passwords or other sensitive personal information in your goal descriptions.",
    ],
  },
  {
    icon: KeyRound,
    title: "API Key Security",
    description:
      "GoalMate keeps its Gemini API key on the backend instead of placing it inside the mobile application.",
    points: [
      "The mobile app communicates with the GoalMate backend for AI planning.",
      "The Gemini API key is configured through the backend environment.",
      "Backend rate limiting helps control repeated AI requests.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Your Privacy",
    description:
      "GoalMate is designed to keep your personal productivity information separate from the AI service unless information is needed for a feature you choose to use.",
    points: [
      "You decide when to request AI-powered planning.",
      "Review AI-generated tasks before approving and saving them.",
      "Do not share confidential information in goal or task descriptions.",
    ],
  },
];

export default function PrivacySecurityScreen() {
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
          Privacy & Security
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Introduction */}

        <View style={styles.heroSection}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: colors.primary },
            ]}
          >
            <ShieldCheck size={39} color="#FFFFFF" />
          </View>

          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Your Privacy Matters
          </Text>

          <Text
            style={[
              styles.heroDescription,
              { color: colors.textSecondary },
            ]}
          >
            Understand how GoalMate stores your information
            and uses AI-powered features.
          </Text>
        </View>

        {/* Privacy information */}

        {privacySections.map((section, index) => {
          const Icon = section.icon;

          return (
            <View style={styles.section} key={section.title}>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.sectionHeading}>
                  <View
                    style={[
                      styles.sectionIcon,
                      { backgroundColor: colors.primary + "18" },
                    ]}
                  >
                    <Icon size={21} color={colors.primary} />
                  </View>

                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.text },
                    ]}
                  >
                    {section.title}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.sectionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {section.description}
                </Text>

                <View
                  style={[
                    styles.divider,
                    { backgroundColor: colors.border },
                  ]}
                />

                {section.points.map((point) => (
                  <View style={styles.pointRow} key={point}>
                    <CheckCircle2
                      size={17}
                      color={colors.primary}
                      style={styles.pointIcon}
                    />

                    <Text
                      style={[
                        styles.pointText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {point}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}

        {/* Important information */}

        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Info size={21} color={colors.primary} />

          <View style={styles.noticeContent}>
            <Text
              style={[
                styles.noticeTitle,
                { color: colors.text },
              ]}
            >
              Important Information
            </Text>

            <Text
              style={[
                styles.noticeDescription,
                { color: colors.textSecondary },
              ]}
            >
              This page describes the current application's
              data-handling architecture. It does not mean that
              GoalMate provides cloud backup, account authentication,
              or a verified data-encryption guarantee. Avoid entering
              sensitive information into the app.
            </Text>
          </View>
        </View>

        {/* Footer */}

        <View style={styles.footer}>
          <Text style={[styles.footerTitle, { color: colors.text }]}>
            GoalMate
          </Text>

          <Text
            style={[
              styles.footerDescription,
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

  heroIcon: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
  },

  heroTitle: {
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
  },

  heroDescription: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 9,
    paddingHorizontal: 12,
  },

  section: {
    marginBottom: 17,
  },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  sectionIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },

  sectionDescription: {
    fontSize: 13,
    lineHeight: 21,
  },

  divider: {
    height: 1,
    marginVertical: 15,
  },

  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  pointIcon: {
    marginTop: 2,
    marginRight: 9,
  },

  pointText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },

  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 17,
    padding: 16,
    marginTop: 5,
  },

  noticeContent: {
    flex: 1,
    marginLeft: 11,
  },

  noticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 7,
  },

  noticeDescription: {
    fontSize: 12,
    lineHeight: 19,
  },

  footer: {
    alignItems: "center",
    paddingTop: 28,
    paddingBottom: 12,
  },

  footerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  footerDescription: {
    fontSize: 12,
    marginTop: 5,
  },
});
