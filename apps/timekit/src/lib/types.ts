/**
 * TypeScript Type Definitions
 * Backend Lead Agent - Phase 1
 *
 * Shared types and interfaces for the application
 */

import { User, Project, TimeLog, Export, Company } from '@prisma/client';

// Re-export Prisma types
export type { User, Project, TimeLog, Export, Company };

export type ApprovalStatus = 'approved' | 'inreview' | 'needschanges' | null;

// Teamwork API Types
export interface TeamworkTimeLog {
  id: number;
  userId: number;
  projectId: number;
  taskId: number | null;
  date: string;
  minutes: number;
  description: string | null;
  jobNumber: string | null;
  approvalStatus: ApprovalStatus;
  billable: boolean;
  deleted: boolean;
}

export interface TeamworkProject {
  id: number;
  name: string;
  description?: string;
}

export interface TeamworkUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  companyId: number;
}

export interface TeamworkCompany {
  id: number;
  name: string;
}

// API Request/Response Types
export interface SyncRequest {
  apiKey?: string;
  manual?: boolean;
}

export interface SyncResponse {
  success: boolean;
  syncedLogs?: number;
  timestamp?: string;
  error?: string;
}

export interface ExportRequest {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  expiresAt?: string;
  fileName?: string;
  error?: string;
}

// Extended types with relations
export type TimeLogWithRelations = TimeLog & {
  user: User;
  project: Project;
};

export type ExportWithRelations = Export & {
  creator: User;
};

// Filter types
export interface TimeLogFilters {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  projectId?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Standard API Response format
 * All API endpoints should use this format for consistency
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

export interface APIPaginatedResponse<T> extends APIResponse<T[]> {
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
