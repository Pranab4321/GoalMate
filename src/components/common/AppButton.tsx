
import React, { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius, Typography } from "@/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "small" | "medium" | "large";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function AppButton({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}: AppButtonProps) {
  const colors = useTheme();

  const isDisabled = disabled || loading;

  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.surfaceSecondary,
      borderColor: colors.surfaceSecondary,
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
    danger: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
  };

  const textColors: Record<ButtonVariant, string> = {
    primary: "#FFFFFF",
    secondary: colors.text,
    outline: colors.primary,
    ghost: colors.primary,
    danger: "#FFFFFF",
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      minHeight: 36,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      minHeight: 46,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      minHeight: 54,
    },
  };

  const fontSizes: Record<ButtonSize, number> = {
    small: Typography.fontSize.sm,
    medium: Typography.fontSize.md,
    large: Typography.fontSize.lg,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColors[variant]} />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.icon}>{leftIcon}</View>}

          <Text
            style={[
              styles.text,
              {
                color: textColors[variant],
                fontSize: fontSizes[size],
              },
              textStyle,
            ]}
          >
            {title}
          </Text>

          {rightIcon && <View style={styles.icon}>{rightIcon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },

  fullWidth: {
    width: "100%",
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  text: {
    fontWeight: Typography.fontWeight.semibold,
    textAlign: "center",
  },

  icon: {
    alignItems: "center",
    justifyContent: "center",
  },

  disabled: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.8,
  },
});
