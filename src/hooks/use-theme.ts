import { Colors } from "@/theme/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSettingsStore } from "@/store/settingsStore";

export function useTheme() {
  const systemScheme = useColorScheme();

  const themePreference = useSettingsStore(
    (state) => state.settings?.theme ?? "system"
  );

  const theme =
    themePreference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : themePreference;

  return Colors[theme];
}