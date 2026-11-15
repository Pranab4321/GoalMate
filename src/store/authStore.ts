import { create } from "zustand";

import {
  AuthApiError,
  getCurrentUser,
  loginUser,
  registerUser,
} from "@/services/authService";

import type {
  AuthUser,
  LoginInput,
  RegisterInput,
} from "@/services/authService";

import {
  deleteAuthToken,
  getAuthToken,
  saveAuthToken,
} from "@/services/secureTokenStorage";

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  register: (input: RegisterInput) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

async function saveSessionToken(token: string): Promise<void> {
  try {
    await saveAuthToken(token);
  } catch {
    // Remove a possibly partial/stale token so the app stays in guest mode.
    try {
      await deleteAuthToken();
    } catch (cleanupError) {
      console.warn(
        "Unable to clean up an authentication token after secure storage failed:",
        cleanupError
      );
    }

    throw new Error(
      "Your account was verified, but GoalMate couldn't securely save your login session. Please try again."
    );
  }
}

// Prevent simultaneous session checks when the app rapidly changes state.
let isRestoringSession = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  register: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const session = await registerUser(input);
      await saveSessionToken(session.token);

      set({
        user: session.user,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      set({
        user: null,
        isLoading: false,
        isInitialized: true,
        error: getErrorMessage(error, "Unable to create your account."),
      });
      throw error;
    }
  },

  login: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const session = await loginUser(input);
      await saveSessionToken(session.token);

      set({
        user: session.user,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      set({
        user: null,
        isLoading: false,
        isInitialized: true,
        error: getErrorMessage(error, "Unable to log in."),
      });
      throw error;
    }
  },

  restoreSession: async () => {
    if (isRestoringSession) {
      return;
    }

    isRestoringSession = true;
    set({ isLoading: true, error: null });

    try {
      const token = await getAuthToken();

      if (!token) {
        set({
          user: null,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
        return;
      }

      const user = await getCurrentUser(token);

      set({
        user,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      if (error instanceof AuthApiError && error.status === 401) {
        try {
          await deleteAuthToken();
        } catch (storageError) {
          console.warn(
            "Unable to remove an invalid authentication token:",
            storageError
          );
        }

        set({
          user: null,
          isLoading: false,
          isInitialized: true,
          error: null,
        });
        return;
      }

      // Keep the token after network/server errors so a later retry can restore it.
      set({
        user: null,
        isLoading: false,
        isInitialized: true,
        error: getErrorMessage(
          error,
          "Unable to restore your session. Please try again."
        ),
      });
    } finally {
      isRestoringSession = false;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      await deleteAuthToken();

      set({
        user: null,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(
          error,
          "Unable to securely sign out. Please try again."
        ),
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
