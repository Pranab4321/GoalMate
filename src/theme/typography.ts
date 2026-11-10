
export const Typography = {
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },

  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  } as const,

  lineHeight: {
    tight: 20,
    normal: 24,
    relaxed: 30,
  },
} as const;
