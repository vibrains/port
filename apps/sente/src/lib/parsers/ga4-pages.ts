/**
 * GA4 Page Performance CSV Parser
 * Parses GA4 page performance reports into GA4PageInsert records
 * Handles the comment headers that GA4 CSV exports include
 * @module lib/parsers/ga4-pages
 */

import { GA4PageInsert } from "@/types/database";
import {
  ParseResult,
  ParserOptions,
  parseNumber,
  parseCurrency,
  cleanString,
  parseCSVToRecords,
  getColumnValue,
  createError,
} from "./index";

/**
 * Column mappings for GA4 page performance CSV files
 * Maps normalized column names to possible variations in the CSV
 */
const COLUMN_MAPPINGS = {
  pagePath: ["Page path and screen class"],
  sessionSourceMedium: ["Session source / medium"],
  views: ["Views"],
  activeUsers: ["Active users"],
  viewsPerUser: ["Views per active user"],
  avgEngagementTime: ["Average engagement time per active user"],
  eventCount: ["Event count"],
  firstVisits: ["First visits"],
  keyEvents: ["Key events"],
  totalRevenue: ["Total revenue"],
};

/**
 * Extracts period information from GA4 CSV comments
 * GA4 exports include date range in comment headers
 * @param csvContent - The raw CSV content
 * @returns Object with period start and end dates or nulls
 */
function extractPeriodFromComments(csvContent: string): { periodStart: string | null; periodEnd: string | null } {
  const lines = csvContent.split("\n");
  let startDate: string | null = null;
  let endDate: string | null = null;

  for (const line of lines) {
    // Look for Start date and End date in comments
    const startMatch = line.match(/#\s*Start date:\s*(\d{8})/);
    const endMatch = line.match(/#\s*End date:\s*(\d{8})/);

    if (startMatch) {
      const year = startMatch[1].substring(0, 4);
      const month = startMatch[1].substring(4, 6);
      const day = startMatch[1].substring(6, 8);
      startDate = `${year}-${month}-${day}`;
    }

    if (endMatch) {
      const year = endMatch[1].substring(0, 4);
      const month = endMatch[1].substring(4, 6);
      const day = endMatch[1].substring(6, 8);
      endDate = `${year}-${month}-${day}`;
    }
  }

  return {
    periodStart: startDate,
    periodEnd: endDate,
  };
}

/**
 * Parses source/medium string into separate source and medium
 * @param sourceMedium - The source/medium string (e.g., "google / cpc")
 * @returns Object with source and medium
 */
function parseSourceMedium(sourceMedium: string | undefined): { source: string | null; medium: string | null } {
  if (!sourceMedium) {
    return { source: null, medium: null };
  }

  const parts = sourceMedium.split("/").map((p) => p.trim());
  return {
    source: parts[0] || null,
    medium: parts[1] || null,
  };
}

/**
 * Parses a GA4 page performance CSV file
 * @param csvContent - The raw CSV content from the file
 * @param options - Parser options including clientId and uploadId
 * @returns ParseResult containing parsed GA4PageInsert records and any errors
 */
export function parseGA4Pages(
  csvContent: string,
  options: ParserOptions
): ParseResult<GA4PageInsert> {
  const errors: ParseResult<GA4PageInsert>["errors"] = [];
  const data: GA4PageInsert[] = [];

  try {
    // Extract period from comments
    const { periodStart, periodEnd } = extractPeriodFromComments(csvContent);

    // Parse the CSV records
    const records = parseCSVToRecords(csvContent);
    const totalRows = records.length;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header

      try {
        // Extract values using column mappings
        const pagePath = getColumnValue(row, COLUMN_MAPPINGS.pagePath);
        const sessionSourceMedium = getColumnValue(row, COLUMN_MAPPINGS.sessionSourceMedium);

        // Parse source/medium
        const { source, medium } = parseSourceMedium(sessionSourceMedium);

        // Parse numeric fields
        const views = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.views));
        const activeUsers = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.activeUsers));
        const viewsPerUser = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.viewsPerUser));
        const avgEngagementTime = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.avgEngagementTime));
        const eventCount = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.eventCount));
        const firstVisits = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.firstVisits));
        const keyEvents = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.keyEvents));
        const totalRevenue = parseCurrency(getColumnValue(row, COLUMN_MAPPINGS.totalRevenue));

        // Skip rows with no page path (likely summary or empty rows)
        if (!pagePath) {
          continue;
        }

        // Create the page record
        const page: GA4PageInsert = {
          client_id: options.clientId,
          upload_id: options.uploadId,
          period_start: periodStart,
          period_end: periodEnd,
          page_path: cleanString(pagePath),
          page_title: null, // Not in this report type
          source_medium: cleanString(sessionSourceMedium),
          source: source,
          medium: medium,
          views: views || 0,
          active_users: activeUsers || 0,
          views_per_user: viewsPerUser,
          avg_engagement_time: avgEngagementTime,
          event_count: eventCount || 0,
          first_visits: firstVisits || 0,
          key_events: keyEvents || 0,
          total_revenue: totalRevenue || 0,
        };

        data.push(page);

        // Report progress
        if (options.onProgress) {
          options.onProgress(Math.round(((i + 1) / totalRows) * 100));
        }
      } catch (error) {
        errors.push(
          createError(
            rowNumber,
            `Error parsing row: ${error instanceof Error ? error.message : "Unknown error"}`
          )
        );
      }
    }
  } catch (error) {
    errors.push(
      createError(
        0,
        `Failed to parse CSV: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    );
  }

  return {
    data,
    errors,
    rowCount: data.length + errors.length,
    validCount: data.length,
  };
}

/**
 * Validates that a CSV file appears to be a GA4 pages export
 * Checks for required columns and GA4 comment headers
 * @param csvContent - The raw CSV content
 * @returns True if the file appears to be a valid GA4 pages export
 */
export function validateGA4PagesCSV(csvContent: string): boolean {
  try {
    // Check for GA4 comment headers
    if (!csvContent.includes("# ----------------------------------------")) {
      return false;
    }

    const records = parseCSVToRecords(csvContent);
    if (records.length === 0) {
      return false;
    }

    const firstRow = records[0];
    const headers = Object.keys(firstRow).map((h) => h.toLowerCase());

    // Check for key GA4 page columns
    const requiredColumns = ["page path", "views"];
    const hasRequiredColumns = requiredColumns.every((col) =>
      headers.some((h) => h.includes(col))
    );

    // Check for GA4-specific metrics
    const hasGAMetrics =
      headers.some((h) => h.includes("active user")) &&
      headers.some((h) => h.includes("engagement"));

    return hasRequiredColumns && hasGAMetrics;
  } catch {
    return false;
  }
}
