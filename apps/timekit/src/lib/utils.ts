/**
 * Utility Functions
 * Frontend Lead Agent - Phase 1
 *
 * Shared utility functions for the application
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Application timezone - Pacific Time (handles PST/PDT automatically)
 * Can be overridden with TZ environment variable
 */
export const APP_TIMEZONE = process.env.TZ || process.env.NEXT_PUBLIC_TZ || 'America/Los_Angeles';

/**
 * Combines class names using clsx and tailwind-merge
 * Useful for conditional and dynamic Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format minutes to hours and minutes display
 * Example: 150 minutes -> "2h 30m"
 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Format date to readable string
 * Example: 2024-12-15 -> "December 15, 2024"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format date to YYYY-MM-DD in local timezone
 * Uses date-fns format() which respects local timezone
 * IMPORTANT: Don't use toISOString() as it converts to UTC and causes date shifts
 */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format date to YYYY-MM-DD in Pacific Time
 * Use this for API date parameters to ensure consistent Pacific Time interpretation
 */
export function formatDatePT(date: Date): string {
  return formatInTimeZone(date, APP_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Convert UTC date to Pacific Time Date object
 * Use this when displaying dates from the database
 */
export function toPacificTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(dateObj, APP_TIMEZONE);
}

/**
 * Format date with timezone in Pacific Time
 * Use this for displaying dates to users
 */
export function formatDateTimePT(
  date: Date | string,
  formatStr = 'MMM dd, yyyy HH:mm zzz'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(dateObj, APP_TIMEZONE, formatStr);
}
