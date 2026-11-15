import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus, ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { initializeDatabase } from "@/database/initDatabase";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/hooks/use-theme";
import { syncDailyReminder } from "@/services/notificationService";
import AppDialogHost from "@/components/common/AppDialogHost";

export default function RootLayout() {
  const theme = useTheme();

  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const appState = useRef<AppStateStatus | null | undefined>(
    AppState.currentState as AppStateStatus | null | undefined
  );
  
  useEffect(() => {
    let isMounted = true;

    async function prepareDatabase() {
      try {
        await initializeDatabase();

        await useSettingsStore.getState().fetchSettings();

        // Restore the saved daily reminder without showing a permission prompt.
        const savedSettings = useSettingsStore.getState().settings;
        if (savedSettings) {
          syncDailyReminder(savedSettings, false).catch((error) => {
            console.warn("Unable to restore daily reminder schedule:", error);
          });
        }

        // Initial session check. Guest mode and database startup do not wait
        // for the backend to be reachable.
        void useAuthStore.getState().restoreSession();

        if (isMounted) {
          setIsDatabaseReady(true);
        }
      } catch (error) {
        console.error("Database initialization failed:", error);

        if (isMounted) {
          setDatabaseError("Unable to initialize the database.");
        }
      }
    }

    prepareDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const wasInBackground =
        appState.current === "background" || appState.current === "inactive";

      if (wasInBackground && nextAppState === "active") {
        // Retry session restoration when the user returns to GoalMate.
        // A missing token is harmless; an invalid token is handled by the store.
        void useAuthStore.getState().restoreSession();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (databaseError) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (!isDatabaseReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
      <AppDialogHost />
    </>
  );
}
