import { useCallback, useEffect, useMemo, useState } from "react";
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
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Flag,
  Plus,
  Target,
  Trash2,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { useGoalStore } from "@/store/goalStore";
import { useTaskStore } from "@/store/taskStore";
import { GoalCategory, GoalPriority } from "@/types/goal";
import AppCard from "@/components/common/AppCard";
import AppButton from "@/components/common/AppButton";
import AppInput from "@/components/common/AppInput";
import AppHeader from "@/components/common/AppHeader";
import ProgressBar from "@/components/common/ProgressBar";
import DeadlineFeasibilityCard from "@/components/goals/DeadlineFeasibilityCard";
import { getGoalDeadlineFeasibility } from "@/services/deadlineFeasibilityDataService";
import type { DeadlineFeasibilityResult } from "@/services/deadlineFeasibilityService";
import { generateDeadlineFeasibilityExplanation } from "@/services/deadlineFeasibilityAIService";

const categories: GoalCategory[] = [
  "Personal",
  "Academic",
  "Career",
  "Health",
  "Finance",
  "Other",
];

const priorities: GoalPriority[] = ["low", "medium", "high"];

// Parse YYYY-MM-DD as a local date to avoid timezone shifting the displayed day.
const parseGoalDate = (value: string | null): Date | null => {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const parsed = new Date(year, month, day);
    return parsed.getFullYear() === year && parsed.getMonth() === month && parsed.getDate() === day
      ? parsed
      : null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const formatGoalDateForStorage = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function GoalDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const {
    goals,
    fetchGoals,
    fetchGoalById,
    editGoal,
    removeGoal,
    isLoading: isGoalLoading,
  } = useGoalStore();

  const {
    tasks,
    fetchTasks,
    editTask,
    removeTask,
    isLoading: isTaskLoading,
  } = useTaskStore();

  const [goal, setGoal] = useState(
    goals.find((item) => item.id === id) ?? null
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Personal");
  const [priority, setPriority] = useState<GoalPriority>("medium");
  const [duration, setDuration] = useState("");
  const [dailyHours, setDailyHours] = useState("2");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [feasibility, setFeasibility] =
    useState<DeadlineFeasibilityResult | null>(null);
  const [isFeasibilityLoading, setIsFeasibilityLoading] = useState(false);
  const [feasibilityError, setFeasibilityError] = useState(false);
  const [aiExplanation, setAIExplanation] = useState<string | null>(null);
  const [isAIExplanationLoading, setIsAIExplanationLoading] = useState(false);
  const [aiExplanationError, setAIExplanationError] = useState<string | null>(null);

  const loadGoal = useCallback(async () => {
    try {
      const result = await fetchGoalById(id);

      setGoal(result);
    } catch (error) {
      console.error("Failed to load goal:", error);
    }
  }, [id, fetchGoalById]);

  useEffect(() => {
    loadGoal();
    fetchGoals();
    fetchTasks();
  }, [loadGoal, fetchGoals, fetchTasks]);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setDescription(goal.description ?? "");
      setCategory(goal.category);
      setPriority(goal.priority);
      setDuration(String(goal.estimated_duration));
      setDailyHours(String(goal.daily_available_hours ?? 2));
      setStartDate(parseGoalDate(goal.start_date) ?? new Date());
      setDeadline(parseGoalDate(goal.deadline));
    }
  }, [goal]);

  const goalTasks = useMemo(
    () => tasks.filter((task) => task.goal_id === id),
    [tasks, id]
  );

  const loadFeasibility = useCallback(async () => {
    if (!id) return;

    setIsFeasibilityLoading(true);
    setFeasibilityError(false);
    setAIExplanation(null);
    setAIExplanationError(null);

    try {
      const result = await getGoalDeadlineFeasibility(id);
      setFeasibility(result);
    } catch (error) {
      console.error("Failed to calculate goal deadline feasibility:", error);
      setFeasibilityError(true);
    } finally {
      setIsFeasibilityLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadFeasibility();
  }, [loadFeasibility, goal?.updated_at, goalTasks]);

  const handleGenerateAIExplanation = useCallback(async () => {
    if (!goal || !feasibility) return;

    setIsAIExplanationLoading(true);
    setAIExplanationError(null);

    try {
      const explanation = await generateDeadlineFeasibilityExplanation({
        goalTitle: goal.title,
        deadline: goal.deadline,
        result: feasibility,
      });
      setAIExplanation(explanation);
    } catch (error) {
      console.error("Failed to generate deadline feasibility explanation:", error);
      setAIExplanationError(
        error instanceof Error
          ? error.message
          : "Unable to generate an AI explanation. Please try again."
      );
    } finally {
      setIsAIExplanationLoading(false);
    }
  }, [goal, feasibility]);

  const completedTasks = goalTasks.filter(
    (task) => task.status === "completed"
  ).length;

  const progress =
    goalTasks.length > 0
      ? Math.round((completedTasks / goalTasks.length) * 100)
      : 0;

  const pendingTasks = goalTasks.filter(
    (task) => task.status === "pending"
  ).length;

  const inProgressTasks = goalTasks.filter(
    (task) => task.status === "in_progress"
  ).length;

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Validation", "Please enter a goal title.");
      return;
    }

    const parsedDuration = Number(duration);

    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      Alert.alert("Validation", "Enter a valid duration in days.");
      return;
    }

    const parsedDailyHours = Number(dailyHours);

    if (
      !Number.isFinite(parsedDailyHours) ||
      parsedDailyHours <= 0 ||
      parsedDailyHours > 24
    ) {
      Alert.alert(
        "Validation",
        "Enter working hours greater than 0 and no more than 24."
      );
      return;
    }

    if (deadline && deadline.getTime() < new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime()) {
      Alert.alert("Invalid dates", "Deadline cannot be before the start date.");
      return;
    }

    try {
      setIsSaving(true);

      await editGoal(id, {
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        estimated_duration: parsedDuration,
        daily_available_hours: parsedDailyHours,
        start_date: formatGoalDateForStorage(startDate),
        deadline: deadline ? formatGoalDateForStorage(deadline) : null,
      });

      await loadGoal();

      setIsEditing(false);

      Alert.alert("Success", "Goal updated successfully.");
    } catch (error) {
      console.error("Failed to update goal:", error);
      Alert.alert("Error", "Unable to update goal.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = () => {
    if (!goal) return;

    const newStatus =
      goal.status === "completed" ? "active" : "completed";

    Alert.alert(
      "Update Goal Status",
      `Mark this goal as ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await editGoal(id, { status: newStatus });
              await loadGoal();
            } catch (error) {
              Alert.alert("Error", "Unable to update goal status.");
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Goal",
      "Are you sure? This will permanently delete this goal and all its associated tasks.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeGoal(id);
              Alert.alert("Deleted", "Goal deleted successfully.");
              router.back();
            } catch (error) {
              Alert.alert("Error", "Unable to delete this goal.");
            }
          },
        },
      ]
    );
  };

  const handleTaskPress = (taskId: string) => {
    router.push(`/task/${taskId}`);
  };

  const handleAddTask = () => {
    router.push({
      pathname: "/task/create",
      params: { goalId: id },
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const priorityColor = (value: GoalPriority) => {
    if (value === "high") return theme.danger;
    if (value === "medium") return theme.warning;
    return theme.success;
  };

  if (!goal && (isGoalLoading || isTaskLoading)) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!goal) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.background },
        ]}
      >
        <Target size={42} color={theme.textMuted} />

        <Text style={[styles.notFound, { color: theme.text }]}>
          Goal not found
        </Text>

        <AppButton
          title="Go Back"
          onPress={() => router.back()}
          variant="outline"
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader
        style={{ paddingHorizontal: 16, paddingTop: insets.top + 8 }}
  title={isEditing ? "Edit Goal" : "Goal Details"}
  leftAction={
    <Pressable onPress={() => router.back()} style={styles.headerAction}>
      <ArrowLeft size={22} color={theme.text} />
    </Pressable>
  }
  rightAction={
    !isEditing ? (
      <Pressable
        onPress={() => setIsEditing(true)}
        style={styles.headerAction}
      >
        <Edit3 size={20} color={theme.text} />
      </Pressable>
    ) : undefined
  }
/>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isEditing ? (
          <>
            <AppCard padding={18}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Edit Goal Information
              </Text>

              <AppInput
                label="Goal Title"
                value={title}
                onChangeText={setTitle}
                placeholder="Enter goal title"
              />

              <AppInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your goal"
                multiline
              />

              <Text style={[styles.label, { color: theme.text }]}>
                Goal Timeline
              </Text>

              <View style={styles.dateFieldContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Start Date</Text>
                <Pressable
                  onPress={() => setShowStartPicker(true)}
                  style={[styles.dateField, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Calendar size={19} color={theme.primary} />
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    {startDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.dateFieldContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Deadline (Optional)</Text>
                <Pressable
                  onPress={() => setShowDeadlinePicker(true)}
                  style={[styles.dateField, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <Calendar size={19} color={theme.primary} />
                  <Text style={[styles.dateText, { color: deadline ? theme.text : theme.textMuted }]}>
                    {deadline
                      ? deadline.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                      : "Select deadline"}
                  </Text>
                </Pressable>
                {deadline ? (
                  <Pressable onPress={() => setDeadline(null)}>
                    <Text style={[styles.clearDate, { color: theme.danger }]}>Remove deadline</Text>
                  </Pressable>
                ) : null}
              </View>

              {showStartPicker ? (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  onChange={(_, selectedDate) => {
                    setShowStartPicker(false);
                    if (selectedDate) setStartDate(selectedDate);
                  }}
                />
              ) : null}

              {showDeadlinePicker ? (
                <DateTimePicker
                  value={deadline ?? startDate}
                  mode="date"
                  minimumDate={startDate}
                  onChange={(_, selectedDate) => {
                    setShowDeadlinePicker(false);
                    if (selectedDate) setDeadline(selectedDate);
                  }}
                />
              ) : null}

              <Text style={[styles.label, { color: theme.text }]}>
                Category
              </Text>

              <View style={styles.options}>
                {categories.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCategory(item)}
                    style={[
                      styles.option,
                      {
                        backgroundColor:
                          category === item
                            ? theme.primary
                            : theme.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          category === item
                            ? "#FFFFFF"
                            : theme.text,
                      }}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { color: theme.text }]}>
                Priority
              </Text>

              <View style={styles.options}>
                {priorities.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setPriority(item)}
                    style={[
                      styles.option,
                      {
                        backgroundColor:
                          priority === item
                            ? theme.primary
                            : theme.surfaceSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          priority === item
                            ? "#FFFFFF"
                            : theme.text,
                        textTransform: "capitalize",
                      }}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <AppInput
                label="Estimated Duration (Days)"
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="e.g. 30"
              />

              <AppInput
                label="Available Working Hours per Day"
                value={dailyHours}
                onChangeText={setDailyHours}
                keyboardType="decimal-pad"
                placeholder="e.g. 2"
              />

              <AppButton
                title="Save Changes"
                onPress={handleSave}
                loading={isSaving}
                fullWidth
              />

              <AppButton
                title="Cancel"
                onPress={() => setIsEditing(false)}
                variant="outline"
                fullWidth
                style={{ marginTop: 10 }}
              />
            </AppCard>
          </>
        ) : (
          <>
            {/* Goal Overview */}
            <AppCard padding={20}>
              <View style={styles.titleRow}>
                <View
                  style={[
                    styles.goalIcon,
                    { backgroundColor: theme.backgroundSelected },
                  ]}
                >
                  <Target size={28} color={theme.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.goalTitle, { color: theme.text }]}>
                    {goal.title}
                  </Text>

                  <Text
                    style={[
                      styles.categoryText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {goal.category}
                  </Text>
                </View>
              </View>

              {goal.description ? (
                <Text
                  style={[
                    styles.description,
                    { color: theme.textSecondary },
                  ]}
                >
                  {goal.description}
                </Text>
              ) : null}

              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.surfaceSecondary },
                  ]}
                >
                  <Text style={{ color: priorityColor(goal.priority) }}>
                    {goal.priority.toUpperCase()} PRIORITY
                  </Text>
                </View>

                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        goal.status === "completed"
                          ? theme.successLight
                          : theme.backgroundSelected,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        goal.status === "completed"
                          ? theme.success
                          : theme.primary,
                    }}
                  >
                    {goal.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </AppCard>

            {/* Progress */}
            <AppCard padding={18}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Goal Progress
              </Text>

              <View style={styles.progressHeader}>
                <Text style={[styles.progressPercent, { color: theme.primary }]}>
                  {progress}%
                </Text>

                <Text style={{ color: theme.textSecondary }}>
                  {completedTasks} of {goalTasks.length} tasks completed
                </Text>
              </View>

              <ProgressBar progress={progress} height={10} />

              <View style={styles.statsRow}>
                <View>
                  <Text style={[styles.statNumber, { color: theme.success }]}>
                    {completedTasks}
                  </Text>
                  <Text style={{ color: theme.textSecondary }}>Completed</Text>
                </View>

                <View>
                  <Text style={[styles.statNumber, { color: theme.warning }]}>
                    {inProgressTasks}
                  </Text>
                  <Text style={{ color: theme.textSecondary }}>In Progress</Text>
                </View>

                <View>
                  <Text style={[styles.statNumber, { color: theme.text }]}>
                    {pendingTasks}
                  </Text>
                  <Text style={{ color: theme.textSecondary }}>Pending</Text>
                </View>
              </View>
            </AppCard>

            {/* Goal Timeline */}
            <AppCard padding={18}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Goal Timeline
              </Text>

              <View style={styles.infoRow}>
                <Calendar size={19} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textSecondary }}>
                    Start Date
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {formatDate(goal.start_date)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Flag size={19} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textSecondary }}>
                    Deadline
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {formatDate(goal.deadline)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Clock size={19} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textSecondary }}>
                    Estimated Duration
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {goal.estimated_duration} days
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Clock size={19} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textSecondary }}>
                    Daily Available Time
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {goal.daily_available_hours ?? 2} hours per day
                  </Text>
                </View>
              </View>
            </AppCard>

            <DeadlineFeasibilityCard
              result={feasibility}
              isLoading={isFeasibilityLoading}
              hasError={feasibilityError}
              onRetry={loadFeasibility}
              aiExplanation={aiExplanation}
              isAIExplanationLoading={isAIExplanationLoading}
              aiExplanationError={aiExplanationError}
              onGenerateAIExplanation={handleGenerateAIExplanation}
            />

            {/* Tasks */}
            <View style={styles.taskHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Associated Tasks
              </Text>

              <Pressable onPress={handleAddTask} style={styles.addTaskButton}>
                <Plus size={17} color={theme.primary} />
                <Text style={{ color: theme.primary, fontWeight: "600" }}>
                  Add Task
                </Text>
              </Pressable>
            </View>

            {goalTasks.length === 0 ? (
              <AppCard padding={20}>
                <View style={styles.emptyContainer}>
                  <Target size={34} color={theme.textMuted} />

                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    No tasks yet
                  </Text>

                  <Text
                    style={[
                      styles.emptyDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Break this goal into smaller tasks to start making progress.
                  </Text>

                  <AppButton
                    title="Create First Task"
                    onPress={handleAddTask}
                    leftIcon={<Plus size={17} color="#FFFFFF" />}
                  />
                </View>
              </AppCard>
            ) : (
              goalTasks.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => handleTaskPress(task.id)}
                >
                  <AppCard padding={15} style={styles.taskCard}>
                    <View style={styles.taskRow}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.taskTitle,
                            {
                              color: theme.text,
                              textDecorationLine:
                                task.status === "completed"
                                  ? "line-through"
                                  : "none",
                            },
                          ]}
                        >
                          {task.title}
                        </Text>

                        <Text
                          style={[
                            styles.taskMeta,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {task.priority.toUpperCase()} ·{" "}
                          {task.difficulty.toUpperCase()}
                        </Text>
                      </View>

                      {task.status === "completed" ? (
                        <CheckCircle2 size={22} color={theme.success} />
                      ) : (
                        <ChevronRight size={21} color={theme.textMuted} />
                      )}
                    </View>
                  </AppCard>
                </Pressable>
              ))
            )}

            {/* Actions */}
            <AppCard padding={18}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Goal Actions
              </Text>

              <AppButton
                title={
                  goal.status === "completed"
                    ? "Mark as Active"
                    : "Mark as Completed"
                }
                onPress={handleStatusToggle}
                variant="secondary"
                fullWidth
                leftIcon={
                  <CheckCircle2 size={18} color={theme.primary} />
                }
              />

              <AppButton
                title="Delete Goal"
                onPress={handleDelete}
                variant="danger"
                fullWidth
                style={{ marginTop: 12 }}
                leftIcon={<Trash2 size={18} color="#FFFFFF" />}
              />
            </AppCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    padding: 24,
  },
  notFound: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  goalIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  goalTitle: {
    fontSize: 21,
    fontWeight: "800",
  },
  categoryText: {
    fontSize: 13,
    marginTop: 5,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 16,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 16,
  },
  dateFieldContainer: {
    gap: 8,
    marginBottom: 12,
  },
  dateField: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 12,
  },
  dateText: {
    fontSize: 14,
  },
  clearDate: {
    fontSize: 13,
    fontWeight: "600",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  progressPercent: {
    fontSize: 27,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 17,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  taskCard: {
    marginBottom: 10,
  },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  taskMeta: {
    fontSize: 11,
    marginTop: 7,
  },
  emptyContainer: {
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptyDescription: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 20,
  },
  headerAction: {
  padding: 8, 
  alignItems: "center",
  justifyContent: "center",
},
});