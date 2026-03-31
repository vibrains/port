/**
 * useDateRange Hook
 * A custom hook for managing date range state with preset support
 * @module hooks/use-date-range
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { getDateRange } from "@/lib/utils/dates";
import type { DateRangePreset as DateRangePresetType } from "@/lib/utils/dates";

/**
 * Date range value type
 */
interface DateRangeValue {
  /** Start date of the range */
  from: Date;
  /** End date of the range */
  to: Date;
}

/**
 * Date range preset with label
 */
interface DateRangePreset {
  /** Display label for the preset */
  label: string;
  /** Date range value */
  value: DateRangeValue;
}

/**
 * Options for the useDateRange hook
 */
interface UseDateRangeOptions {
  /** Default preset to use on initialization */
  defaultPreset?: DateRangePresetType;
  /** Initial date range (overrides defaultPreset) */
  initialValue?: DateRangeValue;
  /** Callback when date range changes */
  onChange?: (range: DateRangeValue | undefined) => void;
}

/**
 * Return type for the useDateRange hook
 */
interface UseDateRangeReturn {
  /** Current date range value */
  dateRange: DateRangeValue | undefined;
  /** Set date range directly */
  setDateRange: (range: DateRangeValue | undefined) => void;
  /** Available presets */
  presets: DateRangePreset[];
  /** Apply a preset by its key */
  applyPreset: (presetKey: DateRangePresetType) => void;
  /** Get the currently active preset key, if any */
  activePreset: DateRangePresetType | undefined;
  /** Reset to default */
  reset: () => void;
  /** Whether a preset is currently active */
  hasActivePreset: boolean;
}

/**
 * Default presets configuration
 */
const DEFAULT_PRESETS: Record<DateRangePresetType, string> = {
  last7days: "Last 7 Days",
  last30days: "Last 30 Days",
  lastMonth: "Last Month",
  last3months: "Last 3 Months",
  lastYear: "Last Year",
};

/**
 * useDateRange hook provides state management for date range selection.
 * Includes preset support and automatic preset detection.
 *
 * @example
 * ```tsx
 * // Basic usage with default preset
 * const { dateRange, setDateRange, presets, applyPreset } = useDateRange({
 *   defaultPreset: "last30days",
 * });
 *
 * // With change callback
 * const { dateRange, setDateRange } = useDateRange({
 *   defaultPreset: "last7days",
 *   onChange: (range) => console.log("Range changed:", range),
 * });
 *
 * // Access presets for dropdown
 * <Select onValueChange={(value) => applyPreset(value as DateRangePresetType)}>
 *   {presets.map((preset) => (
 *     <SelectItem key={preset.label} value={preset.label}>
 *       {preset.label}
 *     </SelectItem>
 *   ))}
 * </Select>
 * ```
 */
export function useDateRange(
  options: UseDateRangeOptions = {}
): UseDateRangeReturn {
  const { defaultPreset, initialValue, onChange } = options;

  // Initialize state
  const getInitialValue = useCallback((): DateRangeValue | undefined => {
    if (initialValue) return initialValue;
    if (defaultPreset) {
      const { start, end } = getDateRange(defaultPreset);
      return { from: start, to: end };
    }
    return undefined;
  }, [initialValue, defaultPreset]);

  const [dateRange, setDateRangeState] = useState<DateRangeValue | undefined>(
    getInitialValue
  );

  // Wrap setDateRange to call onChange callback
  const setDateRange = useCallback(
    (range: DateRangeValue | undefined) => {
      setDateRangeState(range);
      onChange?.(range);
    },
    [onChange]
  );

  // Generate presets
  const presets = useMemo<DateRangePreset[]>(() => {
    return (Object.keys(DEFAULT_PRESETS) as DateRangePresetType[]).map(
      (key) => {
        const { start, end } = getDateRange(key);
        return {
          label: DEFAULT_PRESETS[key],
          value: { from: start, to: end },
        };
      }
    );
  }, []);

  // Apply a preset
  const applyPreset = useCallback(
    (presetKey: DateRangePresetType) => {
      const { start, end } = getDateRange(presetKey);
      const newRange = { from: start, to: end };
      setDateRange(newRange);
    },
    [setDateRange]
  );

  // Determine active preset
  const activePreset = useMemo<DateRangePresetType | undefined>(() => {
    if (!dateRange) return undefined;

    for (const key of Object.keys(DEFAULT_PRESETS) as DateRangePresetType[]) {
      const { start, end } = getDateRange(key);
      if (
        dateRange.from.getTime() === start.getTime() &&
        dateRange.to.getTime() === end.getTime()
      ) {
        return key;
      }
    }
    return undefined;
  }, [dateRange]);

  // Reset to default
  const reset = useCallback(() => {
    setDateRange(getInitialValue());
  }, [setDateRange, getInitialValue]);

  // Has active preset
  const hasActivePreset = activePreset !== undefined;

  return {
    dateRange,
    setDateRange,
    presets,
    applyPreset,
    activePreset,
    reset,
    hasActivePreset,
  };
}

export type {
  DateRangeValue,
  DateRangePreset,
  UseDateRangeOptions,
  UseDateRangeReturn,
};
