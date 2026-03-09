/**
 * Utility to map server-provided icons or incompatible library icons
 * to valid FontAwesome6 icons used in the app.
 */

const iconMapping: Record<string, string> = {
  // Mapping for unsupported icons to valid FontAwesome6 icons
  "bag": "bag-shopping",
  "cash": "money-bill",
  "cart": "cart-shopping",
  "swap-horizontal": "arrow-right-arrow-left",
  "pricetag-outline": "tag",
  "wallet-outline": "wallet",
  "folder-outline": "folder",
  "receipt-outline": "receipt",
  "coffee": "mug-hot",
  "fast-food": "burger",
  "subway": "train-subway",
  "airplane": "plane",
  "car": "car",
  "home": "house",
  "add": "plus",
};

export const getValidIconName = (iconName: string | null | undefined, fallback: string = 'circle-question'): string => {
  if (!iconName) return fallback;
  
  // Return mapped icon if exists, otherwise assume the iconName is valid
  return iconMapping[iconName] || iconName;
};
