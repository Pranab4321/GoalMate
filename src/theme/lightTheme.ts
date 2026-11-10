
import { Colors } from "./colors";

export const lightTheme = {
  mode: "light" as const,

  colors: Colors.light,

  background: Colors.light.background,
  surface: Colors.light.surface,
  primary: Colors.light.primary,
  text: Colors.light.text,
  textSecondary: Colors.light.textSecondary,
  border: Colors.light.border,

  isDark: false,
} as const;
