
import { create } from "zustand";

import type {
  Goal,
  CreateGoalInput,
  UpdateGoalInput,
} from "@/types/goal";

import {
  createGoal as createGoalInDB,
  getAllGoals,
  getGoalById,
  updateGoal as updateGoalInDB,
  deleteGoal as deleteGoalInDB,
} from "@/database/goalRepository";

interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;

  fetchGoals: () => Promise<void>;
  fetchGoalById: (id: string) => Promise<Goal | null>;
  addGoal: (input: CreateGoalInput) => Promise<string>;
  editGoal: (id: string, input: UpdateGoalInput) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  isLoading: false,
  error: null,

  /**
   * Fetch all goals from SQLite.
   */
  fetchGoals: async () => {
    set({ isLoading: true, error: null });

    try {
      const goals = await getAllGoals();

      set({
        goals,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch goals:", error);

      set({
        isLoading: false,
        error: "Unable to load goals.",
      });
    }
  },

  /**
   * Fetch one goal by ID.
   */
  fetchGoalById: async (id) => {
    try {
      return await getGoalById(id);
    } catch (error) {
      console.error("Failed to fetch goal:", error);
      set({ error: "Unable to load this goal." });
      return null;
    }
  },

  /**
   * Create a goal and update Zustand state.
   */
  addGoal: async (input) => {
    set({ error: null });

    try {
      const id = await createGoalInDB(input);
      const newGoal = await getGoalById(id);

      if (!newGoal) {
        throw new Error("Created goal could not be retrieved.");
      }

      set((state) => ({
        goals: [newGoal, ...state.goals],
      }));

      return id;
    } catch (error) {
      console.error("Failed to create goal:", error);
      set({ error: "Unable to create goal." });
      throw error;
    }
  },

  /**
   * Update a goal and refresh its state.
   */
  editGoal: async (id, input) => {
    set({ error: null });

    try {
      await updateGoalInDB(id, input);

      const updatedGoal = await getGoalById(id);

      if (updatedGoal) {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.id === id ? updatedGoal : goal
          ),
        }));
      }
    } catch (error) {
      console.error("Failed to update goal:", error);
      set({ error: "Unable to update goal." });
      throw error;
    }
  },

  /**
   * Delete a goal and update Zustand state.
   */
  removeGoal: async (id) => {
    set({ error: null });

    try {
      await deleteGoalInDB(id);

      set((state) => ({
        goals: state.goals.filter((goal) => goal.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete goal:", error);
      set({ error: "Unable to delete goal." });
      throw error;
    }
  },

  /**
   * Clear any displayed error.
   */
  clearError: () => set({ error: null }),
}));
