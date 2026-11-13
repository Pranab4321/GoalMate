import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import type { UserSettings } from "@/types/settings";

const DAILY_REMINDER_TAG = "goalmate-daily-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type DailyReminderSyncResult =
  | { status: "scheduled" }
  | { status: "disabled" }
  | { status: "permission-denied"; canAskAgain: boolean }
  | { status: "unsupported" };

type ReminderSettings = Pick<
  UserSettings,
  | "notifications_enabled"
  | "daily_reminder_enabled"
  | "daily_reminder_time"
>;

function hasNotificationPermission(
  permission: Notifications.NotificationPermissionsStatus
): boolean {
  return (
    permission.granted ||
    permission.ios?.status ===
      Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

function parseReminderTime(time: string) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

  if (!match) {
    throw new Error(`Invalid daily reminder time: ${time}`);
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

async function cancelExistingDailyReminders() {
  const scheduled =
    await Notifications.getAllScheduledNotificationsAsync();

  const managedReminders = scheduled.filter(
    (notification) =>
      notification.content.data?.goalMateNotification ===
      DAILY_REMINDER_TAG
  );

  await Promise.all(
    managedReminders.map((notification) =>
      Notifications.cancelScheduledNotificationAsync(
        notification.identifier
      )
    )
  );
}

async function performDailyReminderSync(
  settings: ReminderSettings,
  requestPermission: boolean
): Promise<DailyReminderSyncResult> {
  if (Platform.OS === "web") {
    return { status: "unsupported" };
  }

  const shouldActivate =
    settings.notifications_enabled &&
    settings.daily_reminder_enabled;

  if (!shouldActivate) {
    await cancelExistingDailyReminders();
    return { status: "disabled" };
  }

  const { hour, minute } = parseReminderTime(
    settings.daily_reminder_time
  );

  let permission = await Notifications.getPermissionsAsync();

  if (
    !hasNotificationPermission(permission) &&
    requestPermission &&
    permission.canAskAgain
  ) {
    permission = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });
  }

  if (!hasNotificationPermission(permission)) {
    await cancelExistingDailyReminders();

    return {
      status: "permission-denied",
      canAskAgain: permission.canAskAgain,
    };
  }

  await cancelExistingDailyReminders();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to work on your goals!",
      body: "A little progress today goes a long way. Open GoalMate and take your next step.",
      sound: true,
      data: {
        goalMateNotification: DAILY_REMINDER_TAG,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return { status: "scheduled" };
}

let syncQueue: Promise<void> = Promise.resolve();

export function syncDailyReminder(
  settings: ReminderSettings,
  requestPermission = false
): Promise<DailyReminderSyncResult> {
  const operation = syncQueue.then(
    () =>
      performDailyReminderSync(settings, requestPermission),
    () =>
      performDailyReminderSync(settings, requestPermission)
  );

  syncQueue = operation.then(
    () => undefined,
    () => undefined
  );

  return operation;
}
