/**
 * In-memory export store for demo mode.
 * Uses globalThis to share state across all API route handlers in dev mode.
 */

import { MOCK_EXPORTS } from './mock-data';

export interface ExportFilters {
  userId?: string;
  projectId?: string;
  companyId?: string;
  approvalStatus?: string;
  billableStatus?: string;
}

export interface ExportEntry {
  id: string;
  fileName: string;
  s3Key: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  recordCount: number;
  fileSize: number;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  filters?: ExportFilters;
}

interface ExportStore {
  entries: ExportEntry[];
  counter: number;
}

const globalStore = globalThis as unknown as { __exportStore?: ExportStore };

function getStore(): ExportStore {
  if (!globalStore.__exportStore) {
    globalStore.__exportStore = {
      entries: [...MOCK_EXPORTS],
      counter: MOCK_EXPORTS.length,
    };
  }
  return globalStore.__exportStore;
}

export function getExports(limit = 50): ExportEntry[] {
  return getStore().entries.slice(0, limit);
}

export function getExportById(id: string): ExportEntry | undefined {
  return getStore().entries.find(e => e.id === id);
}

export function addExport(entry: {
  dateRangeStart: string;
  dateRangeEnd: string;
  recordCount: number;
  filters?: ExportFilters;
}): ExportEntry {
  const store = getStore();
  store.counter++;
  const now = new Date();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${now.getFullYear()}`;
  const newExport: ExportEntry = {
    id: `exp-${String(store.counter).padStart(3, '0')}`,
    fileName: `advtime_${dateStr}.txt`,
    s3Key: `exports/advtime_${dateStr}.txt`,
    dateRangeStart: entry.dateRangeStart,
    dateRangeEnd: entry.dateRangeEnd,
    recordCount: entry.recordCount,
    fileSize: entry.recordCount * 371,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 86400000).toISOString(),
    isExpired: false,
    filters: entry.filters,
  };
  store.entries.unshift(newExport);
  return newExport;
}

export function clearExports(): void {
  const store = getStore();
  store.entries = [];
}
