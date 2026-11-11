
import { useState } from "react";
import { generateGoalPlan } from "@/services/goalPlanningService";
import type { AIGoalPlan } from "@/types/ai";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  CalendarDays,
  Target,
  Sparkles,
  Clock,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radius, Typography } from "@/theme";

import AppHeader from "@/components/common/AppHeader";
import AppCard from "@/components/common/AppCard";
import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";

import { useGoalStore } from "@/store/goalStore";
import type {
  GoalCategory,
  GoalPriority,
} from "@/types/goal";

const categories: GoalCategory[] = [
  "Personal",
  "Academic",
  "Career",
  "Health",
  "Finance",
  "Other",
];

const priorities: GoalPriority[] = [
  "low",
  "medium",
  "high",
];

export default function CreateGoalScreen() {
  const colors = useTheme();
  const router = useRouter();

  const addGoal = useGoalStore((state) => state.addGoal);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] =
    useState<GoalCategory>("Personal");
  const [priority, setPriority] =
    useState<GoalPriority>("medium");
  const [startDate, setStartDate] = useState(new Date());
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState("30");
  const [dailyHours, setDailyHours] = useState("2");

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedPlan, setGeneratedPlan] =
    useState<AIGoalPlan | null>(null);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const handleCreateGoal = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter your goal title.");
      return;
    }

    const duration = Number(estimatedDuration);

    if (
      !Number.isFinite(duration) ||
      !Number.isInteger(duration) ||
      duration < 1
    ) {
      Alert.alert(
        "Invalid duration",
        "Please enter a valid estimated duration in days."
      );
      return;
    }

    const availableHours = Number(dailyHours);

    if (
      !Number.isFinite(availableHours) ||
      availableHours <= 0 ||
      availableHours > 24
    ) {
      Alert.alert(
        "Invalid daily availability",
        "Please enter working hours greater than 0 and no more than 24."
      );
      return;
    }

    if (deadline && deadline < new Date(new Date().setHours(0, 0, 0, 0))) {
      Alert.alert(
        "Invalid deadline",
        "Deadline cannot be in the past."
      );
      return;
    }

    if (deadline && deadline < startDate) {
      Alert.alert(
        "Invalid dates",
        "Deadline cannot be before the start date."
      );
      return;
    }

    try {
      setIsSaving(true);

      await addGoal({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        start_date: formatDate(startDate),
        deadline: deadline ? formatDate(deadline) : undefined,
        estimated_duration: duration,
      });

      Alert.alert(
        "Goal created!",
        "Your new goal has been saved successfully.",
        [
          {
            text: "Continue",
            onPress: () => router.back(),
          },
        ]
      );
    } catch {
      Alert.alert(
        "Creation failed",
        "Unable to save your goal. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };


const handleGenerateAIPlan = async () => {
  if (!title.trim()) {
    Alert.alert("Missing title", "Please enter your goal title.");
    return;
  }

  const duration = Number(estimatedDuration);
  const availableHours = Number(dailyHours);

  if (
    !Number.isFinite(duration) ||
    !Number.isInteger(duration) ||
    duration < 1
  ) {
    Alert.alert(
      "Invalid duration",
      "Please enter a valid estimated duration in days."
    );
    return;
  }

  if (
    !Number.isFinite(availableHours) ||
    availableHours <= 0 ||
    availableHours > 24
  ) {
    Alert.alert(
      "Invalid daily availability",
      "Please enter working hours greater than 0 and no more than 24."
    );
    return;
  }

  if (deadline && deadline < new Date(new Date().setHours(0, 0, 0, 0))) {
    Alert.alert("Invalid deadline", "Deadline cannot be in the past.");
    return;
  }

  if (deadline && deadline < startDate) {
    Alert.alert("Invalid dates", "Deadline cannot be before the start date.");
    return;
  }

  try {
    setIsGeneratingAI(true);
    setGeneratedPlan(null);

    const plan = await generateGoalPlan({
      goalTitle: title.trim(),
      goalDescription: description.trim(),
      category,
      priority,
      startDate: formatDate(startDate),
      deadline: deadline ? formatDate(deadline) : undefined,
      estimatedDurationDays: duration,
      dailyAvailableHours: availableHours,
    });

    setGeneratedPlan(plan);

  } catch (error) {
    Alert.alert(
      "AI Generation Failed",
      error instanceof Error
        ? error.message
        : "Unable to generate your roadmap. Please try again."
    );
  } finally {
    setIsGeneratingAI(false);
  }
};


  const renderOption = (
    label: string,
    selected: boolean,
    onPress: () => void
  ) => (
    <Pressable
      key={label}
      onPress={onPress}
      style={[
        styles.optionButton,
        {
          backgroundColor: selected
            ? colors.primary + "18"
            : colors.surface,
          borderColor: selected
            ? colors.primary
            : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.optionText,
          {
            color: selected
              ? colors.primary
              : colors.textSecondary,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const renderDateField = (
    label: string,
    date: Date | null,
    onPress: () => void,
    placeholder: string
  ) => (
    <View style={styles.dateFieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.text }]}>
        {label}
      </Text>

      <Pressable
        onPress={onPress}
        style={[
          styles.dateField,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <CalendarDays size={19} color={colors.primary} />

        <Text
          style={[
            styles.dateText,
            {
              color: date
                ? colors.text
                : colors.textMuted,
            },
          ]}
        >
          {date
            ? date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : placeholder}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background },
      ]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <AppHeader
            title="Create Goal"
            subtitle="Define what you want to achieve."
            leftAction={
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <ArrowLeft size={22} color={colors.text} />
              </Pressable>
            }
          />

          {/* AI Banner */}

          <AppCard
            style={[
              styles.aiBanner,
              { backgroundColor: colors.primary },
            ]}
          >
            <View style={styles.aiBannerRow}>
              <Sparkles size={25} color="#FFFFFF" />

              <View style={styles.aiBannerText}>
                <Text style={styles.aiTitle}>
                  AI-powered goal planning
                </Text>

                <Text style={styles.aiDescription}>
                  Create your goal now. AI task generation will
                  help break it into smaller steps.
                </Text>
              </View>
            </View>
          </AppCard>

          {/* Goal Information */}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Goal Information
            </Text>

            <AppInput
              label="Goal Title *"
              placeholder="e.g. Master Java DSA"
              value={title}
              onChangeText={setTitle}
            />

            <AppInput
              label="Description"
              placeholder="Describe what you want to achieve..."
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Category */}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Choose Category
            </Text>

            <View style={styles.optionsContainer}>
              {categories.map((item) =>
                renderOption(
                  item,
                  category === item,
                  () => setCategory(item)
                )
              )}
            </View>
          </View>

          {/* Priority */}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Goal Priority
            </Text>

            <View style={styles.optionsContainer}>
              {priorities.map((item) =>
                renderOption(
                  item.charAt(0).toUpperCase() + item.slice(1),
                  priority === item,
                  () => setPriority(item)
                )
              )}
            </View>
          </View>

          {/* Dates */}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Goal Timeline
            </Text>

            {renderDateField(
              "Start Date",
              startDate,
              () => setShowStartPicker(true),
              "Select start date"
            )}

            {renderDateField(
              "Deadline (Optional)",
              deadline,
              () => setShowDeadlinePicker(true),
              "Select deadline"
            )}

            {deadline && (
              <Pressable onPress={() => setDeadline(null)}>
                <Text style={[styles.clearDate, { color: colors.danger }]}>
                  Remove deadline
                </Text>
              </Pressable>
            )}

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                minimumDate={new Date()}
                onChange={(_, selectedDate) => {
                  setShowStartPicker(false);

                  if (selectedDate) {
                    setStartDate(selectedDate);
                  }
                }}
              />
            )}

            {showDeadlinePicker && (
              <DateTimePicker
                value={deadline ?? startDate}
                mode="date"
                minimumDate={startDate}
                onChange={(_, selectedDate) => {
                  setShowDeadlinePicker(false);

                  if (selectedDate) {
                    setDeadline(selectedDate);
                  }
                }}
              />
            )}
          </View>

          {/* Estimated Duration */}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Estimated Duration
            </Text>

            <AppInput
              label="Expected completion time (days)"
              placeholder="30"
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              keyboardType="number-pad"
              leftIcon={<Clock size={18} color={colors.textSecondary} />}
            />

            <Text
              style={[
                styles.helperText,
                { color: colors.textSecondary },
              ]}
            >
              How many days do you expect to need to achieve this goal?
            </Text>
          </View>

          {/* Daily Availability */}

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Daily Availability
            </Text>

            <AppInput
              label="Available working hours per day"
              placeholder="2"
              value={dailyHours}
              onChangeText={setDailyHours}
              keyboardType="decimal-pad"
              leftIcon={<Clock size={18} color={colors.textSecondary} />}
            />

            <Text
              style={[
                styles.helperText,
                { color: colors.textSecondary },
              ]}
            >
              How many hours can you dedicate to achieving this goal each day?
            </Text>
          </View>

          {/* Create Button */}

          <View style={styles.bottomSection}>

              <AppButton
                title="Generate AI Roadmap"
                onPress={handleGenerateAIPlan}
                loading={isGeneratingAI}
                disabled={isGeneratingAI || isSaving}
                fullWidth
                size="large"
                leftIcon={<Sparkles size={19} color="#FFFFFF" />}
              />

            <AppButton
              title="Create Goal"
              onPress={handleCreateGoal}
              loading={isSaving}
              disabled={isSaving}
              fullWidth
              size="large"
              leftIcon={<Target size={19} color="#FFFFFF" />}
            />

            <Text
              style={[
                styles.footerText,
                { color: colors.textMuted },
              ]}
            >
              You can edit your goal details anytime.
            </Text>
          </View>


          {generatedPlan && (
            <AppCard
              style={{
                marginTop: Spacing.xl,
                backgroundColor: colors.surface,
              }}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text },
                ]}
              >
                Your AI Roadmap
              </Text>

              <Text
                style={[
                  styles.helperText,
                  { color: colors.textSecondary, marginTop: Spacing.sm },
                ]}
              >
                {generatedPlan.summary}
              </Text>

              <Text
                style={{
                  color: colors.primary,
                  fontWeight: "700",
                  marginTop: Spacing.md,
                }}
              >
                {generatedPlan.tasks.length} tasks generated
              </Text>

              {generatedPlan.tasks.map((task, index) => (
                <View
                  key={`${index}-${task.title}`}
                  style={{ marginTop: Spacing.md }}
                >
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: "600",
                    }}
                  >
                    {index + 1}. {task.title}
                  </Text>

                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: Typography.fontSize.xs,
                      marginTop: Spacing.xs,
                    }}
                  >
                    {task.difficulty.toUpperCase()} · {task.priority.toUpperCase()} · {task.estimated_duration} minutes
                  </Text>
                </View>
              ))}
            </AppCard>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  keyboardContainer: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing["5xl"],
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
  },

  aiBanner: {
    backgroundColor: "#7C3AED",
    borderWidth: 0,
    marginTop: Spacing.xl,
  },

  aiBannerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },

  aiBannerText: {
    flex: 1,
    gap: Spacing.xs,
  },

  aiTitle: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },

  aiDescription: {
    color: "#FFFFFF",
    fontSize: Typography.fontSize.sm,
    opacity: 0.9,
    lineHeight: Typography.lineHeight.normal,
  },

  section: {
    marginTop: Spacing["2xl"],
    gap: Spacing.md,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },

  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },

  optionButton: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },

  optionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },

  dateFieldContainer: {
    gap: Spacing.sm,
  },

  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },

  dateField: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },

  dateText: {
    fontSize: Typography.fontSize.sm,
  },

  clearDate: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },

  helperText: {
    fontSize: Typography.fontSize.xs,
    lineHeight: Typography.lineHeight.normal,
  },

  bottomSection: {
    marginTop: Spacing["3xl"],
    gap: Spacing.md,
  },

  footerText: {
    fontSize: Typography.fontSize.xs,
    textAlign: "center",
  },
});
