/**
 * Progress Indicator Component
 * Visual feedback for upload progress and status
 * @module components/upload/progress-indicator
 */

"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  XCircle,
  FileSearch,
  Upload,
  Database,
  AlertCircle,
} from "lucide-react";

/**
 * Upload status types
 */
export type UploadStatus =
  | "idle"
  | "validating"
  | "parsing"
  | "uploading"
  | "processing"
  | "completed"
  | "error";

/**
 * Props for the ProgressIndicator component
 */
interface ProgressIndicatorProps {
  /** Current progress percentage (0-100) */
  progress: number;
  /** Current status of the upload */
  status: UploadStatus;
  /** Optional status message */
  message?: string;
  /** Array of error messages */
  errors?: string[];
  /** Optional className for styling */
  className?: string;
}

/**
 * Status configuration with icons and labels
 */
const STATUS_CONFIG: Record<
  UploadStatus,
  { icon: React.ReactNode; label: string; color: string }
> = {
  idle: {
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    label: "Ready",
    color: "text-muted-foreground",
  },
  validating: {
    icon: <FileSearch className="w-5 h-5 animate-pulse" />,
    label: "Validating file...",
    color: "text-blue-500",
  },
  parsing: {
    icon: <FileSearch className="w-5 h-5 animate-pulse" />,
    label: "Parsing CSV...",
    color: "text-blue-500",
  },
  uploading: {
    icon: <Upload className="w-5 h-5 animate-bounce" />,
    label: "Uploading...",
    color: "text-primary",
  },
  processing: {
    icon: <Database className="w-5 h-5 animate-pulse" />,
    label: "Processing data...",
    color: "text-amber-500",
  },
  completed: {
    icon: <CheckCircle className="w-5 h-5" />,
    label: "Upload complete!",
    color: "text-green-500",
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    label: "Upload failed",
    color: "text-destructive",
  },
};

/**
 * Progress Indicator component for upload feedback
 * Shows progress bar, status icon, and error messages
 * 
 * @example
 * ```tsx
 * <ProgressIndicator
 *   progress={75}
 *   status="uploading"
 *   message="Uploading file..."
 * />
 * ```
 */
export function ProgressIndicator({
  progress,
  status,
  message,
  errors = [],
  className,
}: ProgressIndicatorProps) {
  const config = STATUS_CONFIG[status];
  const isComplete = status === "completed";
  const hasError = status === "error";
  const isActive = status !== "idle" && status !== "completed" && status !== "error";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Status Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full",
            isComplete && "bg-green-500/10",
            hasError && "bg-destructive/10",
            isActive && "bg-primary/10",
            status === "idle" && "bg-muted"
          )}
        >
          <span className={config.color}>{config.icon}</span>
        </div>
        <div className="flex-1">
          <p className={cn("font-medium", config.color)}>
            {message || config.label}
          </p>
          <p className="text-xs text-muted-foreground">
            {isActive && `${Math.round(progress)}% complete`}
            {isComplete && "Your data has been successfully imported"}
            {hasError && "Please check the errors below and try again"}
            {status === "idle" && "Waiting to start..."}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress
          value={progress}
          className={cn(
            "h-2 transition-all duration-300",
            isComplete && "bg-green-500/20",
            hasError && "bg-destructive/20"
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between pt-2">
        {[
          { key: "validating", label: "Validate" },
          { key: "parsing", label: "Parse" },
          { key: "uploading", label: "Upload" },
          { key: "processing", label: "Process" },
        ].map((step, index) => {
          const stepStatus = getStepStatus(status, step.key as UploadStatus);
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors duration-300",
                    stepStatus === "completed" && "bg-green-500",
                    stepStatus === "active" && "bg-primary animate-pulse",
                    stepStatus === "pending" && "bg-muted-foreground/30"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] transition-colors duration-300",
                    stepStatus === "completed" && "text-green-600",
                    stepStatus === "active" && "text-primary font-medium",
                    stepStatus === "pending" && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < 3 && (
                <div
                  className={cn(
                    "w-8 sm:w-12 h-0.5 mx-1 transition-colors duration-300",
                    stepStatus === "completed" ? "bg-green-500/50" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2 pt-2">
          {errors.map((error, index) => (
            <Alert key={index} variant="destructive" className="py-3">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle className="text-sm">Error</AlertTitle>
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Gets the status of a specific step in the upload process
 */
function getStepStatus(
  currentStatus: UploadStatus,
  stepStatus: UploadStatus
): "completed" | "active" | "pending" {
  const statusOrder: UploadStatus[] = [
    "idle",
    "validating",
    "parsing",
    "uploading",
    "processing",
    "completed",
    "error",
  ];

  const currentIndex = statusOrder.indexOf(currentStatus);
  const stepIndex = statusOrder.indexOf(stepStatus);

  if (currentStatus === "completed" || stepIndex < currentIndex) {
    return "completed";
  }

  if (stepIndex === currentIndex) {
    return "active";
  }

  return "pending";
}

/**
 * Success state component for completed uploads
 */
interface UploadSuccessProps {
  /** Number of rows uploaded */
  rowCount: number;
  /** Optional message */
  message?: string;
  /** Callback to upload another file */
  onUploadAnother?: () => void;
  /** Callback to view history */
  onViewHistory?: () => void;
  className?: string;
}

/**
 * Success display component for completed uploads
 */
export function UploadSuccess({
  rowCount,
  message,
  onUploadAnother,
  onViewHistory,
  className,
}: UploadSuccessProps) {
  return (
    <div className={cn("text-center space-y-6 py-8", className)}>
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
          Upload Successful!
        </h3>
        <p className="text-muted-foreground">
          {message || `Successfully imported ${rowCount.toLocaleString()} rows of data.`}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        {onUploadAnother && (
          <button
            onClick={onUploadAnother}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            type="button"
          >
            Upload Another File
          </button>
        )}
        {onViewHistory && (
          <button
            onClick={onViewHistory}
            className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-muted transition-colors"
            type="button"
          >
            View Upload History
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Error state component for failed uploads
 */
interface UploadErrorProps {
  /** Error message */
  message: string;
  /** Callback to retry */
  onRetry?: () => void;
  /** Callback to go back */
  onBack?: () => void;
  className?: string;
}

/**
 * Error display component for failed uploads
 */
export function UploadError({
  message,
  onRetry,
  onBack,
  className,
}: UploadErrorProps) {
  return (
    <div className={cn("text-center space-y-6 py-8", className)}>
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-destructive" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-destructive">Upload Failed</h3>
        <p className="text-muted-foreground max-w-md mx-auto">{message}</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            type="button"
          >
            Try Again
          </button>
        )}
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-muted transition-colors"
            type="button"
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
}
