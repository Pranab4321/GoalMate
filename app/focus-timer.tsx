
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react-native";

import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radius, Typography } from "@/theme";

import AppCard from "@/components/common/AppCard";
import AppButton from "@/components/common/AppButton";
import AppHeader from "@/components/common/AppHeader";

import { useSettingsStore } from "@/store/settingsStore";
import { useTaskStore } from "@/store/taskStore";
import { useFocusSessionStore } from "@/store/focusSessionStore";

import type { FocusSessionType } from "@/types/focusSession";

type TimerStatus = "idle" | "running" | "paused" | "finished";

const TIMER_MODES: {
  label: string;
  type: FocusSessionType;
}[] = [
  { label: "Focus", type: "focus" },
  { label: "Short Break", type: "short_break" },
  { label: "Long Break", type: "long_break" },
];

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

export default function FocusTimerScreen() {
  const colors = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ taskId?: string }>();

  const settings = useSettingsStore((state) => state.settings);

  const tasks = useTaskStore((state) => state.tasks);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);

  const addSession = useFocusSessionStore(
    (state) => state.addSession
  );

  const refreshFocusStats = useFocusSessionStore(
    (state) => state.refreshFocusStats
  );

  const [mode, setMode] = useState<FocusSessionType>("focus");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    params.taskId ?? null
  );
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const startTimeRef = useRef<string | null>(null);
  const elapsedBeforePauseRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const remainingRef = useRef(25 * 60);
  const modeRef = useRef<FocusSessionType>("focus");
  const taskIdRef = useRef<string | null>(params.taskId ?? null);
  const statusRef = useRef<TimerStatus>("idle");
  const savingRef = useRef(false);
  const mountedRef = useRef(true);

  const getDuration = (type: FocusSessionType) => {
    if (type === "focus") {
      return settings?.pomodoro_duration ?? 25;
    }

    if (type === "short_break") {
      return settings?.short_break_duration ?? 5;
    }

    return settings?.long_break_duration ?? 15;
  };

  const getElapsedSeconds = () => {
    let elapsed = elapsedBeforePauseRef.current;

    if (segmentStartRef.current !== null) {
      elapsed += Math.max(
        0,
        Math.floor((Date.now() - segmentStartRef.current) / 1000)
      );
    }

    return elapsed;
  };

  const saveSession = async (
    sessionStatus: "completed" | "interrupted"
  ) => {
    if (savingRef.current || !sessionStartRef.current || !startTimeRef.current) {
      return;
    }

    const elapsedSeconds = getElapsedSeconds();
    const durationMinutes = Math.floor(elapsedSeconds / 60);

    // SQLite stores focus duration in whole minutes.
    // Do not save sessions shorter than one minute.
    if (durationMinutes < 1) {
      return;
    }

    savingRef.current = true;

    if (mountedRef.current) {
      setIsSaving(true);
    }

    const endTime = new Date().toISOString();
    const sessionType = modeRef.current;
    const taskId = taskIdRef.current;

    try {
      await addSession({
        task_id: taskId,
        start_time: startTimeRef.current,
        end_time: endTime,
        duration: durationMinutes,
        session_type: sessionType,
        status: sessionStatus,
      });

      await refreshFocusStats(getLocalDateString(new Date()));

      if (sessionStatus === "completed" && sessionType === "focus") {
        Alert.alert(
          "Focus session completed!",
          `You focused for ${durationMinutes} minute(s). Great work!`
        );
      } else if (sessionStatus === "interrupted") {
        Alert.alert(
          "Session interrupted",
          `${durationMinutes} minute(s) of activity have been saved.`
        );
      }
    } catch {
      Alert.alert(
        "Saving failed",
        "Unable to save this focus session. Please try again."
      );
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  };

const finishSession = async (
  sessionStatus: "completed" | "interrupted"
) => {
  if (statusRef.current !== "running" && statusRef.current !== "paused") {
    return;
  }

  // Preserve elapsed time before stopping the timer.
  elapsedBeforePauseRef.current = getElapsedSeconds();

  segmentStartRef.current = null;
  deadlineRef.current = null;

  statusRef.current =
    sessionStatus === "completed" ? "finished" : "idle";

  setStatus(statusStatusValue(sessionStatus));

  await saveSession(sessionStatus);
};

  function statusStatusValue(
    sessionStatus: "completed" | "interrupted"
  ): TimerStatus {
    return sessionStatus === "completed" ? "finished" : "idle";
  }

  const handleStart = () => {
    if (statusRef.current === "running" || savingRef.current) {
      return;
    }

    if (statusRef.current === "finished") {
      handleReset(false);
    }

    const now = Date.now();

    if (!sessionStartRef.current) {
      sessionStartRef.current = now;
      startTimeRef.current = new Date(now).toISOString();
      elapsedBeforePauseRef.current = 0;
    }

    segmentStartRef.current = now;

    const remaining = remainingRef.current;

    deadlineRef.current = now + remaining * 1000;

    statusRef.current = "running";
    setStatus("running");
  };

  const handlePause = () => {
    if (statusRef.current !== "running") {
      return;
    }

    elapsedBeforePauseRef.current = getElapsedSeconds();
    segmentStartRef.current = null;
    deadlineRef.current = null;

    statusRef.current = "paused";
    setStatus("paused");
  };

  const handleReset = async (saveInterrupted = true) => {
    if (
      saveInterrupted &&
      (statusRef.current === "running" ||
        statusRef.current === "paused")
    ) {
      await finishSession("interrupted");
    }

    const duration = getDuration(modeRef.current) * 60;

    elapsedBeforePauseRef.current = 0;
    segmentStartRef.current = null;
    sessionStartRef.current = null;
    startTimeRef.current = null;
    deadlineRef.current = null;

    remainingRef.current = duration;

    statusRef.current = "idle";

    setRemainingSeconds(duration);
    setStatus("idle");
  };

  const handleModeChange = async (nextMode: FocusSessionType) => {
    if (statusRef.current === "running" || statusRef.current === "paused") {
      await finishSession("interrupted");
    }

    modeRef.current = nextMode;
    setMode(nextMode);

    await handleReset(false);
  };

  // Load tasks when the timer screen opens.
  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  // Update timer when saved durations are loaded or changed.
  useEffect(() => {
    if (statusRef.current === "idle") {
      const duration = getDuration(modeRef.current) * 60;

      remainingRef.current = duration;
      setRemainingSeconds(duration);
    }
  }, [
    settings?.pomodoro_duration,
    settings?.short_break_duration,
    settings?.long_break_duration,
  ]);

  // Keep selected task synchronized with the task reference.
  useEffect(() => {
    taskIdRef.current = selectedTaskId;
  }, [selectedTaskId]);

  // Countdown uses an absolute deadline to avoid accumulating
  // interval delays when the app temporarily goes into the background.
  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const interval = setInterval(() => {
      if (deadlineRef.current === null) {
        return;
      }

      const seconds = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000)
      );

      remainingRef.current = seconds;
      setRemainingSeconds(seconds);

      if (seconds <= 0) {
        void finishSession("completed");
      }
    }, 250);

    return () => clearInterval(interval);
  }, [status]);

  // If the user leaves this screen while a session is active,
  // save it as interrupted.
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      if (
        statusRef.current === "running" ||
        statusRef.current === "paused"
      ) {
        void finishSession("interrupted");
      }
    };
  }, []);

  // If the app goes into the background, pause the active session
  // so it does not silently continue.
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (
          nextState !== "active" &&
          statusRef.current === "running"
        ) {
          void finishSession("interrupted");
        }
      }
    );

    return () => subscription.remove();
  }, []);

  const selectedTask = tasks.find(
    (task) => task.id === selectedTaskId
  );

  const activeMode = TIMER_MODES.find(
    (item) => item.type === mode
  );

  const progress =
    getDuration(mode) > 0
      ? 1 - remainingSeconds / (getDuration(mode) * 60)
      : 0;

  const handleBack = () => {
    if (
      statusRef.current === "running" ||
      statusRef.current === "paused"
    ) {
      Alert.alert(
        "End focus session?",
        "Leaving now will save your session as interrupted.",
        [
          { text: "Stay", style: "cancel" },
          {
            text: "Leave",
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );

      return;
    }

    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          title="Focus Timer"
          subtitle="Stay focused. Make progress."
          leftAction={
            <Pressable onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
          }
        />

        <View style={styles.modeContainer}>
          {TIMER_MODES.map((item) => {
            const selected = item.type === mode;

            return (
              <Pressable
                key={item.type}
                disabled={status === "running" || status === "paused" || isSaving}
                onPress={() => void handleModeChange(item.type)}
                style={[
                  styles.modeButton,
                  {
                    backgroundColor: selected
                      ? colors.primary
                      : colors.surface,
                    borderColor: selected
                      ? colors.primary
                      : colors.border,
                    opacity:
                      status === "running" || status === "paused"
                        ? 0.55
                        : 1,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? "#FFFFFF" : colors.text,
                    fontWeight: "600",
                    fontSize: Typography.fontSize.sm,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <AppCard style={styles.timerCard}>
          <Text style={[styles.modeLabel, { color: colors.textSecondary }]}>
            {activeMode?.label.toUpperCase()}
          </Text>

          <View
            style={[
              styles.timerCircle,
              { borderColor: colors.primary + "30" },
            ]}
          >
            <View
              style={[
                styles.timerInner,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.timerText, { color: colors.text }]}>
                {formatTime(remainingSeconds)}
              </Text>

              <Text style={[styles.timerCaption, { color: colors.textSecondary }]}>
                {status === "running"
                  ? "Stay focused"
                  : status === "paused"
                    ? "Timer paused"
                    : status === "finished"
                      ? "Session completed"
                      : "Ready to begin"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.progressTrack,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                },
              ]}
            />
          </View>

<View style={styles.timerActions}>
  {status === "running" ? (
    <AppButton
      title="Pause"
      onPress={handlePause}
      leftIcon={<Pause size={18} color="#FFFFFF" />}
      style={{ flex: 1 }}
    />
  ) : (
    <AppButton
      title={
        status === "paused"
          ? "Resume"
          : status === "finished"
            ? "Start Again"
            : "Start Focus"
      }
      onPress={handleStart}
      disabled={isSaving}
      leftIcon={<Play size={18} color="#FFFFFF" />}
      style={{ flex: 1 }}
    />
  )}

  <Pressable
    onPress={() => void handleReset()}
    disabled={isSaving}
    style={[
      styles.resetButton,
      {
        backgroundColor: colors.surfaceSecondary,
        opacity: isSaving ? 0.5 : 1,
      },
    ]}
  >
    <RotateCcw size={19} color={colors.text} />
  </Pressable>
</View>


          {isSaving && (
            <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
              Saving session...
            </Text>
          )}
        </AppCard>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Link a Task
          </Text>
        </View>

        <AppCard style={styles.taskCard}>
          <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>
            Associate this session with a task to keep track of where your
            focus time is spent.
          </Text>

          <Pressable
            disabled={status === "running" || status === "paused"}
            onPress={() => setShowTaskSelector((value) => !value)}
            style={[
              styles.taskSelector,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                opacity:
                  status === "running" || status === "paused" ? 0.5 : 1,
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.selectedTaskTitle, { color: colors.text }]}>
                {selectedTask?.title ?? "No task selected"}
              </Text>

              <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>
                {selectedTask
                  ? "Session will be linked to this task"
                  : "You can start a session without a task"}
              </Text>
            </View>

            <Clock3 size={19} color={colors.primary} />
          </Pressable>

          {showTaskSelector && (
            <View style={styles.taskOptions}>
              <Pressable
                onPress={() => {
                  setSelectedTaskId(null);
                  setShowTaskSelector(false);
                }}
                style={styles.taskOption}
              >
                <Text style={{ color: colors.text }}>
                  No task
                </Text>
                {!selectedTaskId && (
                  <CheckCircle2 size={18} color={colors.success} />
                )}
              </Pressable>

              {tasks
                .filter(
                  (task) =>
                    task.status !== "completed" &&
                    task.status !== "cancelled"
                )
                .map((task) => (
                  <Pressable
                    key={task.id}
                    onPress={() => {
                      setSelectedTaskId(task.id);
                      setShowTaskSelector(false);
                    }}
                    style={styles.taskOption}
                  >
                    <Text
                      numberOfLines={2}
                      style={{ color: colors.text, flex: 1 }}
                    >
                      {task.title}
                    </Text>

                    {selectedTaskId === task.id && (
                      <CheckCircle2 size={18} color={colors.success} />
                    )}
                  </Pressable>
                ))}
            </View>
          )}
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing["5xl"],
    gap: Spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  modeContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  timerCard: {
    alignItems: "center",
    gap: Spacing.xl,
    paddingVertical: Spacing["2xl"],
    marginTop: Spacing.md,
  },
  modeLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 2,
  },
  timerCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timerInner: {
    width: 222,
    height: 222,
    borderRadius: 111,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 48,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timerCaption: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.sm,
  },
  progressTrack: {
    height: 8,
    width: "100%",
    borderRadius: Radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.full,
  },
  timerActions: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: Spacing.md,
  },
  resetButton: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  taskCard: {
    gap: Spacing.md,
  },
  taskDescription: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  taskSelector: {
    minHeight: 65,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  selectedTaskTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  taskOptions: {
    gap: Spacing.xs,
  },
  taskOption: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#88888840",
  },
});
