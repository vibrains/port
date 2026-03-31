/**
 * Export Service
 * Backend Lead Agent - Phase 5
 *
 * Handles export generation, formatting, and S3 upload
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { uploadToS3, generatePresignedUrl, generateExportKey } from '@/lib/storage';
import { logger } from '@/lib/logger';

/**
 * TimeLog with relations for export
 */
interface TimeLogWithRelations {
  id: string;
  date: Date;
  minutes: number;
  description: string | null;
  billable: boolean;
  user: {
    name: string;
    email: string;
    employeeCode: string | null;
    departmentCode: string | null;
    fncCode: string | null;
  };
  project: {
    name: string;
    jobCode: string | null;
  };
}

/**
 * Export result containing URL and metadata
 */
export interface ExportResult {
  success: boolean;
  exportId?: string;
  downloadUrl?: string;
  fileName?: string;
  expiresAt?: Date;
  error?: string;
}

/**
 * Export options for generating time log exports
 */
export interface ExportOptions {
  createdByUserId: string;
  startDate: Date;
  endDate: Date;
  userId?: string;
  projectId?: string;
  companyId?: string;
  approvalStatus?: string;
  isQuickRun?: boolean;
}

/**
 * Format minutes into decimal hours (e.g., 150 minutes = 2.50 hours)
 *
 * @param minutes - Total minutes
 * @returns Decimal hours as string
 */
function formatDecimalHours(minutes: number): string {
  const hours = minutes / 60;
  return hours.toFixed(2);
}

/**
 * Pad string to the left with spaces
 *
 * @param value - Value to pad
 * @param length - Target length
 * @returns Left-padded string
 */
function padLeft(value: string, length: number): string {
  return value.substring(0, length).padStart(length, ' ');
}

/**
 * Pad string to the right with spaces
 *
 * @param value - Value to pad
 * @param length - Target length
 * @returns Right-padded string
 */
function padRight(value: string, length: number): string {
  return value.substring(0, length).padEnd(length, ' ');
}

/**
 * Format date as MM/DD/YYYY (with zero-padding)
 * Example: 12/01/2025 (always 10 characters)
 *
 * @param date - Date to format
 * @returns Formatted date string (exactly 10 characters)
 */
function formatDateMMDDYYYY(date: Date): string {
  // Use UTC methods to avoid timezone offset issues
  // Dates in database are stored as Date type (no time component)
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const year = String(date.getUTCFullYear());
  const dateStr = `${month}/${day}/${year}`;
  // Always exactly 10 characters: MM/DD/YYYY
  return dateStr;
}

/**
 * Generate fixed-width text file content from time logs
 * Format specification (all right-aligned unless noted):
 * - Date (1-10): M/D/YYYY, left-aligned (padded right)
 * - Employee Code (11-16): 6 chars, left-aligned (padded right)
 * - Department Code (17-20): 4 chars, left-aligned (padded right)
 * - Hours (21-29): 9 chars, right-aligned (padded left)
 * - Job Number (30-59): 30 chars, right-aligned (padded left)
 * - Job Component (60-61): 2 chars, right-aligned (padded left)
 * - FNC Code/Category (62-71): 10 chars, left-aligned (padded right)
 * - Comment (72-371): 300 chars, unused (padded right)
 *
 * Each time log uses codes from its associated user:
 * - employeeCode, departmentCode, fncCode from user fields
 * - Job component is conditional: 7 if billable, 5 if non-billable
 *
 * @param timeLogs - Array of time logs with user and project relations
 * @returns Fixed-width formatted text file content
 */
export function generateTextFileContent(timeLogs: TimeLogWithRelations[]): string {
  const lines: string[] = [];

  // Sort logs by date ascending (oldest first)
  const sortedLogs = [...timeLogs].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Generate fixed-width line for each time log
  sortedLogs.forEach((log) => {
    // Field 1: Date (M/D/YYYY) - Position 1, Length 10
    const dateStr = formatDateMMDDYYYY(new Date(log.date));

    // Field 2: Employee Code - Position 11, Length 6 (left-aligned, padded right)
    // Pull from user's employeeCode field
    const employeeCode = log.user.employeeCode || '';
    const employeeCodeStr = padRight(employeeCode, 6);

    // Field 3: Department Code - Position 17, Length 4 (left-aligned, padded right)
    // Pull from user's departmentCode field
    const departmentCode = log.user.departmentCode || '';
    const departmentCodeStr = padRight(departmentCode, 4);

    // Field 4: Hours - Position 21, Length 9 (right-aligned, decimal)
    const hours = formatDecimalHours(log.minutes);
    const hoursStr = padLeft(hours, 9);

    // Field 5: Job Number - Position 30, Length 30 (right-aligned)
    // Use job code from associated project (single source of truth)
    const jobNumber = String(log.project.jobCode || '');
    const jobNumberStr = padLeft(jobNumber, 30);

    // Field 6: Job Component - Position 60, Length 2 (right-aligned)
    // Conditional logic: 7 if billable, 5 if non-billable
    const jobComponentValue = log.billable ? '7' : '5';
    const jobComponent = padLeft(jobComponentValue, 2);

    // Field 7: FNC Code/Category - Position 62, Length 10 (left-aligned, padded right)
    // Use user's FNC code (not conditional)
    const fncCode = log.user.fncCode || '';
    const fncCodeStr = padRight(fncCode, 10);

    // Field 8: Comment - Position 72, Length 300 (unused)
    const comment = padRight('', 300);

    // Combine all fields to create fixed-width line
    const line =
      dateStr +
      employeeCodeStr +
      departmentCodeStr +
      hoursStr +
      jobNumberStr +
      jobComponent +
      fncCodeStr +
      comment;

    lines.push(line);
  });

  return lines.join('\n');
}

/**
 * Create a time log export
 * Fetches time logs with optional filters, generates text file, uploads to S3, and creates database record
 *
 * @param options - Export options (createdByUserId, date range, optional filters)
 * @returns Export result with download URL
 */
export async function createExport(options: ExportOptions): Promise<ExportResult> {
  try {
    const {
      createdByUserId,
      startDate,
      endDate,
      userId,
      projectId,
      companyId,
      approvalStatus = 'approved', // Default to 'approved' for backward compatibility
      isQuickRun = false,
    } = options;

    // Validate date range
    if (startDate > endDate) {
      return {
        success: false,
        error: 'Start date cannot be after end date',
      };
    }

    const where: Prisma.TimeLogWhereInput = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      // Exclude soft-deleted records
      deletedAt: null,
    };

    // Apply approval status filter (default to 'approved' unless explicitly set)
    // 'all' means no filter, 'null' means explicitly filter for null status
    if (approvalStatus && approvalStatus !== 'all') {
      where.approvalStatus = approvalStatus === 'null' ? null : approvalStatus;
    }

    // Add optional filters
    if (userId) {
      where.userId = userId;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    if (companyId) {
      where.user = {
        companyId: companyId,
      };
    }

    // Fetch time logs for date range with full user data
    const timeLogs = await prisma.timeLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            employeeCode: true,
            departmentCode: true,
            fncCode: true,
          },
        },
        project: {
          select: {
            name: true,
            jobCode: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Generate text file content (codes pulled from each log's user)
    const fileContent = generateTextFileContent(timeLogs);

    // Generate S3 key
    const s3Key = generateExportKey(createdByUserId, startDate, endDate);

    // Create export record in database
    // Filename format: advtime_MMDDYYYY.txt (export date, not date range)
    const exportDate = new Date();
    const month = String(exportDate.getMonth() + 1).padStart(2, '0');
    const day = String(exportDate.getDate()).padStart(2, '0');
    const year = String(exportDate.getFullYear());
    const fileName = `advtime_${month}${day}${year}.txt`;

    // Upload to S3
    await uploadToS3(s3Key, fileContent, 'text/plain; charset=utf-8');

    // Generate presigned URL (valid for 24 hours) with filename for download
    const downloadUrl = await generatePresignedUrl(s3Key, 86400, fileName);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const exportRecord = await prisma.export.create({
      data: {
        fileName,
        s3Key,
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
        isQuickRun,
        createdBy: createdByUserId,
        expiresAt,
      },
    });

    return {
      success: true,
      exportId: exportRecord.id,
      downloadUrl,
      fileName,
      expiresAt,
    };
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : 'Unknown error' },
      'Export creation error'
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create export',
    };
  }
}

/**
 * Get recent exports
 *
 * @param userId - Optional user ID to filter exports by (if not provided, returns all exports)
 * @param limit - Maximum number of exports to return (default: 10)
 * @returns Array of recent exports
 */
export async function getRecentExports(userId?: string, limit: number = 10) {
  try {
    const where = userId ? { createdBy: userId } : {};

    const exports = await prisma.export.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        fileName: true,
        s3Key: true,
        dateRangeStart: true,
        dateRangeEnd: true,
        createdAt: true,
        expiresAt: true,
        isQuickRun: true,
      },
    });

    return exports;
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : 'Unknown error' },
      'Get recent exports error'
    );
    throw new Error('Failed to fetch recent exports');
  }
}

/**
 * Regenerate presigned URL for an existing export
 *
 * @param exportId - Export ID
 * @param userId - User ID (for authorization)
 * @returns New presigned URL
 */
export async function regenerateExportUrl(
  exportId: string,
  userId: string
): Promise<string | null> {
  try {
    const exportRecord = await prisma.export.findFirst({
      where: {
        id: exportId,
        createdBy: userId,
      },
    });

    if (!exportRecord) {
      return null;
    }

    // Check if export has expired
    if (new Date() > exportRecord.expiresAt) {
      return null;
    }

    // Generate new presigned URL (valid for 24 hours) with filename for download
    const downloadUrl = await generatePresignedUrl(
      exportRecord.s3Key,
      86400,
      exportRecord.fileName
    );

    return downloadUrl;
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : 'Unknown error' },
      'Regenerate URL error'
    );
    throw new Error('Failed to regenerate export URL');
  }
}
