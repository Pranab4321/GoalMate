
import { create } from "zustand";

import type {
  UserSettings,
  UpdateSettingsInput,
} from "@/types/settings";

import {
  getUserSettings,
  updateUserSettings,
  resetUserSettings,
} from "@/database/settingsRepository";

interface SettingsState {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;

  fetchSettings: () => Promise<void>;
  updateSettings: (input: UpdateSettingsInput) => Promise<void>;
  resetSettings: () => Promise<void>;
  clearError: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  error: null,

  /**
   * Load user settings from SQLite.
   */
  fetchSettings: async () => {
    set({ isLoading: true, error: null });

    try {
      const settings = await getUserSettings();

      set({
        settings,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch settings:", error);

      set({
        isLoading: false,
        error: "Unable to load user settings.",
      });
    }
  },

  /**
   * Update settings in SQLite and Zustand.
   */
  updateSettings: async (input) => {
    set({ error: null });

    try {
      await updateUserSettings(input);

      const settings = await getUserSettings();

      set({ settings });
    } catch (error) {
      console.error("Failed to update settings:", error);

      set({ error: "Unable to update user settings." });
      throw error;
    }
  },

  /**
   * Restore default settings.
   */
  resetSettings: async () => {
    set({ error: null });

    try {
      await resetUserSettings();

      const settings = await getUserSettings();

      set({ settings });
    } catch (error) {
      console.error("Failed to reset settings:", error);

      set({ error: "Unable to reset user settings." });
      throw error;
    }
  },

  /**
   * Clear errors.
   */
  clearError: () => set({ error: null }),
}));
