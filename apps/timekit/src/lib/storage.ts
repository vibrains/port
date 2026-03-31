/**
 * Sevalla Object Storage Service
 * Backend Lead Agent - Phase 5
 *
 * S3-compatible object storage client for Sevalla (Cloudflare R2)
 * Handles file uploads and presigned URL generation for exports
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '@/lib/logger';

/**
 * S3 client configuration for Sevalla Object Storage
 * Uses S3-compatible API (Cloudflare R2)
 */
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

/**
 * Upload a file to S3-compatible storage
 *
 * @param key - S3 object key (file path)
 * @param content - File content as string
 * @param contentType - MIME type of the file
 * @returns Promise resolving to the S3 key
 */
export async function uploadToS3(
  key: string,
  content: string,
  contentType: string = 'text/plain'
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: contentType,
    });

    await s3Client.send(command);

    return key;
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : 'Unknown error' },
      'Storage upload error'
    );
    throw new Error(
      error instanceof Error ? `S3 upload failed: ${error.message}` : 'Failed to upload to S3'
    );
  }
}

/**
 * Generate a presigned URL for downloading a file from S3
 *
 * @param key - S3 object key (file path)
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @param fileName - Optional filename for download (sets Content-Disposition)
 * @returns Promise resolving to the presigned URL
 */
export async function generatePresignedUrl(
  key: string,
  expiresIn: number = 3600,
  fileName?: string
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      // Force download instead of inline display
      ResponseContentDisposition: fileName ? `attachment; filename="${fileName}"` : 'attachment',
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return presignedUrl;
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : 'Unknown error' },
      'Storage presigned URL generation error'
    );
    throw new Error(
      error instanceof Error
        ? `Failed to generate presigned URL: ${error.message}`
        : 'Failed to generate presigned URL'
    );
  }
}

/**
 * Delete a file from S3-compatible storage
 *
 * @param key - S3 object key (file path)
 * @returns Promise resolving when deletion is complete
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : 'Unknown error' },
      'Storage delete error'
    );
    throw new Error(
      error instanceof Error ? `S3 delete failed: ${error.message}` : 'Failed to delete from S3'
    );
  }
}

/**
 * Generate a unique S3 key for an export file
 *
 * @param userId - User ID creating the export
 * @param dateRangeStart - Start date of the export
 * @param dateRangeEnd - End date of the export
 * @returns S3 key in format: exports/{userId}/{timestamp}-{start}-{end}.txt
 */
export function generateExportKey(
  userId: string,
  dateRangeStart: Date,
  dateRangeEnd: Date
): string {
  const timestamp = Date.now();
  const startStr = dateRangeStart.toISOString().split('T')[0];
  const endStr = dateRangeEnd.toISOString().split('T')[0];

  return `exports/${userId}/${timestamp}-${startStr}-${endStr}.txt`;
}

/**
 * Validate S3 configuration
 * Throws an error if required environment variables are missing
 */
export function validateS3Config(): void {
  const required = ['S3_ENDPOINT', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required S3 configuration: ${missing.join(', ')}`);
  }
}
