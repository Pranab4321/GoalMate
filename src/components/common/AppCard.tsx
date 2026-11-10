
import React, { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import type {
  StyleProp,
  ViewStyle,
} from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { Radius } from "@/theme";

interface AppCardProps {
  children: ReactNode;
  padding?: number;
  radius?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function AppCard({
  children,
  padding = 16,
  radius = Radius.xl,
  onPress,
  style,
}: AppCardProps) {
  const colors = useTheme();

  const cardStyle: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius,
      padding,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  pressed: {
    opacity: 0.85,
  },
});
