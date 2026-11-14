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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  /**
   * Register a new account, securely save its token,
   * and update the authenticated user in Zustand.
   */
  register: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const session = await registerUser(input);

      await saveAuthToken(session.token);

      set({
        user: session.user,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, "Unable to create your account."),
      });

      throw error;
    }
  },

  /**
   * Log in an existing account, securely save its token,
   * and update the authenticated user in Zustand.
   */
  login: async (input) => {
    set({ isLoading: true, error: null });

    try {
      const session = await loginUser(input);

      await saveAuthToken(session.token);

      set({
        user: session.user,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, "Unable to log in."),
      });

      throw error;
    }
  },

  /**
   * Restore an existing session when the app starts.
   * A 401 response means the token is invalid or expired,
   * so it is removed. Network and other server errors do
   * not delete the saved token.
   */
  restoreSession: async () => {
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

      set({
        user: null,
        isLoading: false,
        isInitialized: true,
        error: getErrorMessage(
          error,
          "Unable to restore your session. Please try again."
        ),
      });
    }
  },

  /**
   * Remove the stored token and clear the authenticated user.
   */
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
        error: getErrorMessage(error, "Unable to log out."),
      });

      throw error;
    }
  },

  /**
   * Clear the current authentication error.
   */
  clearError: () => set({ error: null }),
}));
