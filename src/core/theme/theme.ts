export const Tokens = {
  colors: {
    main: {
      black: "#19191a",
      primary: "#0059df",
      white: "#ffffff",
      secondary: "#5ca2c1",
      neutral: "#a2aec1",
      onprimary: "#ffffff",
      bg_dark: "#0f172a",
      bg_light: "#EAECF1",
      textgray: "#9ca3af",
    },
    foundation: {
      primary: {
        "primary-1": "#e6eefc",
        "primary-2": "#c2d7f7",
        "primary-3": "#91b8f1",
        "primary-4": "#5e96eb",
        "primary-5": "#2e77e5",
        "primary-6": "#0059df",
        "primary-7": "#004cbe",
        "primary-8": "#003f9e",
        "primary-9": "#00337f",
        "primary-10": "#002864",
      },
      secondary: {
        "secondary-1": "#eff6f9",
        "secondary-2": "#d8e9f0",
        "secondary-3": "#b9d7e4",
        "secondary-4": "#98c4d8",
        "secondary-5": "#79b3cc",
        "secondary-6": "#5ca2c1",
        "secondary-7": "#4e8aa4",
        "secondary-8": "#417389",
        "secondary-9": "#345c6e",
        "secondary-10": "#294957",
      },
      neutral: {
        "neutral-1": "#ffffff",
        "neutral-2": "#ffffff",
        "neutral-3": "#fdfdfd",
        "neutral-4": "#fcfcfc",
        "neutral-5": "#f8f8f8",
        "neutral-6": "#f3f3f3",
        "neutral-7": "#e9e9ea",
        "neutral-8": "#dfe0e0",
        "neutral-9": "#dbdcdd",
        "neutral-10": "#d5d6d7",
        "neutral-11": "#d3d5d6",
        "neutral-12": "#d1d3d4",
        "neutral-13": "#cdcfd0",
      },
    },
  },
  gradients: {
    base: ["#0059df", "#5ca2c1"] as const, // gradian_base
    light: ["#c2d7f7", "#d8e9f0"] as const, // gradian_light
    lightest: ["#e6eefc", "#eff6f9"] as const, // gradian_lightest
    dark: ["#003f9e", "#417389"] as const, // gradian_dark
  },
};

export const Colors = {
  light: {
    text: Tokens.colors.main.bg_dark,
    background: Tokens.colors.main.bg_light,
    tint: Tokens.colors.main.primary,

    // UI Elements
    icon: Tokens.colors.main.textgray,
    tabIconDefault: Tokens.colors.main.textgray,
    tabIconSelected: Tokens.colors.main.primary,
    onprimary: Tokens.colors.main.onprimary,

    // Components
    card: Tokens.colors.main.white,
    border: Tokens.colors.foundation.neutral["neutral-8"],
    notification: Tokens.colors.main.secondary,

    gradianBase: Tokens.gradients.base,
    gradianLight: Tokens.gradients.light,
    gradianLightest: Tokens.gradients.lightest,
    gradianDark: Tokens.gradients.dark

  },
  dark: {
    text: Tokens.colors.main.white,
    background: Tokens.colors.main.bg_dark,
    tint: Tokens.colors.main.white,

    // UI Elements
    icon: Tokens.colors.main.textgray,
    tabIconDefault: Tokens.colors.main.textgray,
    tabIconSelected: Tokens.colors.main.white,
    onprimary: Tokens.colors.main.onprimary,

    // Components
    card: Tokens.colors.foundation.primary["primary-10"],
    border: Tokens.colors.foundation.primary["primary-9"],
    notification: Tokens.colors.foundation.secondary["secondary-8"],

    gradianBase: Tokens.gradients.base,
    gradianLight: Tokens.gradients.light,
    gradianLightest: Tokens.gradients.lightest,
    gradianDark: Tokens.gradients.dark
  },
};

export const Fonts = {
  family: {
    regular: "Quicksand-Regular",
    medium: "Quicksand-Medium",
    semiBold: "Quicksand-SemiBold",
    bold: "Quicksand-Bold",
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    heading: 32,
  },
  weight: {
    regular: "400",
    medium: "500",
    bold: "700",
  },
};
