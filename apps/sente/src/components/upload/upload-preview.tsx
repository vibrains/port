/**
 * Upload Preview Component
 * Component to preview CSV data before upload
 * @module components/upload/upload-preview
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { UploadValidationResult } from "@/lib/validators/upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

/**
 * Props for the UploadPreview component
 */
interface UploadPreviewProps {
  /** The file being previewed */
  file: File;
  /** Parsed CSV data */
  parsedData: {
    headers: string[];
    rows: Record<string, string>[];
    rowCount: number;
  };
  /** Validation result from the validator */
  validationResult: UploadValidationResult;
  /** Callback when user confirms upload */
  onConfirm: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * Upload Preview component for reviewing CSV data before upload
 * Shows file info, validation status, data preview table, and errors/warnings
 * 
 * @example
 * ```tsx
 * <UploadPreview
 *   file={selectedFile}
 *   parsedData={parsedData}
 *   validationResult={validation}
 *   onConfirm={handleUpload}
 *   onCancel={handleCancel}
 *   isUploading={isUploading}
 * />
 * ```
 */
export function UploadPreview({
  file,
  parsedData,
  validationResult,
  onConfirm,
  onCancel,
  isUploading,
  className,
}: UploadPreviewProps) {
  const [showAllRows, setShowAllRows] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState(true);
  const [expandedWarnings, setExpandedWarnings] = useState(true);

  const { valid, errors, warnings } = validationResult;
  const displayRows = showAllRows ? parsedData.rows : parsedData.rows.slice(0, 5);
  const hasMoreRows = parsedData.rows.length > 5;

  /**
   * Formats a file size in bytes to a human-readable string
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* File Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            File Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Filename:</span>
              <p className="font-medium truncate">{file.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Size:</span>
              <p className="font-medium">{formatFileSize(file.size)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Total Rows:</span>
              <p className="font-medium">{parsedData.rowCount.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Columns:</span>
              <p className="font-medium">{parsedData.headers.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {valid ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                Validation Passed
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-destructive" />
                Validation Failed
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setExpandedErrors(!expandedErrors)}
                className="flex items-center gap-2 text-sm font-medium text-destructive hover:opacity-80 transition-opacity"
                type="button"
              >
                {expandedErrors ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
                <AlertCircle className="w-4 h-4" />
                {errors.length} Error{errors.length !== 1 ? "s" : ""}
              </button>
              {expandedErrors && (
                <div className="space-y-2 pl-6">
                  {errors.map((error, index) => (
                    <Alert key={index} variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">
                        {error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setExpandedWarnings(!expandedWarnings)}
                className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:opacity-80 transition-opacity"
                type="button"
              >
                {expandedWarnings ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
                <AlertTriangle className="w-4 h-4" />
                {warnings.length} Warning{warnings.length !== 1 ? "s" : ""}
              </button>
              {expandedWarnings && (
                <div className="space-y-2 pl-6">
                  {warnings.map((warning, index) => (
                    <Alert
                      key={index}
                      className="py-2 border-amber-500/50 bg-amber-500/10"
                    >
                      <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
                        {warning}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          )}

          {valid && errors.length === 0 && warnings.length === 0 && (
            <p className="text-sm text-green-600 dark:text-green-400">
              File looks good! Ready to upload.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Data Preview */}
      {valid && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Data Preview</CardTitle>
              <Badge variant="secondary" className="text-xs">
                First {displayRows.length} of {parsedData.rowCount} rows
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {parsedData.headers.map((header) => (
                      <TableHead
                        key={header}
                        className="text-xs whitespace-nowrap min-w-[100px]"
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {parsedData.headers.map((header) => (
                        <TableCell
                          key={`${rowIndex}-${header}`}
                          className="text-xs max-w-[200px] truncate"
                          title={row[header]}
                        >
                          {row[header] || "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {hasMoreRows && (
              <button
                onClick={() => setShowAllRows(!showAllRows)}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                type="button"
              >
                {showAllRows
                  ? "Show less"
                  : `Show all ${parsedData.rowCount} rows`}
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
          type="button"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={!valid || isUploading}
          type="button"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            "Confirm Upload"
          )}
        </Button>
      </div>
    </div>
  );
}
