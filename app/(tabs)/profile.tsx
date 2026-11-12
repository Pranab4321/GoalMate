
import React, { useCallback, useEffect, useState } from "react";

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

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
import { useSettingsStore } from "@/store/settingsStore";
import { useGoalStore } from "@/store/goalStore";
import { useTaskStore } from "@/store/taskStore";
import { useFocusSessionStore } from "@/store/focusSessionStore";
import { syncDailyReminder } from "@/services/notificationService";

function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Keep the same local-date handling used by the Analytics screen.
function getLocalDateFromTimestamp(
  timestamp: string | null
): string | null {
  if (!timestamp) return null;

  const normalized = timestamp.includes("T")
    ? timestamp
    : `${timestamp.replace(" ", "T")}Z`;

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return null;

  return getDateString(date);
}

function calculateCurrentStreak(completedDates: Set<string>): number {
  const today = new Date();
  const todayString = getDateString(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const yesterdayString = getDateString(yesterday);

  let currentDate = completedDates.has(todayString)
    ? today
    : completedDates.has(yesterdayString)
      ? yesterday
      : null;

  if (!currentDate) return 0;

  let streak = 0;

  while (completedDates.has(getDateString(currentDate))) {
    streak += 1;

    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}


export default function ProfileScreen() {
  const colors = useTheme();

  const settings = useSettingsStore((state) => state.settings);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);

  const goals = useGoalStore((state) => state.goals);
  const fetchGoals = useGoalStore((state) => state.fetchGoals);

  const tasks = useTaskStore((state) => state.tasks);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);

  const sessions = useFocusSessionStore((state) => state.sessions);
  const fetchSessions = useFocusSessionStore((state) => state.fetchSessions);

  //here paste
    const updateSettings = useSettingsStore(
    (state) => state.updateSettings
  );

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [isNotificationModalVisible, setIsNotificationModalVisible] =
    useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [dailyReminderEnabled, setDailyReminderEnabled] =
    useState(true);

  const [dailyReminderTime, setDailyReminderTime] = useState("08:00");
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [isFocusSettingsVisible, setIsFocusSettingsVisible] = useState(false);

  const [focusDuration, setFocusDuration] = useState("25");
  const [shortBreakDuration, setShortBreakDuration] = useState("5");
  const [longBreakDuration, setLongBreakDuration] = useState("15");

  const [isSavingFocusSettings, setIsSavingFocusSettings] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Refresh productivity data whenever the Profile tab becomes active.
  useFocusEffect(
    useCallback(() => {
      Promise.all([fetchGoals(), fetchTasks(), fetchSessions()]).catch(
        (error) => {
          console.error("Failed to refresh profile statistics:", error);
        }
      );
    }, [fetchGoals, fetchTasks, fetchSessions])
  );

  const activeGoalsCount = goals.filter(
    (goal) => goal.status === "active"
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.status === "completed"
  );

  const completedTasksCount = completedTasks.length;

  const totalFocusMinutes = sessions
    .filter(
      (session) =>
        session.status === "completed" &&
        session.session_type === "focus"
    )
    .reduce(
      (total, session) => total + (session.duration || 0),
      0
    );

  const focusHours = Number((totalFocusMinutes / 60).toFixed(1));

  const completedDates = new Set<string>();
  completedTasks.forEach((task) => {
    const completedDate = getLocalDateFromTimestamp(task.completed_at);
    if (completedDate) completedDates.add(completedDate);
  });

  const currentStreak = calculateCurrentStreak(completedDates);

  const handleOpenEditProfile = () => {
  setProfileName(settings?.user_name || "");
  setProfileEmail(settings?.user_email || "");
  setIsEditModalVisible(true);
};

const handleSaveProfile = async () => {
  const trimmedName = profileName.trim();
  const trimmedEmail = profileEmail.trim();

  if (!trimmedName) {
    Alert.alert("Required", "Please enter your name.");
    return;
  }

  if (
    trimmedEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
  ) {
    Alert.alert("Invalid email", "Please enter a valid email address.");
    return;
  }

  try {
    setIsSavingProfile(true);

    await updateSettings({
      user_name: trimmedName,
      user_email: trimmedEmail,
    });

    setIsEditModalVisible(false);

    Alert.alert("Success", "Your profile has been updated.");
  } catch (error) {
    Alert.alert(
      "Update failed",
      "Unable to update your profile. Please try again."
    );
  } finally {
    setIsSavingProfile(false);
  }
};

const saveThemePreference = async (
  theme: "system" | "light" | "dark"
) => {
  try {
    await updateSettings({ theme });

    Alert.alert(
      "Appearance updated",
      `Your theme preference is now ${theme}.`
    );
  } catch (error) {
    Alert.alert(
      "Update failed",
      "Unable to save your appearance preference."
    );
  }
};

const handleAppearancePress = () => {
  Alert.alert(
    "Choose Appearance",
    "Select your preferred theme.",
    [
      {
        text: "System",
        onPress: () => {
          void saveThemePreference("system");
        },
      },
      {
        text: "Light",
        onPress: () => {
          void saveThemePreference("light");
        },
      },
      {
        text: "Dark",
        onPress: () => {
          void saveThemePreference("dark");
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]
  );
};

const handleOpenNotifications = () => {
  setNotificationsEnabled(settings?.notifications_enabled ?? true);
  setDailyReminderEnabled(settings?.daily_reminder_enabled ?? true);
  setDailyReminderTime(settings?.daily_reminder_time || "08:00");

  setIsNotificationModalVisible(true);
};

const handleSaveNotifications = async () => {
  try {
    // Save the user's preferences first so they are never lost if the
    // operating system declines or fails to schedule a notification.
    await updateSettings({
      notifications_enabled: notificationsEnabled,
      daily_reminder_enabled: dailyReminderEnabled,
      daily_reminder_time: dailyReminderTime,
    });
  } catch (error) {
    Alert.alert(
      "Update failed",
      "Unable to save notification preferences. Please try again."
    );
    return;
  }

  setIsNotificationModalVisible(false);

  try {
    const result = await syncDailyReminder(
      {
        notifications_enabled: notificationsEnabled,
        daily_reminder_enabled: dailyReminderEnabled,
        daily_reminder_time: dailyReminderTime,
      },
      true
    );

    if (result.status === "permission-denied") {
      Alert.alert(
        "Preferences saved",
        result.canAskAgain
          ? "Your preferences were saved, but GoalMate cannot schedule the reminder until notification permission is granted. You can try saving again after allowing notifications."
          : "Your preferences were saved, but notifications are blocked by your device. Open your phone's Settings, find GoalMate, and allow notifications."
      );
      return;
    }

    if (result.status === "unsupported") {
      Alert.alert(
        "Preferences saved",
        "Your preferences were saved. Scheduled local reminders are not available on this platform."
      );
      return;
    }

    Alert.alert(
      "Preferences saved",
      result.status === "scheduled"
        ? "Your daily reminder has been scheduled successfully."
        : "Your notification preferences have been updated."
    );
  } catch (error) {
    console.error("Failed to synchronize daily reminder:", error);
    Alert.alert(
      "Preferences saved",
      "Your settings were saved, but GoalMate could not update the reminder schedule. Please reopen Notifications and save your preferences again."
    );
  }
};

const handleOpenFocusSettings = () => {
  setFocusDuration(String(settings?.pomodoro_duration ?? 25));
  setShortBreakDuration(String(settings?.short_break_duration ?? 5));
  setLongBreakDuration(String(settings?.long_break_duration ?? 15));

  setIsFocusSettingsVisible(true);
};

const handleSaveFocusSettings = async () => {
  const focus = Number(focusDuration);
  const shortBreak = Number(shortBreakDuration);
  const longBreak = Number(longBreakDuration);

  if (
    !Number.isInteger(focus) ||
    focus < 1 ||
    focus > 180
  ) {
    Alert.alert("Invalid duration", "Focus duration must be between 1 and 180 minutes.");
    return;
  }

  if (
    !Number.isInteger(shortBreak) ||
    shortBreak < 1 ||
    shortBreak > 60
  ) {
    Alert.alert("Invalid duration", "Short break must be between 1 and 60 minutes.");
    return;
  }

  if (
    !Number.isInteger(longBreak) ||
    longBreak < 1 ||
    longBreak > 60
  ) {
    Alert.alert("Invalid duration", "Long break must be between 1 and 60 minutes.");
    return;
  }

  try {
    setIsSavingFocusSettings(true);

    await updateSettings({
      pomodoro_duration: focus,
      short_break_duration: shortBreak,
      long_break_duration: longBreak,
    });

    setIsFocusSettingsVisible(false);

    Alert.alert(
      "Settings saved",
      "Your focus and break durations have been updated."
    );
  } catch (error) {
    Alert.alert(
      "Update failed",
      "Unable to save your focus settings. Please try again."
    );
  } finally {
    setIsSavingFocusSettings(false);
  }
};

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
      action: handleOpenNotifications,
    },
    {
      title: "Focus Settings",
      subtitle: "Customize focus and break durations",
      icon: Clock3,
      action: handleOpenFocusSettings,
    },
    {
      title: "Appearance",
      subtitle: "Light and dark theme preferences",
      icon: Moon,
      action: handleAppearancePress,
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
              onPress={handleOpenEditProfile}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Pencil size={17} color={colors.text} />
            </Pressable>
          </View>

          <Text style={[styles.userName, { color: colors.text }]}>
            {settings?.user_name || "GoalMate User"}
          </Text>

          <Text
            style={[
              styles.userEmail,
              { color: colors.textSecondary },
            ]}
          >
            {settings?.user_email || "Welcome to GoalMate"}
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
              {activeGoalsCount}
            </Text>

            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Active Goals
            </Text>
          </AppCard>

          <AppCard style={styles.statCard}>
            <CheckCircle2 size={21} color={colors.success} />

            <Text style={[styles.statValue, { color: colors.text }]}>
              {completedTasksCount}
            </Text>

            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Tasks Done
            </Text>
          </AppCard>

          <AppCard style={styles.statCard}>
            <Clock3 size={21} color={colors.warning} />

            <Text style={[styles.statValue, { color: colors.text }]}>
              {focusHours}h
            </Text>

            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Focus Hours
            </Text>
          </AppCard>

          <AppCard style={styles.statCard}>
            <Flame size={21} color={colors.danger} />

            <Text style={[styles.statValue, { color: colors.text }]}>
              {currentStreak} Days
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
{/* *************************** */}
      <Modal
  visible={isEditModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setIsEditModalVisible(false)}
>
  <KeyboardAvoidingView
    style={styles.modalOverlay}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
  >
    <View
      style={[
        styles.modalContent,
        { backgroundColor: colors.surface },
      ]}
    >
      <Text style={[styles.modalTitle, { color: colors.text }]}>
        Edit Profile
      </Text>

      <Text style={[styles.inputLabel, { color: colors.text }]}>
        Full Name
      </Text>

      <TextInput
        value={profileName}
        onChangeText={setProfileName}
        placeholder="Enter your name"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.profileInput,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
        autoCapitalize="words"
      />

      <Text style={[styles.inputLabel, { color: colors.text }]}>
        Email Address
      </Text>

      <TextInput
        value={profileEmail}
        onChangeText={setProfileEmail}
        placeholder="Enter your email"
        placeholderTextColor={colors.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
        style={[
          styles.profileInput,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      />

      <View style={styles.modalActions}>
        <Pressable
          onPress={() => setIsEditModalVisible(false)}
          disabled={isSavingProfile}
          style={[
            styles.modalButton,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Text style={[styles.modalButtonText, { color: colors.text }]}>
            Cancel
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSaveProfile}
          disabled={isSavingProfile}
          style={[
            styles.modalButton,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>
            {isSavingProfile ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>
      </View>
    </View>
  </KeyboardAvoidingView>
</Modal>
{/* *********************** */}

<Modal
  visible={isNotificationModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setIsNotificationModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View
      style={[
        styles.modalContent,
        { backgroundColor: colors.surface },
      ]}
    >
      <Text style={[styles.modalTitle, { color: colors.text }]}>
        Notification Preferences
      </Text>

      {/* Master Notifications */}
      <View style={styles.notificationRow}>
        <View style={styles.notificationInfo}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Enable Notifications
          </Text>
          <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
            Allow GoalMate notifications
          </Text>
        </View>

        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{
            false: colors.border,
            true: colors.primary,
          }}
        />
      </View>

      <View style={[styles.notificationDivider, { backgroundColor: colors.border }]} />

      {/* Daily Reminder */}
      <View style={styles.notificationRow}>
        <View style={styles.notificationInfo}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Daily Reminder
          </Text>
          <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
            Receive a daily reminder
          </Text>
        </View>

        <Switch
          value={dailyReminderEnabled}
          onValueChange={setDailyReminderEnabled}
          disabled={!notificationsEnabled}
          trackColor={{
            false: colors.border,
            true: colors.primary,
          }}
        />
      </View>

      <View style={[styles.notificationDivider, { backgroundColor: colors.border }]} />

      {/* Reminder Time */}
      <Text style={[styles.inputLabel, { color: colors.text }]}>
        Daily Reminder Time
      </Text>

      <Pressable
        disabled={!notificationsEnabled || !dailyReminderEnabled}
        onPress={() => setShowTimePicker(true)}
        style={[
          styles.reminderTimeButton,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
            opacity:
              notificationsEnabled && dailyReminderEnabled ? 1 : 0.5,
          },
        ]}
      >
        <Clock3 size={19} color={colors.primary} />

        <Text style={[styles.reminderTimeText, { color: colors.text }]}>
          {(() => {
            const [hours, minutes] = dailyReminderTime.split(":").map(Number);
            const period = hours >= 12 ? "PM" : "AM";
            const displayHours = hours % 12 || 12;

            return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
          })()}
        </Text>

        <Text style={{ color: colors.textSecondary }}>
          Change time
        </Text>
      </Pressable>

      {showTimePicker && (
  <DateTimePicker
    value={(() => {
      const [hours, minutes] = dailyReminderTime.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    })()}
    mode="time"
    display={Platform.OS === "ios" ? "spinner" : "default"}
    is24Hour={false}
    onChange={(event, selectedDate) => {
      if (Platform.OS === "android") {
        setShowTimePicker(false);
      }

      if (event.type === "set" && selectedDate) {
        const hours = String(selectedDate.getHours()).padStart(2, "0");
        const minutes = String(selectedDate.getMinutes()).padStart(2, "0");

        setDailyReminderTime(`${hours}:${minutes}`);
      }
    }}
  />
)}

{showTimePicker && Platform.OS === "ios" && (
  <Pressable
    onPress={() => setShowTimePicker(false)}
    style={[
      styles.modalButton,
      { backgroundColor: colors.primary, marginBottom: Spacing.md },
    ]}
  >
    <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>
      Done
    </Text>
  </Pressable>
)}

      <View style={styles.modalActions}>
        <Pressable
          onPress={() => setIsNotificationModalVisible(false)}
          style={[
            styles.modalButton,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Text style={[styles.modalButtonText, { color: colors.text }]}>
            Cancel
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSaveNotifications}
          style={[
            styles.modalButton,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>
            Save Preferences
          </Text>
        </Pressable>
      </View>
    </View>
  </View>
</Modal>


<Modal
  visible={isFocusSettingsVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setIsFocusSettingsVisible(false)}
>
  <KeyboardAvoidingView
    style={styles.modalOverlay}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
  >
    <View
      style={[
        styles.modalContent,
        { backgroundColor: colors.surface },
      ]}
    >
      <Text style={[styles.modalTitle, { color: colors.text }]}>
        Focus Settings
      </Text>

      <Text style={[styles.inputLabel, { color: colors.text }]}>
        Focus Duration (minutes)
      </Text>

      <TextInput
        value={focusDuration}
        onChangeText={setFocusDuration}
        keyboardType="number-pad"
        maxLength={3}
        placeholder="25"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.profileInput,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      />

      <Text style={[styles.inputLabel, { color: colors.text }]}>
        Short Break (minutes)
      </Text>

      <TextInput
        value={shortBreakDuration}
        onChangeText={setShortBreakDuration}
        keyboardType="number-pad"
        maxLength={2}
        placeholder="5"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.profileInput,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      />

      <Text style={[styles.inputLabel, { color: colors.text }]}>
        Long Break (minutes)
      </Text>

      <TextInput
        value={longBreakDuration}
        onChangeText={setLongBreakDuration}
        keyboardType="number-pad"
        maxLength={2}
        placeholder="15"
        placeholderTextColor={colors.textMuted}
        style={[
          styles.profileInput,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      />

      <View style={styles.modalActions}>
        <Pressable
          onPress={() => setIsFocusSettingsVisible(false)}
          disabled={isSavingFocusSettings}
          style={[
            styles.modalButton,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Text style={[styles.modalButtonText, { color: colors.text }]}>
            Cancel
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSaveFocusSettings}
          disabled={isSavingFocusSettings}
          style={[
            styles.modalButton,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>
            {isSavingFocusSettings ? "Saving..." : "Save Changes"}
          </Text>
        </Pressable>
      </View>
    </View>
  </KeyboardAvoidingView>
</Modal>


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

  modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  paddingHorizontal: Spacing.lg,
},

modalContent: {
  padding: Spacing.xl,
  borderRadius: Radius.xl,
},

modalTitle: {
  fontSize: Typography.fontSize.xl,
  fontWeight: Typography.fontWeight.bold,
  marginBottom: Spacing.xl,
},

inputLabel: {
  fontSize: Typography.fontSize.sm,
  fontWeight: Typography.fontWeight.semibold,
  marginBottom: Spacing.xs,
},

profileInput: {
  height: 48,
  borderWidth: 1,
  borderRadius: Radius.md,
  paddingHorizontal: Spacing.md,
  marginBottom: Spacing.lg,
  fontSize: Typography.fontSize.md,
},

modalActions: {
  flexDirection: "row",
  gap: Spacing.md,
  marginTop: Spacing.sm,
},

modalButton: {
  flex: 1,
  minHeight: 46,
  borderRadius: Radius.md,
  alignItems: "center",
  justifyContent: "center",
},

modalButtonText: {
  fontSize: Typography.fontSize.sm,
  fontWeight: Typography.fontWeight.semibold,
},

notificationRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  minHeight: 65,
  gap: Spacing.md,
},

notificationInfo: {
  flex: 1,
  gap: 4,
},

notificationDivider: {
  height: 1,
  marginVertical: Spacing.md,
},

reminderTimeButton: {
  minHeight: 50,
  borderWidth: 1,
  borderRadius: Radius.md,
  paddingHorizontal: Spacing.md,
  flexDirection: "row",
  alignItems: "center",
  gap: Spacing.md,
  marginTop: Spacing.sm,
  marginBottom: Spacing.md,
},

reminderTimeText: {
  flex: 1,
  fontSize: Typography.fontSize.md,
  fontWeight: Typography.fontWeight.semibold,
},
});
