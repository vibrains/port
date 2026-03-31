/**
 * Upload tracking database queries (MOCK)
 * @module lib/db/queries/uploads
 */

import type { DataUpload, UploadStatus } from "@/types/database";
import { mockUploads } from "@/lib/mock-data";

// In-memory mutable copy
const uploads = [...mockUploads];

export async function createUploadRecord(data: {
  clientId: string;
  sourceType: string;
  fileName: string;
  uploadedBy: string;
  periodStart?: Date;
  periodEnd?: Date;
  reportMonth?: string;
}): Promise<{ id: string }> {
  const id = crypto.randomUUID();
  const upload: DataUpload = {
    id,
    client_id: data.clientId,
    source_type: data.sourceType as DataUpload["source_type"],
    file_name: data.fileName,
    row_count: null,
    period_start: data.periodStart?.toISOString() ?? null,
    period_end: data.periodEnd?.toISOString() ?? null,
    report_month: data.reportMonth ?? null,
    uploaded_by: data.uploadedBy,
    uploaded_at: new Date().toISOString(),
    status: "processing",
    error_message: null,
    metadata: { original_filename: data.fileName },
  };
  uploads.unshift(upload);
  return { id };
}

export async function updateUploadStatus(
  uploadId: string,
  status: UploadStatus,
  data: { rowCount?: number; errorMessage?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  const upload = uploads.find((u) => u.id === uploadId);
  if (!upload) return;
  upload.status = status;
  if (data.rowCount !== undefined) upload.row_count = data.rowCount;
  if (data.errorMessage !== undefined) upload.error_message = data.errorMessage;
  if (data.metadata !== undefined) upload.metadata = { ...upload.metadata, ...data.metadata };
}

export async function getUploadHistory(clientId: string, reportMonth?: string): Promise<DataUpload[]> {
  let data = uploads.filter((u) => u.client_id === clientId);
  if (reportMonth) data = data.filter((u) => u.report_month === reportMonth);
  return data.sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
}

export async function getDistinctUploadMonths(_clientId: string): Promise<string[]> {
  const months = new Set<string>();
  for (const u of uploads) {
    if (u.report_month && u.status === "completed") months.add(u.report_month);
  }
  return Array.from(months).sort().reverse();
}

export async function getUploadById(uploadId: string): Promise<DataUpload | null> {
  return uploads.find((u) => u.id === uploadId) ?? null;
}

export async function deleteUploadAndRelatedData(
  clientId: string,
  uploadId: string
): Promise<{
  uploadId: string;
  deleted: {
    klaviyoFlows: number; emailCampaigns: number; pardotFlows: number;
    ga4Pages: number; ga4Acquisition: number; socialPosts: number; uploadRecord: number;
  };
} | null> {
  const idx = uploads.findIndex((u) => u.id === uploadId && u.client_id === clientId);
  if (idx === -1) return null;
  uploads.splice(idx, 1);
  return {
    uploadId,
    deleted: { klaviyoFlows: 0, emailCampaigns: 0, pardotFlows: 0, ga4Pages: 0, ga4Acquisition: 0, socialPosts: 0, uploadRecord: 1 },
  };
}
