
import React, { useState } from "react";

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
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Target,
  Sparkles,
  ListChecks,
  Timer,
  ChartNoAxesCombined,
  Bell,
  Moon,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";

const helpSections = [
  {
    title: "Getting Started",
    icon: Target,
    questions: [
      {
        question: "How do I create a goal?",
        answer:
          "Open the Goals tab and select the option to create a new goal. Enter your goal details, description, and deadline, then follow the on-screen instructions.",
      },
      {
        question: "How does AI Goal Breakdown work?",
        answer:
          "After entering your goal details, request an AI breakdown. GoalMate generates a suggested task roadmap. You can review, edit, or remove suggested tasks before approving and saving them.",
      },
    ],
  },
  {
    title: "Task Management",
    icon: ListChecks,
    questions: [
      {
        question: "How do I manage my tasks?",
        answer:
          "Open the Tasks tab to view your tasks. You can access individual tasks to review their details and update their progress.",
      },
      {
        question: "Are AI-generated tasks saved automatically?",
        answer:
          "No. You must review and approve the AI-generated roadmap before GoalMate saves the goal and its tasks.",
      },
    ],
  },
  {
    title: "Focus Timer",
    icon: Timer,
    questions: [
      {
        question: "How do I use the Focus Timer?",
        answer:
          "Open the Focus Timer from the Home screen or its available navigation option. Choose a focus session, start the timer, and use pause or resume when needed.",
      },
      {
        question: "Are interrupted focus sessions counted in Analytics?",
        answer:
          "No. Analytics counts completed focus sessions only. Interrupted sessions and break sessions are excluded from total focus time.",
      },
    ],
  },
  {
    title: "Analytics",
    icon: ChartNoAxesCombined,
    questions: [
      {
        question: "What does Analytics show?",
        answer:
          "Analytics helps you understand your productivity through your productivity score, task activity, goal progress, activity distribution, insights, and completed focus time.",
      },
    ],
  },
  {
    title: "Notifications & Settings",
    icon: Bell,
    questions: [
      {
        question: "How can I change my reminder settings?",
        answer:
          "Open Profile, select Notifications, and manage your notification preferences and daily reminder time.",
      },
      {
        question: "Can I change the app appearance?",
        answer:
          "Yes. Open Profile, select Appearance, and choose System, Light, or Dark mode.",
      },
      {
        question: "Can I change focus and break durations?",
        answer:
          "Yes. Open Profile, select Focus Settings, and update your focus, short break, and long break durations.",
      },
    ],
  },
];

export default function HelpSupportScreen() {
  const colors = useTheme();

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleQuestion = (question: string) => {
    setExpandedItems((previous) =>
      previous.includes(question)
        ? previous.filter((item) => item !== question)
        : [...previous, question]
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
          Help & Support
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroSection}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: colors.primary + "18" },
            ]}
          >
            <HelpCircle size={38} color={colors.primary} />
          </View>

          <Text style={[styles.heroTitle, { color: colors.text }]}>
            How can we help?
          </Text>

          <Text
            style={[
              styles.heroDescription,
              { color: colors.textSecondary },
            ]}
          >
            Find answers to common questions and learn how to use GoalMate.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Frequently Asked Questions
          </Text>

          {helpSections.map((section) => {
            const SectionIcon = section.icon;

            return (
              <View key={section.title} style={styles.sectionGroup}>
                <View style={styles.groupHeader}>
                  <View
                    style={[
                      styles.groupIcon,
                      { backgroundColor: colors.primary + "18" },
                    ]}
                  >
                    <SectionIcon size={19} color={colors.primary} />
                  </View>

                  <Text
                    style={[
                      styles.groupTitle,
                      { color: colors.text },
                    ]}
                  >
                    {section.title}
                  </Text>
                </View>

                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  {section.questions.map((item, index) => {
                    const isExpanded = expandedItems.includes(
                      item.question
                    );

                    return (
                      <View key={item.question}>
                        <Pressable
                          onPress={() =>
                            toggleQuestion(item.question)
                          }
                          style={styles.questionRow}
                          accessibilityRole="button"
                          accessibilityState={{
                            expanded: isExpanded,
                          }}
                        >
                          <Text
                            style={[
                              styles.questionText,
                              { color: colors.text },
                            ]}
                          >
                            {item.question}
                          </Text>

                          {isExpanded ? (
                            <ChevronUp
                              size={19}
                              color={colors.textSecondary}
                            />
                          ) : (
                            <ChevronDown
                              size={19}
                              color={colors.textSecondary}
                            />
                          )}
                        </Pressable>

                        {isExpanded && (
                          <Text
                            style={[
                              styles.answerText,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {item.answer}
                          </Text>
                        )}

                        {index !== section.questions.length - 1 && (
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
            );
          })}
        </View>

        <View
          style={[
            styles.footerCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Sparkles size={22} color={colors.primary} />

          <Text style={[styles.footerTitle, { color: colors.text }]}>
            Keep moving forward!
          </Text>

          <Text
            style={[
              styles.footerDescription,
              { color: colors.textSecondary },
            ]}
          >
            Small steps, consistent effort, and better planning can help
            you achieve your goals.
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
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
  },

  heroDescription: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },

  section: {
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 18,
  },

  sectionGroup: {
    marginBottom: 20,
  },

  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
  },

  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  groupTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  card: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
  },

  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },

  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
    marginRight: 12,
  },

  answerText: {
    fontSize: 13,
    lineHeight: 21,
    paddingBottom: 16,
  },

  divider: {
    height: 1,
  },

  footerCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
  },

  footerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 11,
  },

  footerDescription: {
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 7,
  },
});
