
import React, { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { StyleProp, ViewStyle } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { Spacing, Typography } from "@/theme";

import AppButton from "./AppButton";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const colors = useTheme();

  return (
    <View style={[styles.container, style]}>
      {icon ? (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          {icon}
        </View>
      ) : null}

      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>

      {description ? (
        <Text
          style={[
            styles.description,
            { color: colors.textSecondary },
          ]}
        >
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <View style={styles.buttonContainer}>
          <AppButton
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="medium"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
    gap: Spacing.md,
  },

  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },

  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
  },

  description: {
    fontSize: Typography.fontSize.md,
    lineHeight: Typography.lineHeight.normal,
    textAlign: "center",
    maxWidth: 280,
  },

  buttonContainer: {
    marginTop: Spacing.md,
    minWidth: 160,
  },
});
