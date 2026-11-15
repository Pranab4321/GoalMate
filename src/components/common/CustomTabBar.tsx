import React from "react";
import { useRouter, type Href } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ChartNoAxesCombined,
  House,
  ListTodo,
  Target,
  UserRound,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/hooks/use-theme";

// Keep these local types so this component does not need a direct
// @react-navigation/bottom-tabs dependency just for TypeScript types.
type TabRoute = {
  key: string;
  name: string;
};

type TabOptions = {
  // Expo Router may provide a string or a render function for tabBarLabel.
  // We display string labels and otherwise use the screen title.
  tabBarLabel?: unknown;
  title?: string;
  tabBarAccessibilityLabel?: string;
  tabBarButtonTestID?: string;
};

type CustomTabBarProps = {
  state: {
    index: number;
    routes: TabRoute[];
  };
  descriptors: Record<string, { options?: TabOptions }>;
};

const TAB_ICONS: Record<string, LucideIcon> = {
  index: House,
  goals: Target,
  tasks: ListTodo,
  analytics: ChartNoAxesCombined,
  profile: UserRound,
};

const TAB_LABELS: Record<string, string> = {
  index: "Home",
  goals: "Goals",
  tasks: "Tasks",
  analytics: "Analytics",
  profile: "Profile",
};

export default function CustomTabBar({
  state,
  descriptors,
}: CustomTabBarProps) {
  const router = useRouter();
  const colors = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const Icon = TAB_ICONS[route.name] ?? House;
        const options = descriptors[route.key]?.options;
        const label =
          typeof options?.tabBarLabel === "string"
            ? options.tabBarLabel
            : options?.title ?? TAB_LABELS[route.name] ?? route.name;

        const onPress = () => {
          if (isFocused) {
            return;
          }

          const destination =
            route.name === "index"
              ? ("/" as Href)
              : (`/(tabs)/${route.name}` as Href);

          router.navigate(destination);
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options?.tabBarAccessibilityLabel}
            testID={options?.tabBarButtonTestID}
            onPress={onPress}
            style={styles.tab}
          >
            <View
              style={[
                styles.iconContainer,
                isFocused && {
                  backgroundColor: colors.surfaceSecondary,
                },
              ]}
            >
              <Icon
                size={21}
                strokeWidth={isFocused ? 2.5 : 1.8}
                color={isFocused ? colors.primary : colors.textSecondary}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: isFocused ? colors.primary : colors.textSecondary,
                  fontWeight: isFocused ? "700" : "500",
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 8,
    paddingHorizontal: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 2,
  },
  iconContainer: {
    minWidth: 48,
    height: 30,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
});
