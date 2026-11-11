
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// import { generateAIResponse } from "@/services/aiApi";
import {
  generateAIResponse,
  checkBackendConnection,
} from "@/services/aiApi";

import { useTheme } from "@/hooks/use-theme";

export default function AITestScreen() {
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function testAIConnection() {
    try {
      setLoading(true);
      setResult("");
      setError("");

      const response = await generateAIResponse(
        "Reply with exactly: GoalMate mobile API connection successful!"
      );

      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }

  }

//**************************** *//
async function testBackend() {
  try {
    setLoading(true);
    setError("");
    setResult("");

    const message = await checkBackendConnection();
    setResult(message);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Backend connection failed."
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          GoalMate API Test
        </Text>

        <Text style={[styles.description, { color: theme.text }]}>
          Test communication between your mobile app and AI backend.
        </Text>

        <TouchableOpacity
            onPress={testBackend}
            disabled={loading}
            style={[styles.button, { backgroundColor: theme.primary }]}
            >
            <Text style={styles.buttonText}>
                Test Backend Connection
            </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={testAIConnection}
          disabled={loading}
          style={[
            styles.button,
            { backgroundColor: theme.primary },
            loading && styles.disabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              Test AI Connection
            </Text>
          )}
        </TouchableOpacity>

        {result ? (
          <View style={styles.result}>
            <Text style={{ color: "#15803D", fontWeight: "700" }}>
              Success
            </Text>
            <Text style={{ color: theme.text }}>{result}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.result}>
            <Text style={{ color: "#DC2626", fontWeight: "700" }}>
              Connection Error
            </Text>
            <Text style={{ color: theme.text }}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
  },
  description: {
    fontSize: 15,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  result: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    gap: 8,
  },
});
