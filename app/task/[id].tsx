
import React, { useEffect, useState } from "react";
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
import {
  CalendarDays,
  Clock3,
  Target,
  Trash2,
  CheckCircle2,
  Circle,
  Pencil,
  Save,
  X,
  Flag,
  Timer,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/theme";

import AppHeader from "@/components/common/AppHeader";
import AppCard from "@/components/common/AppCard";
import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import DifficultyBadge from "@/components/common/DifficultyBadge";

import { useTaskStore } from "@/store/taskStore";
import { useGoalStore } from "@/store/goalStore";

import type {
  Task,
  TaskDifficulty,
  TaskPriority,
} from "@/types/task";

export default function TaskDetailsScreen() {
  const colors = useTheme();
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const fetchTaskById = useTaskStore(
    (state) => state.fetchTaskById
  );
  const editTask = useTaskStore((state) => state.editTask);
  const markTaskCompleted = useTaskStore(
    (state) => state.markTaskCompleted
  );
  const removeTask = useTaskStore((state) => state.removeTask);

  const goals = useGoalStore((state) => state.goals);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [difficulty, setDifficulty] =
    useState<TaskDifficulty>("medium");
  const [estimatedDuration, setEstimatedDuration] = useState("30");

  useEffect(() => {
    loadTask();
    fetchGoals();
  }, [id]);

  const loadTask = async () => {
    try {
      setIsLoading(true);

      const result = await fetchTaskById(id);

      if (result) {
        setTask(result);
        populateForm(result);
      } else {
        setTask(null);
      }
    } catch (error) {
      console.error("Unable to load task:", error);
      Alert.alert("Error", "Unable to load task details.");
    } finally {
      setIsLoading(false);
    }
  };

  const populateForm = (currentTask: Task) => {
    setTitle(currentTask.title);
    setDescription(currentTask.description ?? "");
    setPriority(currentTask.priority);
    setDifficulty(currentTask.difficulty);
    setEstimatedDuration(
      String(currentTask.estimated_duration)
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not scheduled";

    const parts = date.split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
      return date;
    }

    return new Date(
      parts[0],
      parts[1] - 1,
      parts[2]
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (time: string | null) => {
    if (!time) return "Not scheduled";

    const [hours, minutes] = time.split(":").map(Number);

    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return time;
    }

    return new Date(
      2000,
      0,
      1,
      hours,
      minutes
    ).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return "Not estimated";

    if (minutes < 60) return `${minutes} minutes`;

    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return remaining
      ? `${hours}h ${remaining}m`
      : `${hours} hours`;
  };

  const getPriorityColor = (value: TaskPriority) => {
    switch (value) {
      case "high":
        return colors.danger;
      case "medium":
        return colors.warning;
      case "low":
        return colors.success;
    }
  };

  const getPriorityBackground = (value: TaskPriority) => {
    switch (value) {
      case "high":
        return colors.dangerLight;
      case "medium":
        return colors.warningLight;
      case "low":
        return colors.successLight;
    }
  };

  const handleSave = async () => {
    if (!task) return;

    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a task title.");
      return;
    }

    const duration = Number(estimatedDuration);

    if (!Number.isInteger(duration) || duration <= 0) {
      Alert.alert(
        "Invalid duration",
        "Enter a valid estimated duration in minutes."
      );
      return;
    }

    try {
      setIsSaving(true);

      await editTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        difficulty,
        estimated_duration: duration,
      });

      await loadTask();
      setIsEditing(false);

      Alert.alert("Updated", "Task details saved successfully.");
    } catch (error) {
      console.error("Task update failed:", error);
      Alert.alert("Error", "Unable to update this task.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!task) return;

    try {
      setIsUpdatingStatus(true);

      if (task.status === "completed") {
        await editTask(task.id, {
          status: "pending",
          completed_at: null,
        });
      } else {
        await markTaskCompleted(task.id);
      }

      await loadTask();
    } catch (error) {
      console.error("Status update failed:", error);
      Alert.alert("Error", "Unable to update task status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = () => {
    if (!task) return;

    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeTask(task.id);

              Alert.alert(
                "Deleted",
                "Task deleted successfully.",
                [
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error) {
              console.error("Task deletion failed:", error);
              Alert.alert("Error", "Unable to delete this task.");
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary }}>
          Loading task details...
        </Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View
        style={[
          styles.centerContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.notFound, { color: colors.text }]}>
          Task not found
        </Text>

        <AppButton
          title="Go Back"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  const isCompleted = task.status === "completed";

  const associatedGoal = goals.find(
    (goal) => goal.id === task.goal_id
  );

  const priorityOptions: TaskPriority[] = [
    "low",
    "medium",
    "high",
  ];

  const difficultyOptions: TaskDifficulty[] = [
    "easy",
    "medium",
    "hard",
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <AppHeader
          title="Task Details"
          subtitle="View and manage your task."
          showBorder={false}
          rightAction={
            <Pressable
              onPress={() => {
                if (isEditing) {
                  populateForm(task);
                  setIsEditing(false);
                } else {
                  setIsEditing(true);
                }
              }}
              style={[
                styles.headerButton,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              {isEditing ? (
                <X size={20} color={colors.text} />
              ) : (
                <Pencil size={19} color={colors.primary} />
              )}
            </Pressable>
          }
        />

        {/* Task Overview */}

        <AppCard style={styles.overviewCard}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isCompleted
                    ? colors.successLight
                    : colors.warningLight,
                },
              ]}
            >
              <Text
                style={{
                  color: isCompleted
                    ? colors.success
                    : colors.warning,
                  fontWeight: "600",
                  fontSize: Typography.fontSize.xs,
                }}
              >
                {isCompleted ? "Completed" : task.status.replace("_", " ")}
              </Text>
            </View>

            <Text
              style={[
                styles.priorityLabel,
                {
                  color: getPriorityColor(task.priority),
                  backgroundColor: getPriorityBackground(
                    task.priority
                  ),
                },
              ]}
            >
              {task.priority.toUpperCase()} PRIORITY
            </Text>
          </View>

          {isEditing ? (
            <>
              <AppInput
                label="Task Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Enter task title"
              />

              <AppInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                multiline
              />
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.taskTitle,
                  {
                    color: colors.text,
                    textDecorationLine: isCompleted
                      ? "line-through"
                      : "none",
                  },
                ]}
              >
                {task.title}
              </Text>

              <Text
                style={[
                  styles.description,
                  { color: colors.textSecondary },
                ]}
              >
                {task.description || "No description provided."}
              </Text>
            </>
          )}

          <View style={styles.goalRow}>
            <Target size={18} color={colors.primary} />

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.smallLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Associated Goal
              </Text>

              <Text
                style={[
                  styles.goalName,
                  { color: colors.text },
                ]}
              >
                {associatedGoal?.title ??
                  (task.goal_id ? "Goal unavailable" : "Independent Task")}
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Priority and Difficulty */}

        <AppCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Task Settings
          </Text>

          {isEditing ? (
            <>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Priority
              </Text>

              <View style={styles.optionRow}>
                {priorityOptions.map((option) => {
                  const selected = priority === option;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => setPriority(option)}
                      style={[
                        styles.optionButton,
                        {
                          borderColor: selected
                            ? getPriorityColor(option)
                            : colors.border,
                          backgroundColor: selected
                            ? getPriorityBackground(option)
                            : colors.surface,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: selected
                            ? getPriorityColor(option)
                            : colors.textSecondary,
                          fontWeight: "600",
                        }}
                      >
                        {option.charAt(0).toUpperCase() +
                          option.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Difficulty
              </Text>

              <View style={styles.optionRow}>
                {difficultyOptions.map((option) => {
                  const selected = difficulty === option;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => setDifficulty(option)}
                      style={[
                        styles.optionButton,
                        {
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                          backgroundColor: selected
                            ? colors.backgroundSelected
                            : colors.surface,
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
                        {option.charAt(0).toUpperCase() +
                          option.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <AppInput
                label="Estimated Duration (Minutes)"
                value={estimatedDuration}
                onChangeText={setEstimatedDuration}
                keyboardType="numeric"
              />

              <AppButton
                title="Save Changes"
                onPress={handleSave}
                loading={isSaving}
                disabled={isSaving}
                fullWidth
                leftIcon={<Save size={17} color="#FFFFFF" />}
              />
            </>
          ) : (
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Flag size={17} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary }}>
                  Priority
                </Text>
                <Text
                  style={{
                    color: getPriorityColor(task.priority),
                    fontWeight: "700",
                  }}
                >
                  {task.priority.toUpperCase()}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={{ color: colors.textSecondary }}>
                  Difficulty
                </Text>
                <DifficultyBadge difficulty={task.difficulty} />
              </View>
            </View>
          )}
        </AppCard>

        {/* Schedule */}

        <AppCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Schedule & Duration
          </Text>

          <View style={styles.scheduleItem}>
            <View
              style={[
                styles.scheduleIcon,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <CalendarDays size={19} color={colors.primary} />
            </View>

            <View style={styles.scheduleInfo}>
              <Text
                style={[
                  styles.smallLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Scheduled Date
              </Text>

              <Text style={[styles.scheduleValue, { color: colors.text }]}>
                {formatDate(task.scheduled_date)}
              </Text>
            </View>
          </View>

          <View style={styles.scheduleItem}>
            <View
              style={[
                styles.scheduleIcon,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Clock3 size={19} color={colors.primary} />
            </View>

            <View style={styles.scheduleInfo}>
              <Text
                style={[
                  styles.smallLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Scheduled Time
              </Text>

              <Text style={[styles.scheduleValue, { color: colors.text }]}>
                {formatTime(task.scheduled_time)}
              </Text>
            </View>
          </View>

          <View style={styles.scheduleItem}>
            <View
              style={[
                styles.scheduleIcon,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <CalendarDays size={19} color={colors.warning} />
            </View>

            <View style={styles.scheduleInfo}>
              <Text
                style={[
                  styles.smallLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Deadline
              </Text>

              <Text style={[styles.scheduleValue, { color: colors.text }]}>
                {formatDate(task.deadline)}
              </Text>
            </View>
          </View>

          <View style={styles.scheduleItem}>
            <View
              style={[
                styles.scheduleIcon,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Timer size={19} color={colors.secondary} />
            </View>

            <View style={styles.scheduleInfo}>
              <Text
                style={[
                  styles.smallLabel,
                  { color: colors.textSecondary },
                ]}
              >
                Estimated Duration
              </Text>

              <Text style={[styles.scheduleValue, { color: colors.text }]}>
                {formatDuration(task.estimated_duration)}
              </Text>
            </View>
          </View>

          {task.actual_duration > 0 && (
            <View style={styles.scheduleItem}>
              <View
                style={[
                  styles.scheduleIcon,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Clock3 size={19} color={colors.success} />
              </View>

              <View style={styles.scheduleInfo}>
                <Text
                  style={[
                    styles.smallLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Actual Duration
                </Text>

                <Text
                  style={[
                    styles.scheduleValue,
                    { color: colors.text },
                  ]}
                >
                  {formatDuration(task.actual_duration)}
                </Text>
              </View>
            </View>
          )}
        </AppCard>

        {/* Completion */}

        <AppButton
          title={
            isCompleted
              ? "Mark as Pending"
              : "Mark as Completed"
          }
          onPress={handleToggleStatus}
          loading={isUpdatingStatus}
          disabled={isUpdatingStatus}
          fullWidth
          variant={isCompleted ? "secondary" : "primary"}
          leftIcon={
            isCompleted ? (
              <Circle size={18} color={colors.primary} />
            ) : (
              <CheckCircle2 size={18} color="#FFFFFF" />
            )
          }
        />

        {/* Delete */}

        <AppButton
          title="Delete Task"
          onPress={handleDelete}
          variant="danger"
          fullWidth
          leftIcon={<Trash2 size={18} color="#FFFFFF" />}
        />

        <View style={{ height: Spacing["4xl"] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing["5xl"],
    gap: Spacing.lg,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    padding: Spacing.xl,
  },

  notFound: {
    fontSize: Typography.fontSize.xl,
    fontWeight: "700",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  overviewCard: {
    gap: Spacing.lg,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },

  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },

  priorityLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "700",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },

  taskTitle: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: "800",
    lineHeight: 32,
  },

  description: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 23,
  },

  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#88888840",
  },

  smallLabel: {
    fontSize: Typography.fontSize.xs,
  },

  goalName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
    marginTop: 3,
  },

  sectionCard: {
    gap: Spacing.lg,
  },

  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
  },

  fieldLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },

  optionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },

  optionButton: {
    flex: 1,
    minHeight: 43,
    borderWidth: 1,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
  },

  detailRow: {
    gap: Spacing.lg,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  scheduleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },

  scheduleIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  scheduleInfo: {
    flex: 1,
    gap: 4,
  },

  scheduleValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: "600",
  },
});
