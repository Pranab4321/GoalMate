
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CalendarDays,
  Clock3,
  Target,
  ChevronDown,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/theme";

import AppHeader from "@/components/common/AppHeader";
import AppCard from "@/components/common/AppCard";
import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";

import { useGoalStore } from "@/store/goalStore";
import { useTaskStore } from "@/store/taskStore";

import type {
  TaskDifficulty,
  TaskPriority,
} from "@/types/task";

export default function CreateTaskScreen() {
  const colors = useTheme();
  const router = useRouter();

  const params = useLocalSearchParams<{ goalId?: string }>();

  const goals = useGoalStore((state) => state.goals);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);

  const addTask = useTaskStore((state) => state.addTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalId, setGoalId] = useState(params.goalId ?? "");

  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [difficulty, setDifficulty] =
    useState<TaskDifficulty>("medium");

  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);

  const [estimatedDuration, setEstimatedDuration] = useState("30");

  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    if (params.goalId) {
      setGoalId(params.goalId);
    }
  }, [params.goalId]);

  const selectedGoal = goals.find((goal) => goal.id === goalId);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  };

  const displayDate = (date: Date | null) => {
    if (!date) return "Select date";

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const displayTime = (date: Date | null) => {
    if (!date) return "Select time";

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event.type === "set" && selectedDate) {
      setScheduledDate(selectedDate);
    }
  };

  const handleTimeChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (event.type === "set" && selectedDate) {
      setScheduledTime(selectedDate);
    }
  };

  const handleDeadlineChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowDeadlinePicker(false);
    }

    if (event.type === "set" && selectedDate) {
      setDeadline(selectedDate);
    }
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setTitleError("Please enter a task title.");
      return;
    }

    const duration = Number(estimatedDuration);

    if (
      !Number.isInteger(duration) ||
      duration <= 0
    ) {
      Alert.alert(
        "Invalid duration",
        "Please enter a valid duration in minutes."
      );
      return;
    }

    if (deadline && formatDate(deadline) < formatDate(scheduledDate)) {
      Alert.alert(
        "Invalid deadline",
        "The deadline cannot be before the scheduled date."
      );
      return;
    }

    try {
      setIsSaving(true);

      await addTask({
        goal_id: selectedGoal ? selectedGoal.id : null,
        title: trimmedTitle,
        description: description.trim(),
        priority,
        difficulty,
        scheduled_date: formatDate(scheduledDate),
        scheduled_time: scheduledTime
          ? formatTime(scheduledTime)
          : undefined,
        deadline: deadline ? formatDate(deadline) : undefined,
        estimated_duration: duration,
      });

      Alert.alert(
        "Task created!",
        "Your task has been saved successfully.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Task creation failed:", error);

      Alert.alert(
        "Unable to create task",
        "Something went wrong while saving your task. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const priorityOptions: {
    label: string;
    value: TaskPriority;
    color: string;
    background: string;
  }[] = [
    {
      label: "Low",
      value: "low",
      color: colors.success,
      background: colors.successLight,
    },
    {
      label: "Medium",
      value: "medium",
      color: colors.warning,
      background: colors.warningLight,
    },
    {
      label: "High",
      value: "high",
      color: colors.danger,
      background: colors.dangerLight,
    },
  ];

  const difficultyOptions: {
    label: string;
    value: TaskDifficulty;
  }[] = [
    { label: "Easy", value: "easy" },
    { label: "Medium", value: "medium" },
    { label: "Hard", value: "hard" },
  ];

  const renderDateField = (
    label: string,
    value: string,
    icon: React.ReactNode,
    onPress: () => void
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.label, { color: colors.text }]}>
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
        {icon}

        <Text style={[styles.dateText, { color: colors.text }]}>
          {value}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaViewContent />

      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <AppHeader
            title="Create Task"
            subtitle="Break your goals into actionable tasks."
            showBorder={false}
          />

          <AppCard style={styles.formCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Task Information
            </Text>

            <AppInput
              label="Task Title *"
              placeholder="e.g. Complete Java DSA practice"
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                if (value.trim()) setTitleError("");
              }}
              error={titleError}
            />

            <AppInput
              label="Description"
              placeholder="Describe what you need to accomplish..."
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: colors.text }]}>
                Associated Goal
              </Text>

              <Pressable
                onPress={() => setShowGoalPicker(!showGoalPicker)}
                style={[
                  styles.dateField,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Target size={18} color={colors.primary} />

                <Text
                  style={[
                    styles.dateText,
                    {
                      color: selectedGoal
                        ? colors.text
                        : colors.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {selectedGoal?.title ?? "Independent Task"}
                </Text>

                <ChevronDown
                  size={18}
                  color={colors.textSecondary}
                />
              </Pressable>

              {showGoalPicker && (
                <View
                  style={[
                    styles.goalOptions,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      setGoalId("");
                      setShowGoalPicker(false);
                    }}
                    style={styles.goalOption}
                  >
                    <Text style={{ color: colors.text }}>
                      Independent Task
                    </Text>
                  </Pressable>

                  {goals
                    .filter((goal) => goal.status === "active")
                    .map((goal) => (
                      <Pressable
                        key={goal.id}
                        onPress={() => {
                          setGoalId(goal.id);
                          setShowGoalPicker(false);
                        }}
                        style={styles.goalOption}
                      >
                        <Text style={{ color: colors.text }}>
                          {goal.title}
                        </Text>
                      </Pressable>
                    ))}

                  {goals.filter((goal) => goal.status === "active").length ===
                    0 && (
                    <Text
                      style={[
                        styles.helperText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      No active goals available.
                    </Text>
                  )}
                </View>
              )}
            </View>
          </AppCard>

          <AppCard style={styles.formCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Priority
            </Text>

            <View style={styles.optionRow}>
              {priorityOptions.map((option) => {
                const selected = priority === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setPriority(option.value)}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: selected
                          ? option.background
                          : colors.surface,
                        borderColor: selected
                          ? option.color
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected
                          ? option.color
                          : colors.textSecondary,
                        fontWeight: "600",
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Difficulty
            </Text>

            <View style={styles.optionRow}>
              {difficultyOptions.map((option) => {
                const selected = difficulty === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setDifficulty(option.value)}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: selected
                          ? colors.backgroundSelected
                          : colors.surface,
                        borderColor: selected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected
                          ? colors.primary
                          : colors.textSecondary,
                        fontWeight: "600",
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>

          <AppCard style={styles.formCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Schedule
            </Text>

            {renderDateField(
              "Scheduled Date",
              displayDate(scheduledDate),
              <CalendarDays size={18} color={colors.primary} />,
              () => setShowDatePicker(true)
            )}

            {showDatePicker && (
              <DateTimePicker
                value={scheduledDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date(new Date().setHours(0, 0, 0, 0))}
              />
            )}

            {renderDateField(
              "Scheduled Time",
              displayTime(scheduledTime),
              <Clock3 size={18} color={colors.primary} />,
              () => setShowTimePicker(true)
            )}

            {showTimePicker && (
              <DateTimePicker
                value={scheduledTime ?? new Date()}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {renderDateField(
              "Deadline (Optional)",
              deadline ? displayDate(deadline) : "No deadline",
              <CalendarDays size={18} color={colors.primary} />,
              () => setShowDeadlinePicker(true)
            )}

            {showDeadlinePicker && (
              <View>
                <DateTimePicker
                  value={deadline ?? scheduledDate}
                  mode="date"
                  display="default"
                  onChange={handleDeadlineChange}
                  minimumDate={scheduledDate}
                />

                <AppButton
                  title="Clear Deadline"
                  variant="ghost"
                  size="small"
                  onPress={() => {
                    setDeadline(null);
                    setShowDeadlinePicker(false);
                  }}
                />
              </View>
            )}

            <AppInput
              label="Estimated Duration (Minutes)"
              placeholder="30"
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              keyboardType="numeric"
            />
          </AppCard>

          <AppButton
            title="Create Task"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            fullWidth
            size="large"
          />

          <View style={{ height: Spacing["4xl"] }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function SafeAreaViewContent() {
  return null;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },

  formCard: {
    gap: Spacing.lg,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },

  fieldContainer: {
    gap: Spacing.sm,
  },

  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  dateField: {
    minHeight: 50,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  dateText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
  },

  goalOptions: {
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: "hidden",
  },

  goalOption: {
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#88888840",
  },

  helperText: {
    padding: Spacing.md,
    fontSize: Typography.fontSize.xs,
  },

  optionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  optionButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.xs,
  },
});
