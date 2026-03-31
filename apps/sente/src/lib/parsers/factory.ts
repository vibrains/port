/**
 * Parser Factory
 * Routes CSV content to the appropriate parser based on data source type
 * Also provides data source detection from filenames
 * @module lib/parsers/factory
 */

import { ParseResult, ParserOptions } from "./index";
import { parseKlaviyoCampaigns, validateKlaviyoCampaignsCSV } from "./klaviyo-campaigns";
import { parseKlaviyoFlows, validateKlaviyoFlowsCSV } from "./klaviyo-flows";
import { parsePardotCampaigns, validatePardotCampaignsCSV } from "./pardot-campaigns";
import { parsePardotFlows, validatePardotFlowsCSV } from "./pardot-flows";
import { parseGA4Pages, validateGA4PagesCSV } from "./ga4-pages";
import { parseGA4Acquisition, validateGA4AcquisitionCSV } from "./ga4-acquisition";
import { parseSproutSocial, validateSproutSocialCSV } from "./sprout-social";

/**
 * Supported data source types for CSV parsing
 */
export type DataSource =
  | "klaviyo-campaigns"
  | "klaviyo-flows"
  | "pardot-campaigns"
  | "pardot-flows"
  | "ga4-pages"
  | "ga4-acquisition"
  | "sprout-social";

/**
 * Maps DataSource to the corresponding DataSourceType in the database
 */
export const DATA_SOURCE_TO_DB_TYPE: Record<DataSource, string> = {
  "klaviyo-campaigns": "klaviyo_campaigns",
  "klaviyo-flows": "klaviyo_flows",
  "pardot-campaigns": "pardot_campaigns",
  "pardot-flows": "pardot_flows",
  "ga4-pages": "ga4_pages",
  "ga4-acquisition": "ga4_acquisition",
  "sprout-social": "sprout_social",
};

/**
 * Maps database DataSourceType to DataSource
 */
export const DB_TYPE_TO_DATA_SOURCE: Record<string, DataSource> = {
  "klaviyo_campaigns": "klaviyo-campaigns",
  "klaviyo_flows": "klaviyo-flows",
  "pardot_campaigns": "pardot-campaigns",
  "pardot_flows": "pardot-flows",
  "ga4_pages": "ga4-pages",
  "ga4_acquisition": "ga4-acquisition",
  "sprout_social": "sprout-social",
};

/**
 * Human-readable labels for data sources
 */
export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  "klaviyo-campaigns": "Klaviyo Email Campaigns",
  "klaviyo-flows": "Klaviyo Flows",
  "pardot-campaigns": "Pardot Email Campaigns",
  "pardot-flows": "Pardot Automation Flows",
  "ga4-pages": "GA4 Page Performance",
  "ga4-acquisition": "GA4 User Acquisition",
  "sprout-social": "Sprout Social Posts",
};

/**
 * File extension patterns for each data source
 */
const DATA_SOURCE_FILE_PATTERNS: Record<DataSource, RegExp[]> = {
  "klaviyo-campaigns": [/klaviyo.*email/i, /klaviyo.*campaign/i, /email.*export/i],
  "klaviyo-flows": [/klaviyo.*flow/i, /flow.*performance/i],
  "pardot-campaigns": [/pardot.*email/i, /pardot.*campaign/i, /email.*engagement/i],
  "pardot-flows": [/pardot.*flow/i, /pardot.*reengagement/i, /automation/i],
  "ga4-pages": [/ga4.*page/i, /pages.*screens/i, /page.*path/i],
  "ga4-acquisition": [/ga4.*acquisition/i, /user.*acquisition/i, /first.*user/i],
  "sprout-social": [/sprout/i, /post.*performance/i, /social.*post/i],
};

/**
 * Parses CSV content using the appropriate parser for the specified data source
 * @param sourceType - The type of data source
 * @param csvContent - The raw CSV content
 * @param options - Parser options
 * @returns ParseResult with parsed data and errors
 * @throws Error if the data source type is not supported
 */
export function parseCSV(
  sourceType: DataSource,
  csvContent: string,
  options: ParserOptions
): ParseResult<unknown> {
  switch (sourceType) {
    case "klaviyo-campaigns":
      return parseKlaviyoCampaigns(csvContent, options) as ParseResult<unknown>;
    case "klaviyo-flows":
      return parseKlaviyoFlows(csvContent, options) as ParseResult<unknown>;
    case "pardot-campaigns":
      return parsePardotCampaigns(csvContent, options) as ParseResult<unknown>;
    case "pardot-flows":
      return parsePardotFlows(csvContent, options) as ParseResult<unknown>;
    case "ga4-pages":
      return parseGA4Pages(csvContent, options) as ParseResult<unknown>;
    case "ga4-acquisition":
      return parseGA4Acquisition(csvContent, options) as ParseResult<unknown>;
    case "sprout-social":
      return parseSproutSocial(csvContent, options) as ParseResult<unknown>;
    default:
      throw new Error(`Unsupported data source type: ${sourceType}`);
  }
}

/**
 * Attempts to detect the data source type from a filename
 * Uses pattern matching based on common naming conventions
 * @param filename - The name of the file
 * @returns The detected DataSource or null if unable to determine
 */
export function detectDataSource(filename: string): DataSource | null {
  if (!filename) {
    return null;
  }

  const normalizedFilename = filename.toLowerCase();

  for (const [sourceType, patterns] of Object.entries(DATA_SOURCE_FILE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedFilename)) {
        return sourceType as DataSource;
      }
    }
  }

  return null;
}

/**
 * Attempts to auto-detect the data source type by analyzing the CSV content
 * Uses validation functions from each parser to check column structure
 * @param csvContent - The raw CSV content
 * @returns The detected DataSource or null if unable to determine
 */
export function detectDataSourceFromContent(csvContent: string): DataSource | null {
  if (!csvContent || csvContent.trim() === "") {
    return null;
  }

  // Check each parser's validation function
  if (validateKlaviyoCampaignsCSV(csvContent)) {
    return "klaviyo-campaigns";
  }

  if (validateKlaviyoFlowsCSV(csvContent)) {
    return "klaviyo-flows";
  }

  if (validatePardotCampaignsCSV(csvContent)) {
    return "pardot-campaigns";
  }

  if (validatePardotFlowsCSV(csvContent)) {
    return "pardot-flows";
  }

  if (validateGA4PagesCSV(csvContent)) {
    return "ga4-pages";
  }

  if (validateGA4AcquisitionCSV(csvContent)) {
    return "ga4-acquisition";
  }

  if (validateSproutSocialCSV(csvContent)) {
    return "sprout-social";
  }

  return null;
}

/**
 * Gets all available data source types
 * @returns Array of all DataSource values
 */
export function getAllDataSources(): DataSource[] {
  return [
    "klaviyo-campaigns",
    "klaviyo-flows",
    "pardot-campaigns",
    "pardot-flows",
    "ga4-pages",
    "ga4-acquisition",
    "sprout-social",
  ];
}

/**
 * Gets the database type string for a data source
 * @param source - The DataSource
 * @returns The database type string
 */
export function getDatabaseType(source: DataSource): string {
  return DATA_SOURCE_TO_DB_TYPE[source];
}

/**
 * Gets the DataSource for a database type string
 * @param dbType - The database type string
 * @returns The DataSource or null if not found
 */
export function getDataSourceFromDBType(dbType: string): DataSource | null {
  return DB_TYPE_TO_DATA_SOURCE[dbType] || null;
}

/**
 * Gets a human-readable label for a data source
 * @param source - The DataSource
 * @returns Human-readable label
 */
export function getDataSourceLabel(source: DataSource): string {
  return DATA_SOURCE_LABELS[source];
}

/**
 * Validates that a CSV file matches the expected data source type
 * @param sourceType - The expected data source type
 * @param csvContent - The raw CSV content
 * @returns True if the content appears valid for the data source
 */
export function validateCSVForDataSource(
  sourceType: DataSource,
  csvContent: string
): boolean {
  switch (sourceType) {
    case "klaviyo-campaigns":
      return validateKlaviyoCampaignsCSV(csvContent);
    case "klaviyo-flows":
      return validateKlaviyoFlowsCSV(csvContent);
    case "pardot-campaigns":
      return validatePardotCampaignsCSV(csvContent);
    case "pardot-flows":
      return validatePardotFlowsCSV(csvContent);
    case "ga4-pages":
      return validateGA4PagesCSV(csvContent);
    case "ga4-acquisition":
      return validateGA4AcquisitionCSV(csvContent);
    case "sprout-social":
      return validateSproutSocialCSV(csvContent);
    default:
      return false;
  }
}
