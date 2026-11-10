
import { create } from "zustand";

import type {
  FocusSession,
  CreateFocusSessionInput,
  UpdateFocusSessionInput,
} from "@/types/focusSession";

import {
  createFocusSession as createSessionInDB,
  getAllFocusSessions,
  getFocusSessionsByTaskId,
  updateFocusSession as updateSessionInDB,
  deleteFocusSession as deleteSessionInDB,
  getTotalFocusMinutes,
  getDailyFocusMinutes,
} from "@/database/focusSessionRepository";

interface FocusSessionState {
  sessions: FocusSession[];
  totalFocusMinutes: number;
  dailyFocusMinutes: number;
  isLoading: boolean;
  error: string | null;

  fetchSessions: () => Promise<void>;
  fetchSessionsByTaskId: (taskId: string) => Promise<FocusSession[]>;
  addSession: (input: CreateFocusSessionInput) => Promise<string>;
  editSession: (
    id: string,
    input: UpdateFocusSessionInput
  ) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
  refreshFocusStats: (date: string) => Promise<void>;
  clearError: () => void;
}

export const useFocusSessionStore = create<FocusSessionState>((set) => ({
  sessions: [],
  totalFocusMinutes: 0,
  dailyFocusMinutes: 0,
  isLoading: false,
  error: null,

  /**
   * Fetch all focus sessions.
   */
  fetchSessions: async () => {
    set({ isLoading: true, error: null });

    try {
      const sessions = await getAllFocusSessions();

      set({
        sessions,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch focus sessions:", error);

      set({
        isLoading: false,
        error: "Unable to load focus sessions.",
      });
    }
  },

  /**
   * Fetch focus sessions for a specific task.
   */
  fetchSessionsByTaskId: async (taskId) => {
    try {
      return await getFocusSessionsByTaskId(taskId);
    } catch (error) {
      console.error("Failed to fetch task focus sessions:", error);
      set({ error: "Unable to load task focus sessions." });
      return [];
    }
  },

  /**
   * Create and save a focus session.
   */
  addSession: async (input) => {
    set({ error: null });

    try {
      const id = await createSessionInDB(input);

      await getAllFocusSessions().then((sessions) => {
        set({ sessions });
      });

      return id;
    } catch (error) {
      console.error("Failed to create focus session:", error);
      set({ error: "Unable to save focus session." });
      throw error;
    }
  },

  /**
   * Update a focus session.
   */
  editSession: async (id, input) => {
    set({ error: null });

    try {
      await updateSessionInDB(id, input);

      const sessions = await getAllFocusSessions();

      set({ sessions });
    } catch (error) {
      console.error("Failed to update focus session:", error);
      set({ error: "Unable to update focus session." });
      throw error;
    }
  },

  /**
   * Delete a focus session.
   */
  removeSession: async (id) => {
    set({ error: null });

    try {
      await deleteSessionInDB(id);

      const sessions = await getAllFocusSessions();

      set({ sessions });
    } catch (error) {
      console.error("Failed to delete focus session:", error);
      set({ error: "Unable to delete focus session." });
      throw error;
    }
  },

  /**
   * Refresh overall and daily focus statistics.
   */
  refreshFocusStats: async (date) => {
    try {
      const [totalFocusMinutes, dailyFocusMinutes] = await Promise.all([
        getTotalFocusMinutes(),
        getDailyFocusMinutes(date),
      ]);

      set({
        totalFocusMinutes,
        dailyFocusMinutes,
      });
    } catch (error) {
      console.error("Failed to refresh focus statistics:", error);
      set({ error: "Unable to load focus statistics." });
    }
  },

  /**
   * Clear errors.
   */
  clearError: () => set({ error: null }),
}));
