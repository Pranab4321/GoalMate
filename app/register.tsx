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

export default function RegisterScreen() {
  const colors = useTheme();

  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const isSubmitting = useRef(false);

  async function handleRegister() {
    if (isSubmitting.current || isLoading) {
      return;
    }

    setValidationError(null);
    clearError();

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName || !normalizedEmail || !password || !confirmPassword) {
      setValidationError("Please complete all fields.");
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 80) {
      setValidationError("Name must be between 2 and 80 characters.");
      return;
    }

    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    isSubmitting.current = true;

    try {
      await register({
        name: trimmedName,
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
              <Target size={34} color="#FFFFFF" strokeWidth={2.2} />
            </View>

            <Text style={[styles.appName, { color: colors.text }]}>
              GoalMate
            </Text>

            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Start turning your goals into achievements.
            </Text>
          </View>

          <AppCard padding={Spacing.xl} radius={Radius.xl} style={styles.card}>
            <View style={styles.formHeader}>
              <Text style={[styles.title, { color: colors.text }]}>
                Create your account
              </Text>

              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Join GoalMate and organize your goals in one place.
              </Text>
            </View>

            <AppInput
              label="Full name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={(value) => {
                setName(value);
                setValidationError(null);
                clearError();
              }}
              maxLength={80}
              autoCapitalize="words"
            />

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
              placeholder="Create a password (at least 8 characters)"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setValidationError(null);
                clearError();
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              maxLength={72}
              helperText="Use at least 8 characters."
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

            <AppInput
              label="Confirm password"
              placeholder="Enter your password again"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setValidationError(null);
                clearError();
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              maxLength={72}
              rightIcon={
                <Pressable
                  onPress={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  hitSlop={10}
                >
                  {showConfirmPassword ? (
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
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              disabled={
                !name.trim() ||
                !email.trim() ||
                !password ||
                !confirmPassword
              }
              fullWidth
              size="large"
              style={styles.registerButton}
            />

            <View style={styles.loginRow}>
              <Text style={[styles.loginPrompt, { color: colors.textSecondary }]}>
                Already have an account?
              </Text>

              <Pressable
                onPress={() => router.push("/login")}
                accessibilityRole="link"
                disabled={isLoading}
              >
                <Text style={[styles.loginLink, { color: colors.primary }]}>
                  Log in
                </Text>
              </Pressable>
            </View>
          </AppCard>

          <Text style={[styles.footer, { color: colors.textSecondary }]}>
            Your goals and productivity data remain available in guest mode too.
          </Text>
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
    marginBottom: Spacing["2xl"],
  },

  logoContainer: {
    width: 64,
    height: 64,
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

  registerButton: {
    marginTop: Spacing.xs,
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },

  loginPrompt: {
    fontSize: Typography.fontSize.sm,
  },

  loginLink: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  footer: {
    fontSize: Typography.fontSize.xs,
    lineHeight: Typography.lineHeight.normal,
    textAlign: "center",
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
});
