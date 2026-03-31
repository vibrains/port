/**
 * GA4 User Acquisition CSV Parser
 * Parses GA4 user acquisition reports into GA4AcquisitionInsert records
 * Handles the comment headers that GA4 CSV exports include
 * @module lib/parsers/ga4-acquisition
 */

import { GA4AcquisitionInsert } from "@/types/database";
import {
  ParseResult,
  ParserOptions,
  parseNumber,
  parsePercent,
  parseCurrency,
  cleanString,
  parseCSVToRecords,
  getColumnValue,
  createError,
} from "./index";

/**
 * Column mappings for GA4 acquisition CSV files
 * Maps normalized column names to possible variations in the CSV
 */
const COLUMN_MAPPINGS = {
  firstUserSource: ["First user source"],
  sessions: ["Sessions"],
  newUsers: ["New users"],
  engagedSessions: ["Engaged sessions"],
  engagementRate: ["Engagement rate"],
  engagedSessionsPerUser: ["Engaged sessions per active user"],
  avgEngagementTime: ["Average engagement time per active user"],
  eventCount: ["Event count"],
  keyEvents: ["Key events"],
  totalRevenue: ["Total revenue"],
  userKeyEventRate: ["User key event rate"],
  totalUsers: ["Total users"],
  returningUsers: ["Returning users"],
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
 * Parses a GA4 user acquisition CSV file
 * @param csvContent - The raw CSV content from the file
 * @param options - Parser options including clientId and uploadId
 * @returns ParseResult containing parsed GA4AcquisitionInsert records and any errors
 */
export function parseGA4Acquisition(
  csvContent: string,
  options: ParserOptions
): ParseResult<GA4AcquisitionInsert> {
  const errors: ParseResult<GA4AcquisitionInsert>["errors"] = [];
  const data: GA4AcquisitionInsert[] = [];

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
        const firstUserSource = getColumnValue(row, COLUMN_MAPPINGS.firstUserSource);

        // Skip rows with no source (likely summary or empty rows)
        if (!firstUserSource) {
          continue;
        }

        // Parse numeric fields
        const sessions = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.sessions));
        const newUsers = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.newUsers));
        const engagedSessions = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.engagedSessions));
        const engagementRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.engagementRate));
        // engagedSessionsPerUser is available in CSV but not stored in database schema
        void parseNumber(getColumnValue(row, COLUMN_MAPPINGS.engagedSessionsPerUser));
        const avgEngagementTime = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.avgEngagementTime));
        const eventCount = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.eventCount));
        const keyEvents = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.keyEvents));
        const totalRevenue = parseCurrency(getColumnValue(row, COLUMN_MAPPINGS.totalRevenue));
        const userKeyEventRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.userKeyEventRate));
        const totalUsers = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.totalUsers));
        const returningUsers = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.returningUsers));

        // Create the acquisition record
        const acquisition: GA4AcquisitionInsert = {
          client_id: options.clientId,
          upload_id: options.uploadId,
          period_start: periodStart,
          period_end: periodEnd,
          first_user_source: cleanString(firstUserSource),
          sessions: sessions || 0,
          new_users: newUsers || 0,
          total_users: totalUsers || 0,
          returning_users: returningUsers || 0,
          engaged_sessions: engagedSessions || 0,
          engagement_rate: engagementRate,
          avg_engagement_time: avgEngagementTime,
          event_count: eventCount || 0,
          key_events: keyEvents || 0,
          total_revenue: totalRevenue || 0,
          user_key_event_rate: userKeyEventRate,
        };

        data.push(acquisition);

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
 * Validates that a CSV file appears to be a GA4 acquisition export
 * Checks for required columns and GA4 comment headers
 * @param csvContent - The raw CSV content
 * @returns True if the file appears to be a valid GA4 acquisition export
 */
export function validateGA4AcquisitionCSV(csvContent: string): boolean {
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

    // Check for key GA4 acquisition columns
    const requiredColumns = ["first user source", "sessions"];
    const hasRequiredColumns = requiredColumns.every((col) =>
      headers.some((h) => h.includes(col))
    );

    // Check for GA4-specific acquisition metrics
    const hasGAMetrics =
      headers.some((h) => h.includes("new user")) &&
      headers.some((h) => h.includes("engagement"));

    return hasRequiredColumns && hasGAMetrics;
  } catch {
    return false;
  }
}
