
import "../../global.css";
import { Platform } from "react-native";

import { Colors, ThemeColor } from "./colors";

export { Colors };
export type { ThemeColor };

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  android: {
    sans: "sans-serif",
    serif: "serif",
    rounded: "sans-serif-rounded",
    mono: "monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Arial",
    serif: "Georgia",
    rounded: "Arial",
    mono: "monospace",
  },
});

export { Spacing } from "./spacing";

export const BottomTabInset = Platform.select({
  ios: 50,
  android: 80,
}) ?? 0;

export const MaxContentWidth = 800;
