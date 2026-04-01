const hexToRgb = (hex: string) => {
  hex = hex.replace("#", "");

  const bigint = parseInt(hex, 16);

  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

// Convert RGB -> HEX
const rgbToHex = (r: number, g: number, b: number) => {
  return (
    "#" +
    [r, g, b]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
  );
};

// Lighten màu (mặc định +20%)
export const lightenColor = (hex: string, percent: number = 20): string => {
  const { r, g, b } = hexToRgb(hex);

  const newR = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  const newG = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  const newB = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

  return rgbToHex(newR, newG, newB);
};

// Darken màu (tuỳ cần)
export const darkenColor = (hex: string, percent: number = 20): string => {
  const { r, g, b } = hexToRgb(hex);

  const newR = Math.max(0, Math.floor(r * (1 - percent / 100)));
  const newG = Math.max(0, Math.floor(g * (1 - percent / 100)));
  const newB = Math.max(0, Math.floor(b * (1 - percent / 100)));

  return rgbToHex(newR, newG, newB);
};

// Generate gradient 2 màu từ 1 màu
export const generateGradient = (
  hex: string,
  percent: number = 20
): [string, string] => {
  return [hex, lightenColor(hex, percent)];
};