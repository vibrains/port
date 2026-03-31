/**
 * Upload Page
 * Bulk upload page for CSV data import with per-file source/month detection
 * @module app/(dashboard)/admin/upload/page
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DataSource,
  DATA_SOURCE_LABELS,
  detectDataSource,
} from "@/lib/parsers/factory";
import { Dropzone } from "@/components/upload/dropzone";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  X,
} from "lucide-react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

const MONTH_NAMES = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const DATA_SOURCES = Object.entries(DATA_SOURCE_LABELS) as [
  DataSource,
  string,
][];

type FileStatus = "pending" | "uploading" | "success" | "error";

interface FileEntry {
  id: string;
  file: File;
  sourceType: DataSource | null;
  reportMonth: string;
  status: FileStatus;
  rowCount?: number;
  errorMessage?: string;
}

/**
 * Detects report month from a filename (e.g., "2026_January_..." → "2026-01")
 */
function detectMonthFromFilename(filename: string): string {
  const parts = filename.split(/[_\s-]/);
  let month = "";
  let year = "";
  for (const part of parts) {
    const lower = part.toLowerCase();
    const idx = MONTH_NAMES.indexOf(lower);
    if (idx !== -1) {
      month = String(idx + 1).padStart(2, "0");
    } else if (/^\d{4}$/.test(part)) {
      year = part;
    }
    if (month && year) break;
  }
  return month && year ? `${year}-${month}` : "";
}

/**
 * Upload Page component
 * Supports bulk file upload with per-file source type and month detection
 */
export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [defaultMonth, setDefaultMonth] = useState("");

  /**
   * Handles file selection from dropzone
   */
  const handleFilesAccepted = useCallback((accepted: File[]) => {
    const newEntries: FileEntry[] = accepted.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      sourceType: detectDataSource(file.name),
      reportMonth: detectMonthFromFilename(file.name),
      status: "pending" as FileStatus,
    }));
    setFiles((prev) => [...prev, ...newEntries]);
  }, []);

  /**
   * Updates a specific file entry field
   */
  const updateFile = useCallback((id: string, updates: Partial<FileEntry>) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  }, []);

  /**
   * Removes a file from the list
   */
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /**
   * Clears all files
   */
  const clearAll = useCallback(() => {
    setFiles([]);
  }, []);

  /**
   * Applies the default month to all files that don't have one
   */
  const applyDefaultMonth = useCallback(() => {
    if (!defaultMonth) return;
    setFiles((prev) =>
      prev.map((f) =>
        f.reportMonth ? f : { ...f, reportMonth: defaultMonth },
      ),
    );
  }, [defaultMonth]);

  /**
   * Uploads all pending files sequentially
   */
  const handleUploadAll = useCallback(async () => {
    const pending = files.filter((f) => f.status === "pending");
    if (pending.length === 0) return;

    setIsUploading(true);

    for (const entry of pending) {
      if (!entry.sourceType || !entry.reportMonth) {
        updateFile(entry.id, {
          status: "error",
          errorMessage: !entry.sourceType
            ? "Source type is required"
            : "Report month is required",
        });
        continue;
      }

      updateFile(entry.id, { status: "uploading" });

      try {
        const formData = new FormData();
        formData.append("file", entry.file);
        formData.append("sourceType", entry.sourceType);
        formData.append("reportMonth", entry.reportMonth);

        const response = await fetch(`${BASE_PATH}/api/upload`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          updateFile(entry.id, {
            status: "error",
            errorMessage: result.error || "Upload failed",
          });
        } else {
          updateFile(entry.id, {
            status: "success",
            rowCount: result.inserted,
          });
        }
      } catch (err) {
        updateFile(entry.id, {
          status: "error",
          errorMessage: err instanceof Error ? err.message : "Upload failed",
        });
      }
    }

    setIsUploading(false);
  }, [files, updateFile]);

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const canUpload =
    pendingCount > 0 &&
    !isUploading &&
    files
      .filter((f) => f.status === "pending")
      .every((f) => f.sourceType && f.reportMonth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="w-6 h-6" />
          Upload Data
        </h1>
        <p className="text-muted-foreground mt-1">
          Import marketing data from CSV files
        </p>
      </div>

      <Separator />

      {/* Dropzone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Files</CardTitle>
          <CardDescription>
            Drag and drop CSV files or click to browse. Source type and month
            are auto-detected from filenames.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dropzone
            onFilesAccepted={handleFilesAccepted}
            accept=".csv"
            maxSize={50 * 1024 * 1024}
            multiple
          />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Files ({files.length})
                </CardTitle>
                <CardDescription>
                  {pendingCount > 0 && `${pendingCount} pending`}
                  {successCount > 0 &&
                    `${pendingCount > 0 ? ", " : ""}${successCount} uploaded`}
                  {errorCount > 0 &&
                    `${pendingCount > 0 || successCount > 0 ? ", " : ""}${errorCount} failed`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/admin/uploads")}
                >
                  View History
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                  disabled={isUploading}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Default month for files missing it */}
            {files.some((f) => !f.reportMonth && f.status === "pending") && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
                <span className="text-muted-foreground whitespace-nowrap">
                  Apply month to undetected:
                </span>
                <input
                  type="month"
                  value={defaultMonth}
                  onChange={(e) => setDefaultMonth(e.target.value)}
                  className="border rounded px-2 py-1 text-sm bg-background"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={applyDefaultMonth}
                  disabled={!defaultMonth}
                >
                  Apply
                </Button>
              </div>
            )}

            {/* File entries */}
            <div className="space-y-2">
              {files.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-background"
                >
                  {/* Status icon */}
                  <div className="shrink-0">
                    {entry.status === "pending" && (
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    )}
                    {entry.status === "uploading" && (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    )}
                    {entry.status === "success" && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {entry.status === "error" && (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>

                  {/* Filename */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-medium truncate"
                      title={entry.file.name}
                    >
                      {entry.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(entry.file.size / 1024).toFixed(1)} KB
                      {entry.status === "success" && entry.rowCount != null && (
                        <span className="text-green-600 ml-2">
                          {entry.rowCount} rows uploaded
                        </span>
                      )}
                      {entry.status === "error" && entry.errorMessage && (
                        <span className="text-destructive ml-2">
                          {entry.errorMessage}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Source type selector */}
                  <select
                    value={entry.sourceType || ""}
                    onChange={(e) =>
                      updateFile(entry.id, {
                        sourceType: (e.target.value ||
                          null) as DataSource | null,
                      })
                    }
                    disabled={entry.status !== "pending"}
                    className="border rounded px-2 py-1 text-sm bg-background w-[240px] shrink-0"
                  >
                    <option value="">Select source...</option>
                    {DATA_SOURCES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>

                  {/* Month picker */}
                  <input
                    type="month"
                    value={entry.reportMonth}
                    onChange={(e) =>
                      updateFile(entry.id, { reportMonth: e.target.value })
                    }
                    disabled={entry.status !== "pending"}
                    className="border rounded px-2 py-1 text-sm bg-background w-[150px] shrink-0"
                  />

                  {/* Remove button */}
                  {entry.status === "pending" && (
                    <button
                      onClick={() => removeFile(entry.id)}
                      className="p-1 rounded hover:bg-muted transition-colors shrink-0"
                      type="button"
                      aria-label={`Remove ${entry.file.name}`}
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Upload button */}
            <div className="flex justify-end pt-2">
              <Button onClick={handleUploadAll} disabled={!canUpload}>
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload All ({pendingCount})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
