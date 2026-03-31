/**
 * Frontend API Client
 * Frontend Lead Agent - Phase 4
 *
 * Client-side API functions for fetching data from backend
 * Includes retry logic with exponential backoff for resilience
 */

import type { TimeLogWithRelations, SyncResponse } from './types';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Configuration for retry behavior
 */
interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Fetch with automatic retry and exponential backoff
 * Retries on network errors and specified HTTP status codes
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: RetryConfig = {}
): Promise<Response> {
  const { maxRetries, baseDelay, maxDelay, retryableStatuses } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If response is OK or not retryable, return it
      if (response.ok || !retryableStatuses.includes(response.status)) {
        return response;
      }

      // If we've exhausted retries, return the response anyway
      if (attempt === maxRetries) {
        return response;
      }

      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = delay * 0.1 * Math.random(); // Add 0-10% jitter
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // If this was our last attempt, throw
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying network errors
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Request failed after retries');
}

export interface TimeLogsSummary {
  totalMinutes: number;
  approvedCount: number;
  inReviewCount: number;
  needsChangesCount: number;
  notInWorkflowCount: number;
}

export interface TimeLogsResponse {
  success: boolean;
  data: TimeLogWithRelations[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  summary: TimeLogsSummary;
}

interface SyncStatusResponse {
  success: boolean;
  health: {
    teamworkConnected: boolean;
    databaseConnected: boolean;
    lastSyncDate: string | null;
    error?: string;
  };
}

interface ExportResponse {
  success: boolean;
  exportId?: string;
  downloadUrl?: string;
  fileName?: string;
  expiresAt?: string;
  error?: string;
}

interface FiltersResponse {
  users: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  companies: Array<{ id: string; name: string }>;
}

/**
 * Fetch time logs with filtering and pagination
 */
export async function fetchTimeLogs(params: {
  startDate?: string;
  endDate?: string;
  userId?: string;
  projectId?: string;
  companyId?: string;
  approvalStatus?: string;
  billableStatus?: string;
  page?: number;
  pageSize?: number;
}): Promise<TimeLogsResponse> {
  const searchParams = new URLSearchParams();

  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.userId) searchParams.set('userId', params.userId);
  if (params.projectId) searchParams.set('projectId', params.projectId);
  if (params.companyId) searchParams.set('companyId', params.companyId);
  if (params.approvalStatus) searchParams.set('approvalStatus', params.approvalStatus);
  if (params.billableStatus) searchParams.set('billableStatus', params.billableStatus);
  if (params.page) searchParams.set('page', String(params.page));
  if (params.pageSize) searchParams.set('pageSize', String(params.pageSize));

  const response = await fetchWithRetry(`${BASE_PATH}/api/time-logs?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch time logs');
  }

  return response.json();
}

/**
 * Trigger manual sync (incremental)
 */
export async function triggerSync(): Promise<SyncResponse> {
  // Sync operations may take longer, use a single attempt with no retry
  // to avoid duplicate sync operations
  const response = await fetch(`${BASE_PATH}/api/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ manual: true }),
  });

  if (!response.ok) {
    throw new Error('Failed to trigger sync');
  }

  return response.json();
}

/**
 * Trigger full database sync (non-incremental, re-fetches everything)
 */
export async function triggerFullSync(): Promise<SyncResponse> {
  const response = await fetch(`${BASE_PATH}/api/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ manual: true, force: true }),
  });

  if (!response.ok) {
    throw new Error('Failed to trigger full sync');
  }

  return response.json();
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<SyncStatusResponse> {
  const response = await fetchWithRetry(`${BASE_PATH}/api/sync`);

  if (!response.ok) {
    throw new Error('Failed to fetch sync status');
  }

  return response.json();
}

/**
 * Fetch combined filter datasets
 */
export async function fetchFilters(): Promise<FiltersResponse> {
  const response = await fetchWithRetry(`${BASE_PATH}/api/filters`);

  if (!response.ok) {
    throw new Error('Failed to fetch filters');
  }

  return response.json();
}

/**
 * Fetch all projects (for filters)
 */
export async function fetchProjects() {
  const response = await fetchWithRetry(`${BASE_PATH}/api/projects`);

  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }

  return response.json();
}

/**
 * Fetch all users (for filters)
 */
export async function fetchUsers() {
  const response = await fetchWithRetry(`${BASE_PATH}/api/users`);

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  return response.json();
}

/**
 * Fetch all companies (for filters)
 */
export async function fetchCompanies() {
  const response = await fetchWithRetry(`${BASE_PATH}/api/companies`);

  if (!response.ok) {
    throw new Error('Failed to fetch companies');
  }

  return response.json();
}

/**
 * Trigger export generation with filter parameters
 */
export async function triggerExport(params: {
  startDate: string;
  endDate: string;
  userId?: string;
  projectId?: string;
  companyId?: string;
  approvalStatus?: string;
  isQuickRun?: boolean;
}): Promise<ExportResponse> {
  const response = await fetch(`${BASE_PATH}/api/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to trigger export');
  }

  return response.json();
}
