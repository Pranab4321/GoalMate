
import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { StyleProp, ViewStyle } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius, Typography } from "@/theme";

interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export default function ProgressBar({
  progress,
  height = 8,
  color,
  backgroundColor,
  showLabel = false,
  label,
  style,
}: ProgressBarProps) {
  const colors = useTheme();

  // Keep progress between 0 and 100.
  const safeProgress = Math.min(100, Math.max(0, progress || 0));

  const barColor = color ?? colors.primary;
  const trackColor = backgroundColor ?? colors.surfaceSecondary;

  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {label ?? "Progress"}
          </Text>

          <Text style={[styles.percentage, { color: colors.text }]}>
            {Math.round(safeProgress)}%
          </Text>
        </View>
      )}

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={label ?? "Progress"}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(safeProgress),
        }}
        style={[
          styles.track,
          {
            height,
            backgroundColor: trackColor,
            borderRadius: Radius.full,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${safeProgress}%`,
              height: "100%",
              backgroundColor: barColor,
              borderRadius: Radius.full,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 8,
  },

  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },

  percentage: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },

  track: {
    width: "100%",
    overflow: "hidden",
  },

  fill: {
    minWidth: 0,
  },
});
