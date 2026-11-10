
import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import Svg, {
  Circle,
} from "react-native-svg";

import type { StyleProp, ViewStyle } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { Typography } from "@/theme";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export default function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color,
  backgroundColor,
  showPercentage = true,
  label,
  style,
}: ProgressRingProps) {
  const colors = useTheme();

  const safeProgress = Math.min(100, Math.max(0, progress || 0));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeColor = color ?? colors.primary;
  const trackColor = backgroundColor ?? colors.surfaceSecondary;

  const strokeDashoffset =
    circumference * (1 - safeProgress / 100);

  return (
    <View style={[styles.container, style]}>
      <View
        style={{
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>

        <View style={styles.centerContent}>
          {showPercentage && (
            <Text
              style={[
                styles.percentage,
                {
                  color: colors.text,
                  fontSize: size * 0.22,
                },
              ]}
            >
              {Math.round(safeProgress)}%
            </Text>
          )}

          {label && (
            <Text
              style={[
                styles.label,
                { color: colors.textSecondary },
              ]}
            >
              {label}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },

  centerContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },

  percentage: {
    fontWeight: Typography.fontWeight.bold,
  },

  label: {
    fontSize: Typography.fontSize.xs,
    marginTop: 3,
  },
});
