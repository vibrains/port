/**
 * Date formatting and range utilities for the Sente Dashboard
 * @module lib/utils/dates
 */

import {
  format,
  subDays,
  subMonths,
  subYears,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
  isValid,
  differenceInDays,
} from "date-fns";

/**
 * Supported date format presets
 */
export type DateFormat =
  | "short" // Jan 15
  | "medium" // Jan 15, 2026
  | "long" // January 15, 2026
  | "iso" // 2026-01-15
  | "time" // 2:30 PM
  | "datetime" // Jan 15, 2026 2:30 PM
  | "monthYear"; // January 2026

/**
 * Supported date range presets
 */
export type DateRangePreset =
  | "last7days"
  | "last30days"
  | "lastMonth"
  | "last3months"
  | "lastYear";

/**
 * Date range object
 */
export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Format patterns for each date format type
 */
const FORMAT_PATTERNS: Record<DateFormat, string> = {
  short: "MMM d",
  medium: "MMM d, yyyy",
  long: "MMMM d, yyyy",
  iso: "yyyy-MM-dd",
  time: "h:mm a",
  datetime: "MMM d, yyyy h:mm a",
  monthYear: "MMMM yyyy",
};

/**
 * Formats a date according to the specified format
 *
 * @param date - The date to format (Date object, ISO string, or timestamp)
 * @param formatType - The format type to use (default: 'medium')
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date('2026-01-15')) // "Jan 15, 2026"
 * formatDate('2026-01-15', 'long') // "January 15, 2026"
 * formatDate(new Date(), 'iso') // "2026-01-15"
 */
export function formatDate(
  date: Date | string | number,
  formatType: DateFormat = "medium"
): string {
  const dateObj = normalizeDate(date);

  if (!dateObj || !isValid(dateObj)) {
    return "—";
  }

  return format(dateObj, FORMAT_PATTERNS[formatType]);
}

/**
 * Normalizes various date inputs to a Date object
 *
 * @param date - The date input to normalize
 * @returns Date object or null if invalid
 */
export function normalizeDate(date: Date | string | number): Date | null {
  if (!date) {
    return null;
  }

  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }

  if (typeof date === "string") {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  }

  if (typeof date === "number") {
    const fromTimestamp = new Date(date);
    return isValid(fromTimestamp) ? fromTimestamp : null;
  }

  return null;
}

/**
 * Gets a date range based on a preset
 *
 * @param preset - The date range preset
 * @returns DateRange object with start, end, and label
 *
 * @example
 * getDateRange('last7days') // { start: Date, end: Date, label: "Last 7 Days" }
 * getDateRange('lastMonth') // { start: Date, end: Date, label: "Last Month" }
 */
export function getDateRange(preset: DateRangePreset): DateRange {
  const now = new Date();
  const today = endOfDay(now);

  switch (preset) {
    case "last7days":
      return {
        start: startOfDay(subDays(now, 6)),
        end: today,
        label: "Last 7 Days",
      };

    case "last30days":
      return {
        start: startOfDay(subDays(now, 29)),
        end: today,
        label: "Last 30 Days",
      };

    case "lastMonth": {
      const lastMonth = subMonths(now, 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
        label: format(lastMonth, "MMMM yyyy"),
      };
    }

    case "last3months":
      return {
        start: startOfDay(subMonths(now, 3)),
        end: today,
        label: "Last 3 Months",
      };

    case "lastYear":
      return {
        start: startOfDay(subYears(now, 1)),
        end: today,
        label: "Last Year",
      };

    default:
      return {
        start: startOfDay(subDays(now, 29)),
        end: today,
        label: "Last 30 Days",
      };
  }
}

/**
 * Checks if a date is within a given range (inclusive)
 *
 * @param date - The date to check
 * @param start - The start of the range
 * @param end - The end of the range
 * @returns True if the date is within the range
 *
 * @example
 * isWithinRange(new Date('2026-01-15'), new Date('2026-01-01'), new Date('2026-01-31')) // true
 */
export function isWithinRange(
  date: Date | string | number,
  start: Date | string | number,
  end: Date | string | number
): boolean {
  const dateObj = normalizeDate(date);
  const startObj = normalizeDate(start);
  const endObj = normalizeDate(end);

  if (!dateObj || !startObj || !endObj) {
    return false;
  }

  return isWithinInterval(dateObj, { start: startObj, end: endObj });
}

/**
 * Gets all available date range presets with their labels
 *
 * @returns Array of preset options
 */
export function getDateRangePresets(): Array<{
  value: DateRangePreset;
  label: string;
}> {
  return [
    { value: "last7days", label: "Last 7 Days" },
    { value: "last30days", label: "Last 30 Days" },
    { value: "lastMonth", label: "Last Month" },
    { value: "last3months", label: "Last 3 Months" },
    { value: "lastYear", label: "Last Year" },
  ];
}

/**
 * Formats a date range as a human-readable string
 *
 * @param start - The start date
 * @param end - The end date
 * @returns Formatted date range string
 *
 * @example
 * formatDateRange(new Date('2026-01-01'), new Date('2026-01-31')) // "Jan 1 - Jan 31, 2026"
 */
export function formatDateRange(
  start: Date | string | number,
  end: Date | string | number
): string {
  const startObj = normalizeDate(start);
  const endObj = normalizeDate(end);

  if (!startObj || !endObj) {
    return "—";
  }

  const startYear = startObj.getFullYear();
  const endYear = endObj.getFullYear();

  if (startYear === endYear) {
    return `${format(startObj, "MMM d")} - ${format(endObj, "MMM d, yyyy")}`;
  }

  return `${format(startObj, "MMM d, yyyy")} - ${format(endObj, "MMM d, yyyy")}`;
}

/**
 * Gets the day of week name from a date
 *
 * @param date - The date
 * @returns Day of week name (e.g., "Monday")
 */
export function getDayOfWeek(date: Date | string | number): string {
  const dateObj = normalizeDate(date);

  if (!dateObj) {
    return "—";
  }

  return format(dateObj, "EEEE");
}

/**
 * Parses a date string in various formats
 *
 * @param dateString - The date string to parse
 * @returns Date object or null if invalid
 */
export function parseDate(dateString: string): Date | null {
  if (!dateString) {
    return null;
  }

  // Try ISO format first
  const isoDate = parseISO(dateString);
  if (isValid(isoDate)) {
    return isoDate;
  }

  // Try native Date parsing as fallback
  // Note: For more robust parsing, consider using date-fns parse function
  // with specific format strings in a full implementation
  try {
    const parsed = new Date(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  } catch {
    // Parsing failed
  }

  return null;
}

/**
 * Parsed date range parameters from URL search params
 */
export interface ParsedDateParams {
  dateRange: { start: Date; end: Date } | undefined;
  compare: boolean;
}

export interface ParsedRollupDateParams extends ParsedDateParams {
  month: string | undefined;
  isMonthMode: boolean;
}

function parseMonthKey(monthKey: string): { year: number; month: number } | null {
  const match = monthKey.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

export function getMonthDateRange(
  monthKey: string
): { start: Date; end: Date } | undefined {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) {
    return undefined;
  }

  return {
    start: new Date(Date.UTC(parsed.year, parsed.month - 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(parsed.year, parsed.month, 0, 23, 59, 59, 999)),
  };
}

export function getDefaultRollupMonth(): string {
  return format(subMonths(new Date(), 1), "yyyy-MM");
}

export function getPreviousMonth(monthKey: string): string | undefined {
  const parsed = parseMonthKey(monthKey);
  if (!parsed) {
    return undefined;
  }

  const previousMonth = parsed.month === 1 ? 12 : parsed.month - 1;
  const previousYear = parsed.month === 1 ? parsed.year - 1 : parsed.year;
  return `${String(previousYear)}-${String(previousMonth).padStart(2, "0")}`;
}

export function parseRollupDateParams(
  searchParams: Record<string, string | string[] | undefined>
): ParsedRollupDateParams {
  const compare = searchParams.compare === "true";
  const monthStr = typeof searchParams.month === "string" ? searchParams.month : undefined;

  if (monthStr) {
    const monthRange = getMonthDateRange(monthStr);
    if (monthRange) {
      return {
        dateRange: monthRange,
        compare,
        month: monthStr,
        isMonthMode: true,
      };
    }
  }

  const fallback = parseDateRangeParams(searchParams);
  if (fallback.dateRange) {
    return {
      dateRange: fallback.dateRange,
      compare: fallback.compare,
      month: undefined,
      isMonthMode: false,
    };
  }

  // No params present — return no filter so all data is shown
  return {
    dateRange: undefined,
    compare,
    month: undefined,
    isMonthMode: false,
  };
}

/**
 * Parses date range parameters from Next.js page searchParams.
 * Extracts `from`, `to`, and `compare` values and validates them.
 *
 * @param searchParams - Next.js page searchParams object
 * @returns Parsed and validated date range with compare flag
 */
export function parseDateRangeParams(
  searchParams: Record<string, string | string[] | undefined>
): ParsedDateParams {
  const fromStr = typeof searchParams.from === "string" ? searchParams.from : undefined;
  const toStr = typeof searchParams.to === "string" ? searchParams.to : undefined;
  const compareStr = typeof searchParams.compare === "string" ? searchParams.compare : undefined;

  const compare = compareStr === "true";

  if (!fromStr || !toStr) {
    return { dateRange: undefined, compare };
  }

  // Parse YYYY-MM-DD and build UTC dates directly.
  // This avoids local timezone shifts — e.g., startOfDay() in EST
  // produces 05:00:00Z via toISOString(), which excludes DB records
  // stored at 00:00:00Z.
  const fromParts = fromStr.split("-").map(Number);
  const toParts = toStr.split("-").map(Number);

  if (fromParts.length !== 3 || toParts.length !== 3) {
    return { dateRange: undefined, compare };
  }

  const start = new Date(Date.UTC(fromParts[0], fromParts[1] - 1, fromParts[2], 0, 0, 0, 0));
  const end = new Date(Date.UTC(toParts[0], toParts[1] - 1, toParts[2], 23, 59, 59, 999));

  if (!isValid(start) || !isValid(end)) {
    return { dateRange: undefined, compare };
  }

  return {
    dateRange: { start, end },
    compare,
  };
}

/**
 * Gets the previous period of the same duration ending the day before `start`.
 * For example, if the current range is Jan 15 - Jan 28 (14 days),
 * the previous period would be Jan 1 - Jan 14.
 *
 * @param start - Start of the current period
 * @param end - End of the current period
 * @returns Previous period with the same number of days
 */
export function getPreviousPeriod(
  start: Date,
  end: Date
): { start: Date; end: Date } {
  const days = differenceInDays(end, start) + 1;
  const prevEndMs = start.getTime() - 1; // 1ms before current start
  const prevStartMs = start.getTime() - (days * 24 * 60 * 60 * 1000);

  return {
    start: new Date(prevStartMs),
    end: new Date(prevEndMs),
  };
}
