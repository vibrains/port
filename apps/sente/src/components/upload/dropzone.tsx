/**
 * Dropzone Component
 * Drag-and-drop file upload component with validation
 * @module components/upload/dropzone
 */

"use client";

import { useCallback, useState } from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the Dropzone component
 */
interface DropzoneProps {
  /** Callback when files are accepted */
  onFilesAccepted: (files: File[]) => void;
  /** Accepted file types (MIME types or extensions) */
  accept?: string;
  /** Maximum file size in bytes (default: 50MB) */
  maxSize?: number;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Whether the dropzone is disabled */
  disabled?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * Dropzone component for drag-and-drop file uploads
 * Supports click-to-select and drag-and-drop interactions
 * 
 * @example
 * ```tsx
 * <Dropzone
 *   onFilesAccepted={(files) => console.log(files)}
 *   accept=".csv"
 *   maxSize={50 * 1024 * 1024}
 * />
 * ```
 */
export function Dropzone({
  onFilesAccepted,
  accept = ".csv",
  maxSize = 50 * 1024 * 1024,
  multiple = false,
  disabled = false,
  className,
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validates a file against size and type constraints
   */
  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxSize) {
        return `File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`;
      }

      // Check file type (if accept is specified)
      if (accept) {
        const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase());
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const isAccepted = acceptedTypes.some((type) => {
          if (type.startsWith(".")) {
            return fileExtension === type;
          }
          return file.type === type || file.type.startsWith(type.replace("/*", "/"));
        });

        if (!isAccepted) {
          return `File "${file.name}" is not a supported type. Accepted: ${accept}`;
        }
      }

      return null;
    },
    [accept, maxSize]
  );

  /**
   * Handles file selection from input or drop
   */
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setError(null);
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(validationError);
        } else {
          validFiles.push(file);
        }
      }

      if (errors.length > 0) {
        setError(errors.join("\n"));
      }

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
        onFilesAccepted(validFiles);
      }
    },
    [onFilesAccepted, validateFile]
  );

  /**
   * Handles drag over event
   */
  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  /**
   * Handles drag leave event
   */
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  /**
   * Handles drop event
   */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (!disabled) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles]
  );

  /**
   * Handles file input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  /**
   * Clears selected files
   */
  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setError(null);
  }, []);

  /**
   * Removes a specific file from selection
   */
  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Dropzone Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center w-full min-h-[200px] p-6",
          "border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
          "hover:border-primary/50 hover:bg-muted/50",
          isDragOver && "border-primary bg-primary/5 scale-[1.02]",
          disabled && "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent",
          error && "border-destructive bg-destructive/5",
          !isDragOver && !error && !disabled && "border-border bg-muted/30"
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload file"
        />

        <div className="flex flex-col items-center justify-center space-y-4 text-center pointer-events-none">
          <div
            className={cn(
              "p-4 rounded-full transition-colors duration-200",
              isDragOver ? "bg-primary/10" : "bg-muted",
              error && "bg-destructive/10"
            )}
          >
            <Upload
              className={cn(
                "w-8 h-8 transition-colors duration-200",
                isDragOver ? "text-primary" : "text-muted-foreground",
                error && "text-destructive"
              )}
            />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">
              {isDragOver ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-muted-foreground">
              or click to browse files
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>Supported: {accept || "All files"}</p>
            <p>Max size: {formatFileSize(maxSize)}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 text-sm rounded-md bg-destructive/10 text-destructive">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="whitespace-pre-line">{error}</span>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Selected files</p>
            <button
              onClick={clearFiles}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 rounded-md bg-muted border"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <File className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 rounded-md hover:bg-muted-foreground/10 transition-colors shrink-0"
                  type="button"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Formats a file size in bytes to a human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
