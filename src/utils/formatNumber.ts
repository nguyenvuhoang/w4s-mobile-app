/**
 * Format a number as a percentage string with sign.
 * Example: 2.5 -> "+2.5%", -1.2 -> "-1.2%", 0 -> "+0.0%"
 * @param percent The percentage value
 * @returns Formatted string
 */
export const formatPercent = (percent: number): string => {
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
};
