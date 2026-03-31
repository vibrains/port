/**
 * Pardot Automation Flow CSV Parser
 * Parses Pardot automation flow report CSV files into PardotFlowInsert records
 * @module lib/parsers/pardot-flows
 */

import { PardotFlowInsert } from "@/types/database";
import {
  ParseResult,
  ParserOptions,
  parseNumber,
  parsePercent,
  cleanString,
  parseCSVToRecords,
  getColumnValue,
  createError,
} from "./index";

/**
 * Extracts the data table portion from a Pardot flow CSV
 * Pardot flow CSVs have a summary table above the actual step-level data.
 * This finds the real header row (starting with "Step Type") and returns
 * only the data table portion.
 * @param csvContent - The raw CSV content
 * @returns The CSV content starting from the data table header
 */
function extractDataTable(csvContent: string): string {
  const lines = csvContent.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].replace(/^["']/, "");
    if (trimmed.startsWith("Step Type")) {
      return lines.slice(i).join("\n");
    }
  }
  return csvContent;
}

/**
 * Column mappings for Pardot flow CSV files
 * Maps normalized column names to possible variations in the CSV
 */
const COLUMN_MAPPINGS = {
  stepType: ["Step Type"],
  stepName: ["Step Name"],
  assetName: ["Asset Name"],
  sent: ["Sent"],
  skipped: ["Skipped"],
  delivered: ["Delivered"],
  deliveryRate: ["Delivery Rate"],
  uniqueOpens: ["Unique Opens"],
  openRate: ["Open Rate"],
  uniqueClicks: ["Unique Clicks"],
  ctr: ["CTR"],
  clickToOpenRate: ["Click to Open Rate"],
  optOuts: ["Opt-Outs"],
  optOutRate: ["Opt-Out Rate"],
  totalBounces: ["Total Bounces"],
  bounceRate: ["Bounce Rate"],
  formsCompleted: ["Forms Completed"],
  formHandlersCompleted: ["Form Handlers Completed"],
  landingPagesCompleted: ["Landing Pages Completed"],
  customRedirectsClicked: ["Custom Redirects Clicked"],
  filesDownloaded: ["Files Downloaded"],
};

/**
 * Extracts the program name from the CSV content
 * Pardot flow CSVs have the program name in the first few rows
 * @param csvContent - The raw CSV content
 * @returns The program name or null if not found
 */
function extractProgramName(csvContent: string): string | null {
  const lines = csvContent.split("\n");

  // Look for "Program Summary" row and extract program name from next row
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (line.includes("Program Summary")) {
      // The program name is typically in the next row, first column
      const nextLine = lines[i + 1];
      if (nextLine) {
        // Handle quoted CSV values (e.g., "Program Name",759,0,"0.00%")
        const match = nextLine.match(/^"([^"]+)"/);
        if (match) {
          return cleanString(match[1]);
        }
        const parts = nextLine.split(",");
        if (parts.length > 0) {
          return cleanString(parts[0]);
        }
      }
    }
  }

  return null;
}

/**
 * Parses a Pardot automation flow CSV file
 * @param csvContent - The raw CSV content from the file
 * @param options - Parser options including clientId and uploadId
 * @returns ParseResult containing parsed PardotFlowInsert records and any errors
 */
export function parsePardotFlows(
  csvContent: string,
  options: ParserOptions
): ParseResult<PardotFlowInsert> {
  const errors: ParseResult<PardotFlowInsert>["errors"] = [];
  const data: PardotFlowInsert[] = [];

  try {
    // Extract program name from header rows
    const programName = extractProgramName(csvContent);

    // Extract the data table (skip summary rows at the top)
    const dataTableCSV = extractDataTable(csvContent);
    const records = parseCSVToRecords(dataTableCSV);
    const totalRows = records.length;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header (after summary)

      try {
        // Skip summary rows (rows with empty step type but summary data)
        const stepType = getColumnValue(row, COLUMN_MAPPINGS.stepType);
        const stepName = getColumnValue(row, COLUMN_MAPPINGS.stepName);
        
        // Skip if this is a summary row or empty row
        if (!stepType && !stepName) {
          continue;
        }

        // Extract values using column mappings
        const assetName = getColumnValue(row, COLUMN_MAPPINGS.assetName);

        // Parse numeric fields
        const sent = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.sent));
        const skipped = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.skipped));
        const delivered = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.delivered));
        const deliveryRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.deliveryRate));
        const uniqueOpens = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.uniqueOpens));
        const openRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.openRate));
        const uniqueClicks = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.uniqueClicks));
        const ctr = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.ctr));
        const clickToOpenRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.clickToOpenRate));
        const optOuts = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.optOuts));
        const optOutRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.optOutRate));
        const totalBounces = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.totalBounces));
        const bounceRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.bounceRate));

        // Create the flow record
        const flow: PardotFlowInsert = {
          client_id: options.clientId,
          upload_id: options.uploadId,
          program_name: programName,
          step_type: cleanString(stepType),
          step_name: cleanString(stepName),
          asset_name: cleanString(assetName),
          sent: sent || 0,
          skipped: skipped || 0,
          delivered: delivered || 0,
          delivery_rate: deliveryRate,
          unique_opens: uniqueOpens || 0,
          open_rate: openRate,
          unique_clicks: uniqueClicks || 0,
          click_rate: ctr,
          click_to_open_rate: clickToOpenRate,
          opt_outs: optOuts || 0,
          opt_out_rate: optOutRate,
          bounces: totalBounces || 0,
          bounce_rate: bounceRate,
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
 * Validates that a CSV file appears to be a Pardot flows export
 * Checks for required columns
 * @param csvContent - The raw CSV content
 * @returns True if the file appears to be a valid Pardot flows export
 */
export function validatePardotFlowsCSV(csvContent: string): boolean {
  try {
    // Check for "Program Summary" header which is unique to Pardot flow reports
    if (!csvContent.includes("Program Summary")) {
      return false;
    }

    const dataTableCSV = extractDataTable(csvContent);
    const records = parseCSVToRecords(dataTableCSV);
    if (records.length === 0) {
      return false;
    }

    const firstRow = records[0];
    const headers = Object.keys(firstRow).map((h) => h.toLowerCase());

    // Check for key Pardot flow columns
    const requiredColumns = ["step type", "step name"];
    const hasRequiredColumns = requiredColumns.every((col) =>
      headers.some((h) => h.includes(col))
    );

    // Check for Pardot-specific flow metrics
    const hasFlowMetrics =
      headers.some((h) => h.includes("opt-outs") || h.includes("opt out"));

    return hasRequiredColumns && hasFlowMetrics;
  } catch {
    return false;
  }
}
