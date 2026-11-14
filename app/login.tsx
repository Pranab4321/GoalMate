import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Eye, EyeOff, Target } from "lucide-react-native";

import AppButton from "@/components/common/AppButton";
import AppCard from "@/components/common/AppCard";
import AppInput from "@/components/common/AppInput";
import { useTheme } from "@/hooks/use-theme";
import { useAuthStore } from "@/store/authStore";
import { Radius, Spacing, Typography } from "@/theme";

export default function LoginScreen() {
  const colors = useTheme();

  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isSubmitting = useRef(false);

  async function handleLogin() {
    if (isSubmitting.current || isLoading) {
      return;
    }

    setValidationError(null);
    clearError();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setValidationError("Please enter your email address and password.");
      return;
    }

    isSubmitting.current = true;

    try {
      await login({
        email: normalizedEmail,
        password,
      });

      router.replace("/(tabs)");
    } catch {
      // The authentication store provides the user-facing error message.
    } finally {
      isSubmitting.current = false;
    }
  }

  function continueAsGuest() {
    clearError();
    router.replace("/(tabs)");
  }

  const visibleError = validationError || authError;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: colors.primary },
              ]}
            >
              <Target size={36} color="#FFFFFF" strokeWidth={2.2} />
            </View>

            <Text style={[styles.appName, { color: colors.text }]}>
              GoalMate
            </Text>

            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Plan better. Work smarter. Achieve more.
            </Text>
          </View>

          <AppCard padding={Spacing.xl} radius={Radius.xl} style={styles.card}>
            <View style={styles.formHeader}>
              <Text style={[styles.title, { color: colors.text }]}>
                Welcome back
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  { color: colors.textSecondary },
                ]}
              >
                Log in to continue working toward your goals.
              </Text>
            </View>

            <AppInput
              label="Email address"
              placeholder="Enter your email"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setValidationError(null);
                clearError();
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              maxLength={254}
            />

            <AppInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setValidationError(null);
                clearError();
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              rightIcon={
                <Pressable
                  onPress={() => setShowPassword((current) => !current)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                  hitSlop={10}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </Pressable>
              }
            />

            {visibleError ? (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: colors.dangerLight },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {visibleError}
                </Text>
              </View>
            ) : null}

            <AppButton
              title="Log In"
              onPress={handleLogin}
              loading={isLoading}
              disabled={!email.trim() || !password}
              fullWidth
              size="large"
              style={styles.loginButton}
            />

            <View style={styles.registerRow}>
              <Text
                style={[
                  styles.registerPrompt,
                  { color: colors.textSecondary },
                ]}
              >
                Don't have an account?
              </Text>

              <Pressable
                onPress={() => router.push("/register")}
                accessibilityRole="link"
                disabled={isLoading}
              >
                <Text style={[styles.registerLink, { color: colors.primary }]}>
                  Create account
                </Text>
              </Pressable>
            </View>
          </AppCard>

          <View style={styles.guestSection}>
            <View
              style={[
                styles.separator,
                { backgroundColor: colors.border },
              ]}
            />

            <Text style={[styles.guestHint, { color: colors.textSecondary }]}>
              You can also continue without an account.
            </Text>

            <AppButton
              title="Continue as Guest"
              onPress={continueAsGuest}
              variant="outline"
              fullWidth
              disabled={isLoading}
              style={styles.guestButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing["3xl"],
  },

  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },

  logoContainer: {
    width: 68,
    height: 68,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },

  appName: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.extrabold,
  },

  tagline: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
    textAlign: "center",
  },

  card: {
    width: "100%",
    gap: Spacing.lg,
  },

  formHeader: {
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },

  title: {
    fontSize: Typography.fontSize["2xl"],
    fontWeight: Typography.fontWeight.bold,
  },

  subtitle: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.normal,
  },

  errorContainer: {
    padding: Spacing.md,
    borderRadius: Radius.md,
  },

  errorText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.normal,
  },

  loginButton: {
    marginTop: Spacing.xs,
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },

  registerPrompt: {
    fontSize: Typography.fontSize.sm,
  },

  registerLink: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  guestSection: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
    gap: Spacing.md,
  },

  separator: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    marginBottom: Spacing.xs,
  },

  guestHint: {
    fontSize: Typography.fontSize.sm,
    textAlign: "center",
  },

  guestButton: {
    maxWidth: 280,
  },
});
