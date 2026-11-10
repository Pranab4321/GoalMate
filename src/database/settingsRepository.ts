
import { getDatabase } from "./database";
import type {
  UserSettings,
  UpdateSettingsInput,
} from "@/types/settings";

/**
 * Retrieve user settings.
 */
export async function getUserSettings(): Promise<UserSettings> {
  const db = await getDatabase();

  // Ensure the default settings row exists.
  await db.runAsync(
    `INSERT OR IGNORE INTO user_settings (id) VALUES (1)`
  );

  const settings = await db.getFirstAsync<UserSettings>(
    `SELECT * FROM user_settings WHERE id = 1`
  );

  if (!settings) {
    throw new Error("Unable to retrieve user settings.");
  }

  return {
    ...settings,
    notifications_enabled: Boolean(settings.notifications_enabled),
    daily_reminder_enabled: Boolean(settings.daily_reminder_enabled),
  };
}

/**
 * Update user settings.
 */
export async function updateUserSettings(
  input: UpdateSettingsInput
): Promise<void> {
  const db = await getDatabase();

  const allowedFields = [
    "user_name",
    "user_email",
    "theme",
    "notifications_enabled",
    "daily_reminder_enabled",
    "daily_reminder_time",
    "pomodoro_duration",
    "short_break_duration",
    "long_break_duration",
  ];

  const validFields = Object.entries(input).filter(
    ([key, value]) =>
      allowedFields.includes(key) && value !== undefined
  );

  if (validFields.length === 0) return;

  const setClause = validFields
    .map(([key]) => `${key} = ?`)
    .join(", ");

  const values = validFields.map(([key, value]) => {
    if (
      key === "notifications_enabled" ||
      key === "daily_reminder_enabled"
    ) {
      return value ? 1 : 0;
    }

    return value ?? null;
  });

  await db.runAsync(
    `UPDATE user_settings
     SET ${setClause},
         updated_at = CURRENT_TIMESTAMP
     WHERE id = 1`,
    values
  );
}

/**
 * Reset user preferences to their default values.
 */
export async function resetUserSettings(): Promise<void> {
  const db = await getDatabase();

  await db.runAsync(`
    UPDATE user_settings
    SET user_name = '',
        user_email = '',
        theme = 'system',
        notifications_enabled = 1,
        daily_reminder_enabled = 1,
        daily_reminder_time = '08:00',
        pomodoro_duration = 25,
        short_break_duration = 5,
        long_break_duration = 15,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `);
}
