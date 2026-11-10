
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";

import { initializeDatabase } from "@/database/initDatabase";
import { useTheme } from "@/hooks/use-theme";

export default function RootLayout() {
  const theme = useTheme();

  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function prepareDatabase() {
      try {
        await initializeDatabase();

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
    </>
  );
}
