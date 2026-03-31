/**
 * Validation Schemas
 * Zod schemas for API request validation
 * Ensures type safety, SQL injection prevention, XSS protection
 */

import { z } from 'zod';

/**
 * Common validation patterns
 */
const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email must be 255 characters or less');

const uuidSchema = z.string().uuid('Invalid UUID format');

const dateStringSchema = z
  .string()
  .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format');

const startDateSchema = dateStringSchema.transform((date) => {
  const parsed = date.match(/^(\d{4}-\d{2}-\d{2})/);
  if (parsed) {
    return new Date(`${parsed[1]}T00:00:00.000Z`);
  }
  return new Date(date);
});

const endDateSchema = dateStringSchema.transform((date) => {
  const parsed = date.match(/^(\d{4}-\d{2}-\d{2})/);
  if (parsed) {
    return new Date(`${parsed[1]}T23:59:59.999Z`);
  }
  return new Date(date);
});

/**
 * User Management Schemas
 */

// Create user request
export const createUserSchema = z.object({
  email: emailSchema,
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .trim(),
  employeeCode: z
    .string()
    .max(6, 'Employee Code must be 6 characters or less')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || null),
  departmentCode: z
    .string()
    .max(4, 'Department Code must be 4 characters or less')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || null),
  fncCode: z
    .string()
    .max(10, 'FNC Code must be 10 characters or less')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be 255 characters or less')
    .optional(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be 255 characters or less')
    .trim()
    .optional(),
  employeeCode: z
    .string()
    .max(6, 'Employee Code must be 6 characters or less')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || null),
  departmentCode: z
    .string()
    .max(4, 'Department Code must be 4 characters or less')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || null),
  fncCode: z
    .string()
    .max(10, 'FNC Code must be 10 characters or less')
    .trim()
    .optional()
    .nullable()
    .transform((val) => val || null),
});

/**
 * Time Log Query Schemas
 */

/**
 * Parse date string (YYYY-MM-DD) to Date at start of day UTC
 * Used for startDate comparisons (gte)
 */
function parseDateStartOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Parse date string (YYYY-MM-DD) to Date at end of day UTC
 * Used for endDate comparisons (lte)
 *
 * Since we store dates at noon UTC (T12:00:00Z), the endDate needs
 * to be at end of day to include all logs on that date.
 */
function parseDateEndOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`);
}

// Time log filters
export const timeLogQuerySchema = z
  .object({
    startDate: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
        'Invalid date format for startDate (expected YYYY-MM-DD)'
      )
      .transform((val) => (val ? parseDateStartOfDay(val) : undefined)),
    endDate: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
        'Invalid date format for endDate (expected YYYY-MM-DD)'
      )
      .transform((val) => (val ? parseDateEndOfDay(val) : undefined)),
    userId: z.string().optional(),
    projectId: z.string().optional(),
    companyId: z.string().optional(),
    approvalStatus: z
      .string()
      .optional()
      .refine(
        (val) => !val || ['approved', 'inreview', 'needschanges', 'null', 'all'].includes(val),
        'Invalid approval status (must be: approved, inreview, needschanges, null, or all)'
      ),
    billableStatus: z
      .string()
      .optional()
      .refine(
        (val) => !val || ['billable', 'non-billable', 'all'].includes(val),
        'Invalid billable status (must be: billable, non-billable, or all)'
      ),
    page: z
      .string()
      .optional()
      .default('1')
      .refine((val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num > 0 && num <= 10000;
      }, 'Page must be between 1 and 10000')
      .transform((val) => parseInt(val, 10)),
    pageSize: z
      .string()
      .optional()
      .default('50')
      .refine((val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num > 0 && num <= 100;
      }, 'Page size must be between 1 and 100')
      .transform((val) => parseInt(val, 10)),
  })
  .refine(
    (data) => {
      // Ensure endDate is after startDate if both provided
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  );

/**
 * Export Generation Schema
 */

// Company ID can be either a UUID (internal) or a Teamwork company ID (numeric string)
const companyIdSchema = z
  .string()
  .refine(
    (val) => z.string().uuid().safeParse(val).success || /^\d+$/.test(val),
    'Company ID must be a UUID or numeric Teamwork company ID'
  );

export const exportRequestSchema = z
  .object({
    startDate: startDateSchema,
    endDate: endDateSchema,
    userId: uuidSchema.optional().nullable(),
    projectId: uuidSchema.optional().nullable(),
    companyId: companyIdSchema.optional().nullable(),
    approvalStatus: z
      .string()
      .optional()
      .refine(
        (val) => !val || ['approved', 'inreview', 'needschanges', 'null', 'all'].includes(val),
        'Invalid approval status (must be: approved, inreview, needschanges, null, or all)'
      ),
    isQuickRun: z.boolean().optional().default(false),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

/**
 * Sync Trigger Schema
 */

export const syncTriggerSchema = z.object({
  manual: z.boolean().optional().default(false),
  force: z.boolean().optional().default(false),
});

/**
 * Validation Error Formatter
 * Converts Zod validation errors to user-friendly format
 */
export function formatValidationErrors(error: z.ZodError<any>) {
  return error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
