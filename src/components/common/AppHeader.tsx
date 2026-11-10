
import React, { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { StyleProp, ViewStyle } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { Spacing, Typography } from "@/theme";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function AppHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  showBorder = false,
  style,
}: AppHeaderProps) {
  const colors = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: showBorder ? 1 : 0,
        },
        style,
      ]}
    >
      {leftAction ? (
        <View style={styles.actionContainer}>
          {leftAction}
        </View>
      ) : null}

      <View style={styles.titleContainer}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: colors.text }]}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            numberOfLines={2}
            style={[
              styles.subtitle,
              { color: colors.textSecondary },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightAction ? (
        <View style={styles.actionContainer}>
          {rightAction}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },

  titleContainer: {
    flex: 1,
    justifyContent: "center",
  },

  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },

  subtitle: {
    fontSize: Typography.fontSize.sm,
    marginTop: 4,
    lineHeight: Typography.lineHeight.normal,
  },

  actionContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});
