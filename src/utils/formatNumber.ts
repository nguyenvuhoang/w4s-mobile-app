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

/**
 * Format a converted currency amount based on currency ID.
 * VND is formatted as an integer with "vi-VN" locale.
 * Other currencies are formatted with 2 decimal places using "en-US" locale.
 */
export const formatConvertedAmount = (val: number, currencyId?: string): string => {
  if (!currencyId) return val.toString();
  if (currencyId === 'VND' || currencyId === 'VNĐ') {
    return Math.round(val).toLocaleString('vi-VN');
  }
  return val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Format an exchange rate.
 * VND is formatted as an integer with "vi-VN" locale.
 * Other currencies are formatted with up to 4 decimal places using "en-US" locale.
 */
export const formatExchangeRate = (rate: number, currencyId?: string): string => {
  if (!currencyId) return rate.toString();
  if (currencyId === 'VND' || currencyId === 'VNĐ') {
    return Math.round(rate).toLocaleString('vi-VN');
  }
  return rate.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
};
