/**
 * Upload History Table Component
 * Table component for displaying upload history records
 * @module components/upload/upload-history-table
 */

"use client";

import { Fragment, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DataUpload } from "@/types/database";
import { DB_TYPE_TO_DATA_SOURCE, DATA_SOURCE_LABELS } from "@/lib/parsers/factory";
import { StatusBadge } from "./status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  AlertCircle,
  Trash2,
  Calendar,
} from "lucide-react";

/**
 * Props for the UploadHistoryTable component
 */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface UploadHistoryTableProps {
  /** Array of upload records */
  uploads: DataUpload[];
  /** Current page number (1-based) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Total number of items (for pagination) */
  totalCount?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Upload History Table component
 * Displays upload records with status badges, formatting, and pagination
 */
export function UploadHistoryTable({
  uploads,
  page = 1,
  pageSize = 10,
  totalCount,
  onPageChange,
  className,
}: UploadHistoryTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());
  const [deletingUploadId, setDeletingUploadId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : Math.ceil(uploads.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUploads = uploads.slice(startIndex, endIndex);

  const handlePageChange = onPageChange ?? ((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  });

  /**
   * Toggles error message expansion for a row
   */
  const toggleError = (uploadId: string) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(uploadId)) {
        next.delete(uploadId);
      } else {
        next.add(uploadId);
      }
      return next;
    });
  };

  /**
   * Gets the display label for a data source type
   */
  const getSourceLabel = (sourceType: string): string => {
    const dataSource = DB_TYPE_TO_DATA_SOURCE[sourceType];
    return dataSource ? DATA_SOURCE_LABELS[dataSource] : sourceType;
  };

  /**
   * Formats a date string to a readable format
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "\u2014";
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch {
      return dateString;
    }
  };

  /**
   * Formats a report month "YYYY-MM" to readable format
   */
  const formatReportMonth = (month: string | null): string => {
    if (!month) return "\u2014";
    try {
      return format(new Date(month + "-01"), "MMM yyyy");
    } catch {
      return month;
    }
  };

  /**
   * Formats a number with commas
   */
  const formatNumber = (num: number | null): string => {
    if (num === null || num === undefined) return "\u2014";
    return num.toLocaleString();
  };

  const MONTH_NAMES = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];

  /**
   * Extracts a month group label from a filename or report_month.
   * Filenames start with the month name (e.g., "January_GA4_Pages.csv").
   * Falls back to report_month (YYYY-MM) or "Other".
   */
  const getMonthGroup = (upload: DataUpload): string => {
    if (upload.file_name) {
      const parts = upload.file_name.split(/[_\s-]/);
      let monthName = "";
      let year = "";
      for (const part of parts) {
        const lower = part.toLowerCase();
        if (MONTH_NAMES.includes(lower)) {
          monthName = lower.charAt(0).toUpperCase() + lower.slice(1);
        } else if (/^\d{4}$/.test(part)) {
          year = part;
        }
        if (monthName && year) break;
      }
      if (monthName) {
        if (!year && upload.report_month) {
          year = upload.report_month.split("-")[0];
        } else if (!year && upload.period_start) {
          year = new Date(upload.period_start).getFullYear().toString();
        }
        return year ? `${monthName} ${year}` : monthName;
      }
    }
    if (upload.report_month) {
      return formatReportMonth(upload.report_month);
    }
    return "Other";
  };

  /**
   * Groups uploads by month, preserving order of first appearance
   */
  const groupUploadsByMonth = (items: DataUpload[]): { label: string; uploads: DataUpload[] }[] => {
    const groups = new Map<string, DataUpload[]>();
    for (const upload of items) {
      const key = getMonthGroup(upload);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(upload);
    }
    return Array.from(groups.entries()).map(([label, uploads]) => ({ label, uploads }));
  };

  const monthGroups = groupUploadsByMonth(paginatedUploads);

  const handleDeleteUpload = async (uploadId: string, fileName: string | null) => {
    const confirmed = window.confirm(
      `Delete upload "${fileName || "Unnamed file"}" and all related imported data? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleteError(null);
    setDeletingUploadId(uploadId);

    try {
      const response = await fetch(`${BASE_PATH}/api/upload?uploadId=${encodeURIComponent(uploadId)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Failed to delete upload.");
      }

      router.refresh();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete upload.");
    } finally {
      setDeletingUploadId(null);
    }
  };

  if (uploads.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No uploads yet
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your first CSV file to see it here
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[350px]">Filename</TableHead>
              <TableHead>Source Type</TableHead>
              <TableHead>Report Month</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Rows</TableHead>
              <TableHead className="text-right">Uploaded By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthGroups.map((group) => (
              <Fragment key={`group-${group.label}`}>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableCell colSpan={8} className="py-2">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {group.label}
                      <span className="text-xs font-normal text-muted-foreground">
                        ({group.uploads.length} {group.uploads.length === 1 ? "file" : "files"})
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
                {group.uploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate" title={upload.file_name || undefined}>
                          {upload.file_name || "Unnamed file"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getSourceLabel(upload.source_type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatReportMonth(upload.report_month)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(upload.uploaded_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={upload.status} size="sm" />
                      {upload.status === "failed" && upload.error_message && (
                        <div className="mt-1">
                          <button
                            onClick={() => toggleError(upload.id)}
                            className="text-xs text-destructive hover:underline flex items-center gap-1"
                            type="button"
                          >
                            <AlertCircle className="w-3 h-3" />
                            {expandedErrors.has(upload.id) ? "Hide error" : "View error"}
                          </button>
                          {expandedErrors.has(upload.id) && (
                            <div className="mt-2 p-2 text-xs bg-destructive/10 text-destructive rounded">
                              {upload.error_message}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-mono">
                        {formatNumber(upload.row_count)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {upload.uploaded_by || "\u2014"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteUpload(upload.id, upload.file_name)}
                        disabled={deletingUploadId === upload.id}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {deletingUploadId === upload.id ? "Deleting..." : "Delete"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {deleteError && (
        <div className="text-sm text-destructive" role="alert">
          {deleteError}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, uploads.length)} of{" "}
            {uploads.length} uploads
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={page === 1}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm px-3">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={page === totalPages}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
