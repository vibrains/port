/**
 * Klaviyo Flow Performance CSV Parser
 * Parses Klaviyo flow performance report CSV files into KlaviyoFlowInsert records
 * @module lib/parsers/klaviyo-flows
 */

import { KlaviyoFlowInsert } from "@/types/database";
import {
  ParseResult,
  ParserOptions,
  parseNumber,
  parsePercent,
  cleanString,
  parseArray,
  parseCSVToRecords,
  getColumnValue,
  createError,
  parsePeriodRange,
} from "./index";

/**
 * Column mappings for Klaviyo flow CSV files
 * Maps normalized column names to possible variations in the CSV
 */
const COLUMN_MAPPINGS = {
  flowId: ["Flow ID"],
  flowName: ["Flow Name"],
  date: ["Date"],
  messageChannel: ["Message Channel"],
  status: ["Status"],
  totalRecipients: ["Total Recipients"],
  openRate: ["Open Rate"],
  clickRate: ["Click Rate"],
  unsubscribeRate: ["Unsubscribe Rate"],
  bounceRate: ["Bounce Rate"],
  spamComplaintsRate: ["Spam Complaints Rate"],
  smsFailedDeliveryRate: ["SMS Failed Delivery Rate"],
  totalPlacedOrder: ["Total Placed Order"],
  totalPlacedOrderValue: ["Total Placed Order Value"],
  tags: ["Tags"],
};

/**
 * Parses a Klaviyo flow performance CSV file
 * @param csvContent - The raw CSV content from the file
 * @param options - Parser options including clientId and uploadId
 * @returns ParseResult containing parsed KlaviyoFlowInsert records and any errors
 */
export function parseKlaviyoFlows(
  csvContent: string,
  options: ParserOptions
): ParseResult<KlaviyoFlowInsert> {
  const errors: ParseResult<KlaviyoFlowInsert>["errors"] = [];
  const data: KlaviyoFlowInsert[] = [];

  try {
    const records = parseCSVToRecords(csvContent);
    const totalRows = records.length;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header

      try {
        // Extract values using column mappings
        const flowId = getColumnValue(row, COLUMN_MAPPINGS.flowId);
        const flowName = getColumnValue(row, COLUMN_MAPPINGS.flowName);
        const dateStr = getColumnValue(row, COLUMN_MAPPINGS.date);
        const messageChannel = getColumnValue(row, COLUMN_MAPPINGS.messageChannel);
        const status = getColumnValue(row, COLUMN_MAPPINGS.status);

        // Parse numeric fields
        const totalRecipients = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.totalRecipients));
        const openRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.openRate));
        const clickRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.clickRate));
        const unsubscribeRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.unsubscribeRate));
        const bounceRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.bounceRate));
        const spamRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.spamComplaintsRate));
        const smsFailedRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.smsFailedDeliveryRate));
        const totalPlacedOrder = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.totalPlacedOrder));
        const totalPlacedOrderValue = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.totalPlacedOrderValue));

        // Parse tags
        const tagsValue = getColumnValue(row, COLUMN_MAPPINGS.tags);
        const tags = tagsValue && tagsValue !== "N/A" ? parseArray(tagsValue) : [];

        // Parse period from date column
        let period: string | null = null;
        let periodStart: string | null = null;
        let periodEnd: string | null = null;

        if (dateStr) {
          period = cleanString(dateStr);
          const periodRange = parsePeriodRange(dateStr);
          periodStart = periodRange.period_start;
          periodEnd = periodRange.period_end;
        }

        // Create the flow record
        const flow: KlaviyoFlowInsert = {
          client_id: options.clientId,
          upload_id: options.uploadId,
          flow_id: cleanString(flowId),
          flow_name: cleanString(flowName),
          period: period,
          period_start: periodStart,
          period_end: periodEnd,
          channel: cleanString(messageChannel),
          status: cleanString(status),
          total_recipients: totalRecipients || 0,
          open_rate: openRate,
          click_rate: clickRate,
          unsubscribe_rate: unsubscribeRate,
          bounce_rate: bounceRate,
          spam_rate: spamRate,
          sms_failed_rate: smsFailedRate,
          total_placed_order: totalPlacedOrder || 0,
          placed_order_rate: null, // Not in the CSV
          revenue: totalPlacedOrderValue ?? null,
          tags: tags.length > 0 ? tags : null,
        };

        data.push(flow);

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
 * Validates that a CSV file appears to be a Klaviyo flows export
 * Checks for required columns
 * @param csvContent - The raw CSV content
 * @returns True if the file appears to be a valid Klaviyo flows export
 */
export function validateKlaviyoFlowsCSV(csvContent: string): boolean {
  try {
    const records = parseCSVToRecords(csvContent);
    if (records.length === 0) {
      return false;
    }

    const firstRow = records[0];
    const headers = Object.keys(firstRow).map((h) => h.toLowerCase());

    // Check for key Klaviyo flow columns
    const requiredColumns = ["flow id", "flow name"];
    const hasRequiredColumns = requiredColumns.every((col) =>
      headers.some((h) => h.includes(col))
    );

    // Check for flow-specific metrics
    const hasFlowMetrics =
      headers.some((h) => h.includes("recipient")) &&
      headers.some((h) => h.includes("channel"));

    return hasRequiredColumns && hasFlowMetrics;
  } catch {
    return false;
  }
}
