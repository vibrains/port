/**
 * Upload processing utility
 * Handles CSV parsing and database insertion for uploads
 * @module lib/upload/processor
 */

import { DataSource, parseCSV, DATA_SOURCE_TO_DB_TYPE } from "@/lib/parsers/factory";
import {
  insertEmailCampaigns,
  insertKlaviyoFlows,
  insertPardotFlows,
  insertGA4Pages,
  insertGA4Acquisition,
  insertSocialPosts,
} from "@/lib/db/queries";
import { createUploadRecord, updateUploadStatus } from "@/lib/db/queries/uploads";

/**
 * Result of processing an upload
 */
export interface ProcessUploadResult {
  /** Whether the upload was successful */
  success: boolean;
  /** The upload ID */
  uploadId: string;
  /** Number of rows parsed from CSV */
  parsed: number;
  /** Number of rows inserted into database */
  inserted: number;
  /** Array of error messages */
  errors: string[];
  /** Array of warning messages */
  warnings: string[];
}

/**
 * Options for processing an upload
 */
interface ProcessUploadOptions {
  /** The client ID */
  clientId: string;
  /** The source type of the data */
  sourceType: DataSource;
  /** The original file name */
  fileName: string;
  /** The ID of the user uploading */
  uploadedBy: string;
  /** The report month in "YYYY-MM" format */
  reportMonth?: string;
}

/**
 * Processes a CSV upload by parsing and inserting into the database
 * @param csvContent - The raw CSV content
 * @param options - Processing options
 * @returns Result of the upload processing
 */
export async function processUpload(
  csvContent: string,
  options: ProcessUploadOptions
): Promise<ProcessUploadResult> {
  const { clientId, sourceType, fileName, uploadedBy, reportMonth } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Create upload record
  let uploadId: string;
  try {
    const record = await createUploadRecord({
      clientId,
      sourceType: DATA_SOURCE_TO_DB_TYPE[sourceType],
      fileName,
      uploadedBy,
      reportMonth,
    });
    uploadId = record.id;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating upload record:", {
      message: errorMessage,
      details: error instanceof Error && error.cause ? String(error.cause) : undefined,
    });
    
    // Provide more specific error message for database connection issues
    let userFriendlyError = `Failed to create upload record: ${errorMessage}`;
    if (errorMessage.includes("fetch failed") || errorMessage.includes("ENOTFOUND")) {
      userFriendlyError = "Database connection failed. Please ensure DATABASE_URL is properly configured in your .env.local file.";
    }
    
    return {
      success: false,
      uploadId: "",
      parsed: 0,
      inserted: 0,
      errors: [userFriendlyError],
      warnings: [],
    };
  }

  try {
    // Parse the CSV
    const parseResult = parseCSV(sourceType, csvContent, {
      clientId,
      uploadId,
      onProgress: (progress) => {
        // Progress updates can be sent via WebSocket or stored for polling
        console.log(`Upload ${uploadId} progress: ${progress}%`);
      },
    });

    const parsedCount = parseResult.data.length;

    // Collect parsing errors as warnings (don't fail the upload)
    if (parseResult.errors.length > 0) {
      warnings.push(
        ...parseResult.errors.slice(0, 10).map((e) => `Row ${e.row}: ${e.message}`)
      );
      if (parseResult.errors.length > 10) {
        warnings.push(`... and ${parseResult.errors.length - 10} more errors`);
      }
    }

    if (parsedCount === 0) {
      await updateUploadStatus(uploadId, "failed", {
        errorMessage: "No valid data found in CSV",
        metadata: {
          validation_errors: warnings,
        },
      });

      return {
        success: false,
        uploadId,
        parsed: 0,
        inserted: 0,
        errors: ["No valid data found in CSV"],
        warnings,
      };
    }

    // Insert data based on source type
    let insertResult: { success: boolean; inserted: number; errors?: string[] };

    switch (sourceType) {
      case "klaviyo-campaigns":
      case "pardot-campaigns": {
        // These are both email campaigns with different sources
        const campaigns = parseResult.data.map((item: unknown) => ({
          ...(item as Record<string, unknown>),
          source: sourceType === "klaviyo-campaigns" ? "klaviyo" : "pardot",
        }));
        insertResult = await insertEmailCampaigns(
          campaigns as Parameters<typeof insertEmailCampaigns>[0],
          uploadId
        );
        break;
      }

      case "klaviyo-flows":
        insertResult = await insertKlaviyoFlows(
          parseResult.data as Parameters<typeof insertKlaviyoFlows>[0],
          uploadId
        );
        break;

      case "pardot-flows":
        insertResult = await insertPardotFlows(
          parseResult.data as Parameters<typeof insertPardotFlows>[0],
          uploadId
        );
        break;

      case "ga4-pages":
        insertResult = await insertGA4Pages(
          parseResult.data as Parameters<typeof insertGA4Pages>[0],
          uploadId
        );
        break;

      case "ga4-acquisition":
        insertResult = await insertGA4Acquisition(
          parseResult.data as Parameters<typeof insertGA4Acquisition>[0],
          uploadId
        );
        break;

      case "sprout-social":
        insertResult = await insertSocialPosts(
          parseResult.data as Parameters<typeof insertSocialPosts>[0],
          uploadId
        );
        break;

      default:
        throw new Error(`Unsupported data source type: ${sourceType}`);
    }

    // Collect insert errors
    if (insertResult.errors && insertResult.errors.length > 0) {
      errors.push(...insertResult.errors);
    }

    // Update upload status
    const status = insertResult.success
      ? insertResult.inserted === parsedCount
        ? "completed"
        : "partial"
      : "failed";

    await updateUploadStatus(uploadId, status, {
      rowCount: insertResult.inserted,
      errorMessage: errors.length > 0 ? errors.join("; ") : undefined,
      metadata: {
        parsed_rows: parsedCount,
        inserted_rows: insertResult.inserted,
        validation_errors: warnings,
      },
    });

    return {
      success: insertResult.success && insertResult.inserted > 0,
      uploadId,
      parsed: parsedCount,
      inserted: insertResult.inserted,
      errors,
      warnings,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing upload:", error);

    // Update upload status to failed
    await updateUploadStatus(uploadId, "failed", {
      errorMessage,
    });

    return {
      success: false,
      uploadId,
      parsed: 0,
      inserted: 0,
      errors: [errorMessage],
      warnings,
    };
  }
}

/**
 * Validates a file for upload
 * @param file - The file to validate
 * @returns Validation result with success flag and optional error message
 */
export function validateUploadFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
    return {
      valid: false,
      error: "Invalid file type. Only CSV files are supported.",
    };
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB.`,
    };
  }

  // Check file is not empty
  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty.",
    };
  }

  return { valid: true };
}

/**
 * Detects the data source type from a file name
 * @param fileName - The name of the file
 * @returns The detected data source or null
 */
export function detectSourceFromFilename(fileName: string): DataSource | null {
  const normalizedName = fileName.toLowerCase();

  // Klaviyo patterns
  if (normalizedName.includes("klaviyo") && normalizedName.includes("email")) {
    return "klaviyo-campaigns";
  }
  if (normalizedName.includes("klaviyo") && normalizedName.includes("flow")) {
    return "klaviyo-flows";
  }

  // Pardot patterns
  if (normalizedName.includes("pardot") && normalizedName.includes("email")) {
    return "pardot-campaigns";
  }
  if (normalizedName.includes("pardot") && normalizedName.includes("flow")) {
    return "pardot-flows";
  }

  // GA4 patterns
  if (normalizedName.includes("ga4") && normalizedName.includes("page")) {
    return "ga4-pages";
  }
  if (normalizedName.includes("ga4") && normalizedName.includes("acquisition")) {
    return "ga4-acquisition";
  }

  // Sprout Social patterns
  if (normalizedName.includes("sprout") || normalizedName.includes("social")) {
    return "sprout-social";
  }

  return null;
}
