
export type ThemePreference = "light" | "dark" | "system";

export interface UserSettings {
  id: number;
  user_name: string;
  user_email: string;
  theme: ThemePreference;
  notifications_enabled: boolean;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  pomodoro_duration: number;
  short_break_duration: number;
  long_break_duration: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsInput {
  user_name?: string;
  user_email?: string;
  theme?: ThemePreference;
  notifications_enabled?: boolean;
  daily_reminder_enabled?: boolean;
  daily_reminder_time?: string;
  pomodoro_duration?: number;
  short_break_duration?: number;
  long_break_duration?: number;
}
