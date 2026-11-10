
import React from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { StyleProp, ViewStyle } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius, Typography } from "@/theme";

type Difficulty = "easy" | "medium" | "hard";

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  style?: StyleProp<ViewStyle>;
}

export default function DifficultyBadge({
  difficulty,
  style,
}: DifficultyBadgeProps) {
  const colors = useTheme();

  const difficultyStyles = {
    easy: {
      background: colors.successLight,
      text: colors.success,
      label: "Easy",
    },
    medium: {
      background: colors.warningLight,
      text: colors.warning,
      label: "Medium",
    },
    hard: {
      background: colors.dangerLight,
      text: colors.danger,
      label: "Hard",
    },
  };

  const selectedStyle = difficultyStyles[difficulty];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: selectedStyle.background },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: selectedStyle.text },
        ]}
      >
        {selectedStyle.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },

  text: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
});
