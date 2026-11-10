
import React, { ReactNode, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type {
  KeyboardTypeOptions,
  StyleProp,
  TextInputProps,
  TextStyle,
  ViewStyle,
} from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius, Typography } from "@/theme";

interface AppInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  maxLength?: number;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export default function AppInput({
  label,
  placeholder = "Enter text...",
  value,
  onChangeText,
  error,
  helperText,
  leftIcon,
  rightIcon,
  secureTextEntry = false,
  keyboardType = "default",
  multiline = false,
  numberOfLines = 1,
  editable = true,
  maxLength,
  autoCapitalize = "sentences",
  style,
  inputStyle,
}: AppInputProps) {
  const colors = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: error
              ? colors.danger
              : isFocused
                ? colors.primary
                : colors.border,
          },
          multiline && styles.multilineContainer,
          !editable && styles.disabled,
        ]}
      >
        {leftIcon ? (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          editable={editable}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={colors.primary}
          style={[
            styles.input,
            {
              color: colors.text,
              minHeight: multiline ? 100 : 48,
              textAlignVertical: multiline ? "top" : "center",
            },
            inputStyle,
          ]}
        />

        {rightIcon ? (
          <View style={styles.iconContainer}>
            {rightIcon}
          </View>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.message, { color: colors.danger }]}>
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[
            styles.message,
            { color: colors.textSecondary },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 7,
  },

  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  inputContainer: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
  },

  multilineContainer: {
    alignItems: "flex-start",
    paddingVertical: 10,
  },

  input: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    paddingVertical: 10,
  },

  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },

  message: {
    fontSize: Typography.fontSize.xs,
  },

  disabled: {
    opacity: 0.5,
  },
});
