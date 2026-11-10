
import { Colors } from "./colors";

export const darkTheme = {
  mode: "dark" as const,

  colors: Colors.dark,

  background: Colors.dark.background,
  surface: Colors.dark.surface,
  primary: Colors.dark.primary,
  text: Colors.dark.text,
  textSecondary: Colors.dark.textSecondary,
  border: Colors.dark.border,

  isDark: true,
} as const;
