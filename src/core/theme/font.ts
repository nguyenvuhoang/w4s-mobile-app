export const Fonts = {
  light: "Quicksand-Light",
  regular: "Quicksand-Regular",
  medium: "Quicksand-Medium",
  semiBold: "Quicksand-SemiBold",
  bold: "Quicksand-Bold",
} as const;

export type FontWeightType = keyof typeof Fonts;
