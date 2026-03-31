/**
 * Base parser infrastructure for the Sente Dashboard
 * Provides shared types, utilities, and helper functions for all CSV parsers
 * @module lib/parsers
 */

import Papa from "papaparse";

/**
 * Result of parsing a CSV file
 * @template T The type of data being parsed
 */
export interface ParseResult<T> {
  /** Parsed data records */
  data: T[];
  /** Errors encountered during parsing */
  errors: ParseError[];
  /** Total number of rows processed */
  rowCount: number;
  /** Number of valid records successfully parsed */
  validCount: number;
}

/**
 * Error encountered during CSV parsing
 */
export interface ParseError {
  /** Row number where the error occurred (1-based, including header) */
  row: number;
  /** Column name where the error occurred, if applicable */
  column?: string;
  /** Error message */
  message: string;
  /** The value that caused the error, if applicable */
  value?: string;
}

/**
 * Options passed to all parsers
 */
export interface ParserOptions {
  /** Client ID to associate with parsed records */
  clientId: string;
  /** Upload ID to track the source of the data */
  uploadId: string;
  /** Optional callback for progress updates (0-100) */
  onProgress?: (progress: number) => void;
}

/**
 * Parses a number from various input formats
 * Handles: strings with commas, percentages, currency symbols, "N/A", "-", empty strings
 * @param value - The value to parse
 * @returns The parsed number or null if invalid
 */
export function parseNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return isNaN(value) ? null : value;
  }

  const cleaned = value
    .toString()
    .replace(/[$,]/g, "") // Remove currency symbols and thousands separators
    .replace(/%/g, "") // Remove percentage symbol
    .trim();

  if (cleaned === "" || cleaned.toLowerCase() === "n/a" || cleaned === "-") {
    return null;
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parses a date from various string formats
 * Handles: ISO strings, MM/DD/YYYY, YYYY-MM-DD, and common variations
 * @param value - The date string to parse
 * @returns The parsed Date or null if invalid
 */
export function parseDate(value: string | undefined): Date | null {
  if (!value || value.trim() === "" || value.toLowerCase() === "n/a") {
    return null;
  }

  const trimmed = value.trim();

  // Try direct Date parsing first (handles ISO strings and many formats)
  const directParse = new Date(trimmed);
  if (!isNaN(directParse.getTime())) {
    return directParse;
  }

  // Try MM/DD/YYYY format
  const usDateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usDateMatch) {
    const month = parseInt(usDateMatch[1], 10) - 1;
    const day = parseInt(usDateMatch[2], 10);
    const year = parseInt(usDateMatch[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Try DD/MM/YYYY format (European)
  const euDateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (euDateMatch) {
    const day = parseInt(euDateMatch[1], 10);
    const month = parseInt(euDateMatch[2], 10) - 1;
    const year = parseInt(euDateMatch[3], 10);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

/**
 * Parses a percentage value from various formats
 * Handles: "50%", "0.5", "50", "N/A", "-"
 * Returns the percentage as a decimal (e.g., 0.5 for 50%)
 * @param value - The percentage string to parse
 * @returns The parsed percentage as a decimal or null if invalid
 */
export function parsePercent(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    // Assume already in decimal form if less than 1, otherwise convert
    if (value >= 0 && value <= 1) {
      return value;
    }
    if (value > 1 && value <= 100) {
      return value / 100;
    }
    return null;
  }

  const trimmed = value.toString().trim();

  if (trimmed === "" || trimmed.toLowerCase() === "n/a" || trimmed === "-") {
    return null;
  }

  // Check if it has a % symbol
  const hasPercent = trimmed.includes("%");
  const numericPart = trimmed.replace(/%/g, "").trim();
  const parsed = parseFloat(numericPart);

  if (isNaN(parsed)) {
    return null;
  }

  // If it had a % symbol, divide by 100 to get decimal form
  if (hasPercent) {
    return parsed / 100;
  }

  // Otherwise, assume it's already in the correct form
  // If it's greater than 1, it might be a whole percentage (e.g., 50 for 50%)
  if (parsed > 1) {
    return parsed / 100;
  }

  return parsed;
}

/**
 * Parses a currency value from various formats
 * Handles: "$1,234.56", "1234.56", "N/A", "-"
 * @param value - The currency string to parse
 * @returns The parsed currency value as a number or null if invalid
 */
export function parseCurrency(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return isNaN(value) ? null : value;
  }

  const cleaned = value
    .toString()
    .replace(/[$,]/g, "") // Remove $ and thousands separators
    .trim();

  if (cleaned === "" || cleaned.toLowerCase() === "n/a" || cleaned === "-") {
    return null;
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Cleans a string value by trimming whitespace and handling null/undefined
 * @param value - The string to clean
 * @returns The cleaned string or null if empty/invalid
 */
export function cleanString(value: string | undefined | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.toString().trim();

  if (trimmed === "" || trimmed.toLowerCase() === "n/a" || trimmed === "-") {
    return null;
  }

  return trimmed;
}

/**
 * Parses a delimited string into an array
 * Handles: comma-separated, pipe-separated, etc.
 * @param value - The delimited string
 * @param delimiter - The delimiter to use (default: ",")
 * @returns Array of trimmed, non-empty strings
 */
export function parseArray(value: string | undefined, delimiter = ","): string[] {
  if (!value || value.trim() === "") {
    return [];
  }

  return value
    .split(delimiter)
    .map((item) => item.trim())
    .filter((item) => item !== "" && item.toLowerCase() !== "n/a");
}

/**
 * Parses CSV content using PapaParse
 * @param csvContent - The raw CSV content
 * @returns Parsed rows as objects with headers as keys
 */
export function parseCSVToRecords(csvContent: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    comments: "#",
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  });

  return result.data;
}

/**
 * Gets the column headers from CSV content
 * @param csvContent - The raw CSV content
 * @returns Array of column header names
 */
export function getCSVHeaders(csvContent: string): string[] {
  const result = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    comments: "#",
    preview: 1,
  });

  return result.meta.fields || [];
}

/**
 * Validates that required columns exist in the CSV
 * @param headers - Array of column headers from the CSV
 * @param requiredColumns - Array of required column names
 * @returns Array of missing column names
 */
export function validateRequiredColumns(
  headers: string[],
  requiredColumns: string[]
): string[] {
  const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()));
  return requiredColumns.filter(
    (col) => !headerSet.has(col.toLowerCase().trim())
  );
}

/**
 * Creates a standardized error object
 * @param row - Row number where error occurred
 * @param message - Error message
 * @param column - Optional column name
 * @param value - Optional value that caused the error
 * @returns ParseError object
 */
export function createError(
  row: number,
  message: string,
  column?: string,
  value?: string
): ParseError {
  return {
    row,
    column,
    message,
    value,
  };
}

/**
 * Safely extracts a value from a CSV row object with fallback
 * @param row - The CSV row object
 * @param possibleKeys - Array of possible column names to try
 * @returns The value or undefined if not found
 */
export function getColumnValue(
  row: Record<string, string>,
  possibleKeys: string[]
): string | undefined {
  for (const key of possibleKeys) {
    // Try exact match first
    if (key in row && row[key] !== undefined && row[key] !== "") {
      return row[key];
    }

    // Try case-insensitive match
    const lowerKey = key.toLowerCase();
    for (const [rowKey, value] of Object.entries(row)) {
      if (rowKey.toLowerCase() === lowerKey && value !== undefined && value !== "") {
        return value;
      }
    }
  }

  return undefined;
}

/**
 * Normalizes a date range string into start and end dates
 * Handles: "January", "2026-01", "Jan 1 - Jan 31", etc.
 * @param periodStr - The period string to parse
 * @param year - The year to use if not specified in the string
 * @returns Object with period_start and period_end ISO strings, or nulls if unparsable
 */
export function parsePeriodRange(
  periodStr: string,
  year?: number
): { period_start: string | null; period_end: string | null } {
  if (!periodStr || periodStr.trim() === "") {
    return { period_start: null, period_end: null };
  }

  const currentYear = year || new Date().getFullYear();
  const trimmed = periodStr.trim().toLowerCase();

  // Handle month names (e.g., "January", "Jan")
  const monthNames = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];
  const monthAbbr = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec",
  ];

  const monthIndex = monthNames.indexOf(trimmed);
  const abbrIndex = monthAbbr.indexOf(trimmed);

  if (monthIndex !== -1 || abbrIndex !== -1) {
    const month = monthIndex !== -1 ? monthIndex : abbrIndex;
    const startDate = new Date(currentYear, month, 1);
    const endDate = new Date(currentYear, month + 1, 0); // Last day of month
    return {
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
    };
  }

  // Handle "Month YYYY" format (e.g., "January 2026", "Jan 2026")
  const monthYearMatch = trimmed.match(/^([a-z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const monthToken = monthYearMatch[1];
    const monthFromName = monthNames.indexOf(monthToken);
    const monthFromAbbr = monthAbbr.indexOf(monthToken);
    const month = monthFromName !== -1 ? monthFromName : monthFromAbbr;
    const y = parseInt(monthYearMatch[2], 10);

    if (month !== -1) {
      const startDate = new Date(y, month, 1);
      const endDate = new Date(y, month + 1, 0);
      return {
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString(),
      };
    }
  }

  // Handle YYYY-MM format
  const yearMonthMatch = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (yearMonthMatch) {
    const y = parseInt(yearMonthMatch[1], 10);
    const m = parseInt(yearMonthMatch[2], 10) - 1;
    const startDate = new Date(y, m, 1);
    const endDate = new Date(y, m + 1, 0);
    return {
      period_start: startDate.toISOString(),
      period_end: endDate.toISOString(),
    };
  }

  // Handle "Mon DD YYYY - Mon DD YYYY" range format (e.g. Klaviyo flows: "Jan 01 2026 - Jan 31 2026")
  const fullDateRangeMatch = trimmed.match(
    /^([a-z]{3,9})\s+(\d{1,2})\s+(\d{4})\s*-\s*([a-z]{3,9})\s+(\d{1,2})\s+(\d{4})$/
  );
  if (fullDateRangeMatch) {
    const startMonthToken = fullDateRangeMatch[1];
    const startDay = parseInt(fullDateRangeMatch[2], 10);
    const startYear = parseInt(fullDateRangeMatch[3], 10);
    const endMonthToken = fullDateRangeMatch[4];
    const endDay = parseInt(fullDateRangeMatch[5], 10);
    const endYear = parseInt(fullDateRangeMatch[6], 10);

    const startMonth =
      monthNames.indexOf(startMonthToken) !== -1
        ? monthNames.indexOf(startMonthToken)
        : monthAbbr.indexOf(startMonthToken);
    const endMonth =
      monthNames.indexOf(endMonthToken) !== -1
        ? monthNames.indexOf(endMonthToken)
        : monthAbbr.indexOf(endMonthToken);

    if (startMonth !== -1 && endMonth !== -1) {
      return {
        period_start: new Date(startYear, startMonth, startDay).toISOString(),
        period_end: new Date(endYear, endMonth, endDay).toISOString(),
      };
    }
  }

  // Handle "Mon d - Mon d, YYYY" range format
  const dateRangeMatch = trimmed.match(
    /^([a-z]{3,9})\s+(\d{1,2})\s*-\s*([a-z]{3,9})\s+(\d{1,2}),\s*(\d{4})$/
  );
  if (dateRangeMatch) {
    const startMonthToken = dateRangeMatch[1];
    const startDay = parseInt(dateRangeMatch[2], 10);
    const endMonthToken = dateRangeMatch[3];
    const endDay = parseInt(dateRangeMatch[4], 10);
    const rangeYear = parseInt(dateRangeMatch[5], 10);

    const startMonth =
      monthNames.indexOf(startMonthToken) !== -1
        ? monthNames.indexOf(startMonthToken)
        : monthAbbr.indexOf(startMonthToken);
    const endMonth =
      monthNames.indexOf(endMonthToken) !== -1
        ? monthNames.indexOf(endMonthToken)
        : monthAbbr.indexOf(endMonthToken);

    if (startMonth !== -1 && endMonth !== -1) {
      const startDate = new Date(rangeYear, startMonth, startDay);
      const endDate = new Date(rangeYear, endMonth, endDay);
      return {
        period_start: startDate.toISOString(),
        period_end: endDate.toISOString(),
      };
    }
  }

  return { period_start: null, period_end: null };
}

/**
 * Parses a date string treating its value as UTC (no timezone shift)
 * Use this for columns explicitly labeled as UTC in the source CSV
 * @param value - The UTC date string to parse
 * @returns The parsed Date (in UTC) or null if invalid
 */
export function parseDateAsUTC(value: string | undefined): Date | null {
  if (!value || value.trim() === "" || value.toLowerCase() === "n/a") {
    return null;
  }

  const trimmed = value.trim();

  // Already has explicit timezone — parse normally
  if (/[Zz]$/.test(trimmed) || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    return parseDate(trimmed);
  }

  // Date-only ISO "YYYY-MM-DD" — JS already treats this as UTC
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  // "YYYY-MM-DD HH:MM" or "YYYY-MM-DD HH:MM:SS" — append Z to force UTC
  const isoLikeMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (isoLikeMatch) {
    const hours = isoLikeMatch[2].padStart(2, "0");
    const d = new Date(`${isoLikeMatch[1]}T${hours}:${isoLikeMatch[3]}:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  // "YYYY-MM-DD H:MM AM/PM" or "YYYY-MM-DD HH:MM AM/PM"
  const ampmMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[2], 10);
    const minutes = parseInt(ampmMatch[3], 10);
    const period = ampmMatch[4].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;
    const d = new Date(
      `${ampmMatch[1]}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00Z`
    );
    return isNaN(d.getTime()) ? null : d;
  }

  // "M/D/YY H:MM", "M/D/YYYY H:MM", with optional AM/PM
  // e.g. "1/20/26 9:00" or "1/20/2026 09:00 AM"
  const slashDateTimeMatch = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?$/i
  );
  if (slashDateTimeMatch) {
    const month = parseInt(slashDateTimeMatch[1], 10) - 1;
    const day = parseInt(slashDateTimeMatch[2], 10);
    let year = parseInt(slashDateTimeMatch[3], 10);
    if (year < 100) year += 2000;
    let hours = parseInt(slashDateTimeMatch[4], 10);
    const minutes = parseInt(slashDateTimeMatch[5], 10);
    const period = slashDateTimeMatch[6]?.toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;
    const d = new Date(Date.UTC(year, month, day, hours, minutes, 0));
    return isNaN(d.getTime()) ? null : d;
  }

  // Unknown format — do not guess timezone, caller should use parseDate for non-UTC strings
  return null;
}

/**
 * Extracts day of week from a date string
 * @param dateValue - The date string or Date object
 * @returns Day of week name (e.g., "Monday") or null
 */
export function getDayOfWeek(dateValue: string | Date | null): string | null {
  if (!dateValue) {
    return null;
  }

  const date = typeof dateValue === "string" ? parseDate(dateValue) : dateValue;
  if (!date) {
    return null;
  }

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
}

/**
 * Converts a time string to ISO time format
 * Handles: "10:30 AM", "14:30", "2:30 PM", etc.
 * @param timeStr - The time string
 * @returns ISO time string (HH:MM:SS) or null
 */
export function parseTime(timeStr: string | undefined): string | null {
  if (!timeStr || timeStr.trim() === "") {
    return null;
  }

  const trimmed = timeStr.trim();

  // Handle 12-hour format with AM/PM
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const seconds = ampmMatch[3] ? parseInt(ampmMatch[3], 10) : 0;
    const period = ampmMatch[4].toUpperCase();

    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  // Handle 24-hour format
  const timeMatch = trimmed.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    return trimmed;
  }

  return null;
}
