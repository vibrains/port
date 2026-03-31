/**
 * Period comparison utilities for computing KPI trend data
 * @module lib/utils/comparison
 */

interface TrendResult {
  value: number;
  direction: "up" | "down" | "neutral";
  label: string;
}

/**
 * Computes the percentage change between current and previous period values.
 * Returns a trend object compatible with the KPICard `trend` prop.
 *
 * @param current - The current period value
 * @param previous - The previous period value
 * @returns Trend object with value (absolute %), direction, and label
 */
export function computeChange(current: number, previous: number): TrendResult {
  if (previous === 0) {
    if (current === 0) {
      return { value: 0, direction: "neutral", label: "vs prev. period" };
    }
    return { value: 100, direction: "up", label: "vs prev. period" };
  }

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change * 10) / 10;

  let direction: "up" | "down" | "neutral" = "neutral";
  if (rounded > 0) direction = "up";
  else if (rounded < 0) direction = "down";

  return {
    value: Math.abs(rounded),
    direction,
    label: "vs prev. period",
  };
}
