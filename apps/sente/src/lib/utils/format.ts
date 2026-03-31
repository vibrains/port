/**
 * Number and currency formatting utilities for the Sente Dashboard
 * @module lib/utils/format
 */

/**
 * Options for formatting numbers
 */
export interface FormatNumberOptions {
  /** Number of decimal places (default: 0) */
  decimals?: number;
  /** Whether to use grouping separators (default: true) */
  useGrouping?: boolean;
  /** Locale for formatting (default: 'en-US') */
  locale?: string;
}

/**
 * Formats a number with commas and optional decimal places
 *
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 * formatNumber(1234.5678, { decimals: 2 }) // "1,234.57"
 */
export function formatNumber(
  value: number,
  options: FormatNumberOptions = {}
): string {
  const { decimals = 0, useGrouping = true, locale = "en-US" } = options;

  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping,
  }).format(value);
}

/**
 * Formats a number as a percentage
 *
 * @param value - The decimal value to format (e.g., 0.25 for 25%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercent(0.2567) // "25.7%"
 * formatPercent(0.2567, 2) // "25.67%"
 * formatPercent(1.5) // "150.0%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a number as USD currency
 *
 * @param value - The number to format
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1000000) // "$1,000,000.00"
 */
export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats large numbers in a compact format (K, M, B)
 *
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted compact number string
 *
 * @example
 * formatCompactNumber(1234) // "1.2K"
 * formatCompactNumber(1234567) // "1.2M"
 * formatCompactNumber(1234567890) // "1.2B"
 * formatCompactNumber(500) // "500"
 */
export function formatCompactNumber(
  value: number,
  decimals: number = 1
): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const absValue = Math.abs(value);

  if (absValue < 1000) {
    return formatNumber(value, { decimals: 0 });
  }

  const suffixes = [
    { threshold: 1e9, suffix: "B" },
    { threshold: 1e6, suffix: "M" },
    { threshold: 1e3, suffix: "K" },
  ];

  for (const { threshold, suffix } of suffixes) {
    if (absValue >= threshold) {
      const formatted = (value / threshold).toFixed(decimals);
      // Remove trailing zeros after decimal point
      const cleaned = formatted.replace(/\.?0+$/, "");
      return `${cleaned}${suffix}`;
    }
  }

  return formatNumber(value);
}

/**
 * Formats a rate value (like open rate, click rate) as a percentage
 * Handles both decimal (0.25) and already-percentage (25) formats
 *
 * @param value - The rate value
 * @param isDecimal - Whether the value is in decimal format (default: true)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 *
 * @example
 * formatRate(0.2567) // "25.67%"
 * formatRate(25.67, false) // "25.67%"
 */
export function formatRate(
  value: number,
  isDecimal: boolean = true,
  decimals: number = 2
): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const percentValue = isDecimal ? value * 100 : value;

  return `${percentValue.toFixed(decimals)}%`;
}

/**
 * Formats a number with a sign prefix (+ or -)
 *
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted number string with sign
 *
 * @example
 * formatWithSign(25.5) // "+25.5"
 * formatWithSign(-10.2) // "-10.2"
 * formatWithSign(0) // "0"
 */
export function formatWithSign(
  value: number,
  options: FormatNumberOptions = {}
): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const formatted = formatNumber(Math.abs(value), options);

  if (value > 0) {
    return `+${formatted}`;
  } else if (value < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

/**
 * Checks if a numeric metric value is meaningful (non-zero, non-null)
 *
 * @param value - The metric value to check
 * @returns True if the value is a positive number
 *
 * @example
 * hasMetricData(100) // true
 * hasMetricData(0) // false
 * hasMetricData(null) // false
 */
export function hasMetricData(value: number | null | undefined): boolean {
  return value != null && value > 0;
}

/**
 * Checks if any value in an array of metrics is meaningful
 *
 * @param values - Array of metric values to check
 * @returns True if at least one value is a positive number
 *
 * @example
 * hasAnyMetricData([0, 0, 100]) // true
 * hasAnyMetricData([0, null, undefined]) // false
 */
export function hasAnyMetricData(values: (number | null | undefined)[]): boolean {
  return values.some(hasMetricData);
}

/**
 * Formats a change value as a percentage with sign and color indicator
 *
 * @param value - The change value (decimal, e.g., 0.15 for 15%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Object with formatted string and trend direction
 *
 * @example
 * formatChange(0.15) // { formatted: "+15.0%", trend: "up" }
 * formatChange(-0.08) // { formatted: "-8.0%", trend: "down" }
 */
export function formatChange(
  value: number,
  decimals: number = 1
): { formatted: string; trend: "up" | "down" | "neutral" } {
  if (!Number.isFinite(value)) {
    return { formatted: "—", trend: "neutral" };
  }

  const percentValue = value * 100;
  const sign = percentValue > 0 ? "+" : "";
  const formatted = `${sign}${percentValue.toFixed(decimals)}%`;

  let trend: "up" | "down" | "neutral" = "neutral";
  if (percentValue > 0) {
    trend = "up";
  } else if (percentValue < 0) {
    trend = "down";
  }

  return { formatted, trend };
}
