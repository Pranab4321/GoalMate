
import { create } from "zustand";

import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/types/task";

import {
  createTask as createTaskInDB,
  getAllTasks,
  getTaskById,
  getTasksByGoalId,
  getTasksByDate,
  updateTask as updateTaskInDB,
  completeTask as completeTaskInDB,
  deleteTask as deleteTaskInDB,
} from "@/database/taskRepository";

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;

  fetchTasks: () => Promise<void>;
  fetchTaskById: (id: string) => Promise<Task | null>;
  fetchTasksByGoalId: (goalId: string) => Promise<Task[]>;
  fetchTasksByDate: (date: string) => Promise<Task[]>;

  addTask: (input: CreateTaskInput) => Promise<string>;
  editTask: (id: string, input: UpdateTaskInput) => Promise<void>;
  markTaskCompleted: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;

  clearError: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  /**
   * Fetch all tasks from SQLite.
   */
  fetchTasks: async () => {
    set({ isLoading: true, error: null });

    try {
      const tasks = await getAllTasks();

      set({
        tasks,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to fetch tasks:", error);

      set({
        isLoading: false,
        error: "Unable to load tasks.",
      });
    }
  },

  /**
   * Fetch one task by ID.
   */
  fetchTaskById: async (id) => {
    try {
      return await getTaskById(id);
    } catch (error) {
      console.error("Failed to fetch task:", error);
      set({ error: "Unable to load this task." });
      return null;
    }
  },

  /**
   * Fetch tasks belonging to a particular goal.
   */
  fetchTasksByGoalId: async (goalId) => {
    try {
      return await getTasksByGoalId(goalId);
    } catch (error) {
      console.error("Failed to fetch goal tasks:", error);
      set({ error: "Unable to load goal tasks." });
      return [];
    }
  },

  /**
   * Fetch tasks scheduled for a particular date.
   */
  fetchTasksByDate: async (date) => {
    try {
      return await getTasksByDate(date);
    } catch (error) {
      console.error("Failed to fetch scheduled tasks:", error);
      set({ error: "Unable to load scheduled tasks." });
      return [];
    }
  },

  /**
   * Create a task and update Zustand state.
   */
  addTask: async (input) => {
    set({ error: null });

    try {
      const id = await createTaskInDB(input);
      const newTask = await getTaskById(id);

      if (!newTask) {
        throw new Error("Created task could not be retrieved.");
      }

      set((state) => ({
        tasks: [newTask, ...state.tasks],
      }));

      return id;
    } catch (error) {
      console.error("Failed to create task:", error);
      set({ error: "Unable to create task." });
      throw error;
    }
  },

  /**
   * Update a task.
   */
  editTask: async (id, input) => {
    set({ error: null });

    try {
      await updateTaskInDB(id, input);

      const updatedTask = await getTaskById(id);

      if (updatedTask) {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? updatedTask : task
          ),
        }));
      }
    } catch (error) {
      console.error("Failed to update task:", error);
      set({ error: "Unable to update task." });
      throw error;
    }
  },

  /**
   * Mark a task as completed.
   */
  markTaskCompleted: async (id) => {
    set({ error: null });

    try {
      await completeTaskInDB(id);

      const updatedTask = await getTaskById(id);

      if (updatedTask) {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? updatedTask : task
          ),
        }));
      }
    } catch (error) {
      console.error("Failed to complete task:", error);
      set({ error: "Unable to complete task." });
      throw error;
    }
  },

  /**
   * Delete a task.
   */
  removeTask: async (id) => {
    set({ error: null });

    try {
      await deleteTaskInDB(id);

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete task:", error);
      set({ error: "Unable to delete task." });
      throw error;
    }
  },

  /**
   * Clear any displayed error.
   */
  clearError: () => set({ error: null }),
}));
