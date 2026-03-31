/**
 * Upload Validator
 * Validates CSV uploads for file type, size, and content structure
 * @module lib/validators/upload
 */

import { DataSource, detectDataSource, detectDataSourceFromContent, validateCSVForDataSource } from "@/lib/parsers/factory";
import { parseCSVToRecords } from "@/lib/parsers";

/**
 * Maximum file size in MB (default: 50MB)
 */
export const DEFAULT_MAX_FILE_SIZE_MB = 50;

/**
 * Allowed file extensions for CSV uploads
 */
export const ALLOWED_EXTENSIONS = [".csv"];

/**
 * Allowed MIME types for CSV uploads
 */
export const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/csv",
  "text/plain",
  "text/x-csv",
];

/**
 * Result of upload validation
 */
export interface UploadValidationResult {
  /** Whether the upload is valid */
  valid: boolean;
  /** Error messages if invalid */
  errors: string[];
  /** Warning messages (non-blocking issues) */
  warnings: string[];
  /** Detected data source type */
  detectedSource?: DataSource;
  /** Number of rows in the CSV */
  rowCount?: number;
  /** Preview of the first few rows */
  preview?: Record<string, unknown>[];
  /** Column headers found in the CSV */
  headers?: string[];
}

/**
 * Validates a file upload
 * Checks file type, size, and optionally validates against expected data source
 * @param file - The file to validate
 * @param expectedSource - Optional expected data source type to validate against
 * @param maxSizeMB - Maximum file size in MB (default: 50)
 * @returns Promise resolving to validation result
 */
export async function validateUpload(
  file: File,
  expectedSource?: DataSource,
  maxSizeMB: number = DEFAULT_MAX_FILE_SIZE_MB
): Promise<UploadValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate file type
  if (!validateFileType(file)) {
    errors.push(
      `Invalid file type: "${file.type}". Only CSV files are allowed.`
    );
    return { valid: false, errors, warnings };
  }

  // Validate file size
  if (!validateFileSize(file, maxSizeMB)) {
    errors.push(
      `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed size is ${maxSizeMB}MB.`
    );
    return { valid: false, errors, warnings };
  }

  // Read file content
  let csvContent: string;
  try {
    csvContent = await readFileAsText(file);
  } catch (error) {
    errors.push(
      `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return { valid: false, errors, warnings };
  }

  // Check if file is empty
  if (!csvContent || csvContent.trim() === "") {
    errors.push("File is empty");
    return { valid: false, errors, warnings };
  }

  // Try to parse CSV
  let headers: string[];
  let records: Record<string, string>[];
  try {
    records = parseCSVToRecords(csvContent);
    headers = Object.keys(records[0] || {});
  } catch (error) {
    errors.push(
      `Failed to parse CSV: ${error instanceof Error ? error.message : "Invalid CSV format"}`
    );
    return { valid: false, errors, warnings };
  }

  // Check for data
  if (records.length === 0) {
    errors.push("CSV file contains no data rows");
    return { valid: false, errors, warnings };
  }

  // Check for headers
  if (headers.length === 0) {
    errors.push("CSV file has no headers");
    return { valid: false, errors, warnings };
  }

  // Detect data source from filename
  const detectedFromFilename = detectDataSource(file.name);

  // Detect data source from content
  const detectedFromContent = detectDataSourceFromContent(csvContent);

  // Determine final detected source
  let detectedSource: DataSource | undefined;
  if (detectedFromContent) {
    detectedSource = detectedFromContent;
  } else if (detectedFromFilename) {
    detectedSource = detectedFromFilename;
    warnings.push(
      `Data source detected from filename only. Please verify the file content matches the expected format.`
    );
  }

  // Validate against expected source if provided
  if (expectedSource) {
    if (detectedSource && detectedSource !== expectedSource) {
      warnings.push(
        `Expected ${expectedSource} but detected ${detectedSource}. Please verify you're uploading the correct file type.`
      );
    }

    // Validate CSV structure matches expected source
    const isValidStructure = validateCSVForDataSource(expectedSource, csvContent);
    if (!isValidStructure) {
      errors.push(
        `File does not appear to be a valid ${expectedSource} export. Please check the column headers and try again.`
      );
    }
  } else if (!detectedSource) {
    warnings.push(
      "Could not automatically detect data source type. Please select the correct type manually."
    );
  }

  // Generate preview (first 5 rows)
  const preview = records.slice(0, 5).map((row) => {
    const previewRow: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      // Truncate long values
      previewRow[key] = value.length > 100 ? value.substring(0, 100) + "..." : value;
    }
    return previewRow;
  });

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    detectedSource,
    rowCount: records.length,
    preview: valid ? preview : undefined,
    headers,
  };
}

/**
 * Validates a file's type
 * @param file - The file to validate
 * @returns True if the file type is allowed
 */
export function validateFileType(file: File): boolean {
  if (!file) {
    return false;
  }

  // Check MIME type
  if (ALLOWED_MIME_TYPES.includes(file.type)) {
    return true;
  }

  // Check file extension as fallback
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (ALLOWED_EXTENSIONS.includes(extension)) {
    return true;
  }

  return false;
}

/**
 * Validates a file's size
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 50)
 * @returns True if the file size is within limits
 */
export function validateFileSize(file: File, maxSizeMB: number = DEFAULT_MAX_FILE_SIZE_MB): boolean {
  if (!file) {
    return false;
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Reads a file as text
 * @param file - The file to read
 * @returns Promise resolving to file content as string
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Gets validation rules for a data source
 * Returns information about required columns and expected format
 * @param source - The data source type
 * @returns Object with validation rules
 */
export function getValidationRulesForSource(source: DataSource): {
  requiredColumns: string[];
  optionalColumns: string[];
  description: string;
} {
  switch (source) {
    case "klaviyo-campaigns":
      return {
        requiredColumns: ["Campaign Name", "Subject", "Send Time"],
        optionalColumns: ["Total Recipients", "Successful Deliveries", "Open Rate", "Click Rate", "Revenue", "Tags"],
        description: "Klaviyo email campaign export with campaign performance metrics",
      };
    case "klaviyo-flows":
      return {
        requiredColumns: ["Flow ID", "Flow Name", "Date"],
        optionalColumns: ["Total Recipients", "Open Rate", "Click Rate", "Tags"],
        description: "Klaviyo flow performance report with flow metrics",
      };
    case "pardot-campaigns":
      return {
        requiredColumns: ["Campaign Message Name", "Subject", "Send Date"],
        optionalColumns: ["Total Recipients", "Open Rate", "Click Rate", "Tags"],
        description: "Pardot email engagement report with campaign metrics",
      };
    case "pardot-flows":
      return {
        requiredColumns: ["Step Type", "Step Name"],
        optionalColumns: ["Sent", "Delivered", "Open Rate", "Click Rate"],
        description: "Pardot automation flow report with step-level metrics",
      };
    case "ga4-pages":
      return {
        requiredColumns: ["Page path and screen class", "Views"],
        optionalColumns: ["Active users", "Engagement rate", "Key events", "Total revenue"],
        description: "GA4 page performance report with page-level metrics",
      };
    case "ga4-acquisition":
      return {
        requiredColumns: ["First user source", "Sessions"],
        optionalColumns: ["New users", "Engagement rate", "Key events", "Total revenue"],
        description: "GA4 user acquisition report with source-level metrics",
      };
    case "sprout-social":
      return {
        requiredColumns: ["Post ID", "Network"],
        optionalColumns: ["Impressions", "Engagements", "Video Views", "Tags"],
        description: "Sprout Social post performance report with social metrics",
      };
    default:
      return {
        requiredColumns: [],
        optionalColumns: [],
        description: "Unknown data source",
      };
  }
}

/**
 * Validates column headers against expected columns for a data source
 * @param headers - Array of column headers from the CSV
 * @param source - The expected data source type
 * @returns Object with missing required columns and unexpected columns
 */
export function validateColumnsForSource(
  headers: string[],
  source: DataSource
): {
  missingRequired: string[];
  unexpected: string[];
} {
  const rules = getValidationRulesForSource(source);
  const headerSet = new Set(headers.map((h) => h.toLowerCase().trim()));

  // Check for missing required columns
  const missingRequired = rules.requiredColumns.filter(
    (col) => !headerSet.has(col.toLowerCase().trim())
  );

  // For now, we don't flag unexpected columns as they might be custom fields
  // This could be enhanced in the future
  const unexpected: string[] = [];

  return { missingRequired, unexpected };
}

/**
 * Quick validation for drag-and-drop interface
 * Only checks file type and size without parsing content
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB
 * @returns Object with validation status
 */
export function quickValidateFile(
  file: File,
  maxSizeMB: number = DEFAULT_MAX_FILE_SIZE_MB
): { valid: boolean; error?: string } {
  if (!validateFileType(file)) {
    return {
      valid: false,
      error: `Invalid file type. Only CSV files (.csv) are allowed.`,
    };
  }

  if (!validateFileSize(file, maxSizeMB)) {
    return {
      valid: false,
      error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${maxSizeMB}MB.`,
    };
  }

  return { valid: true };
}
