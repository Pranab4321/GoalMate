
export const Colors = {
  light: {
    background: "#F6F4FC",
    surface: "#FFFFFF",
    surfaceSecondary: "#F0ECFA",

    // Expo starter compatibility
    backgroundElement: "#F0ECFA",
    backgroundSelected: "#E5DDF5",

    primary: "#7C3AED",
    primaryLight: "#A78BFA",
    primaryDark: "#5B21B6",

    secondary: "#06B6D4",

    text: "#211B38",
    textSecondary: "#716B82",
    textMuted: "#A39DB2",

    border: "#E8E3F1",

    success: "#059669",
    successLight: "#D1FAE5",

    warning: "#D97706",
    warningLight: "#FEF3C7",

    danger: "#E11D48",
    dangerLight: "#FFE4E6",

    card: "#FFFFFF",
    overlay: "rgba(0,0,0,0.4)",
  },

  dark: {
    background: "#151526",
    surface: "#202039",
    surfaceSecondary: "#292943",

    // Expo starter compatibility
    backgroundElement: "#212225",
    backgroundSelected: "#35354F",

    primary: "#8B5CF6",
    primaryLight: "#A78BFA",
    primaryDark: "#6D28D9",

    secondary: "#22D3EE",

    text: "#FFFFFF",
    textSecondary: "#B8B5CA",
    textMuted: "#858198",

    border: "#35354F",

    success: "#24D6A0",
    successLight: "#153D35",

    warning: "#FFC857",
    warningLight: "#49391D",

    danger: "#FF647C",
    dangerLight: "#49232E",

    card: "#202039",
    overlay: "rgba(0,0,0,0.65)",
  },
} as const;

export type ThemeMode = "light" | "dark";

export type ThemeColors = typeof Colors.light;

export type ThemeColor = keyof typeof Colors.light &
  keyof typeof Colors.dark;
