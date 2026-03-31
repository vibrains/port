/**
 * Status Badge Component
 * Badge component for upload statuses with appropriate colors and icons
 * @module components/upload/status-badge
 */

"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

/**
 * Upload status values
 */
export type UploadStatus = "processing" | "completed" | "failed" | "partial";

/**
 * Props for the StatusBadge component
 */
interface StatusBadgeProps {
  /** The upload status */
  status: UploadStatus;
  /** Optional size variant */
  size?: "sm" | "default" | "lg";
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Optional className for styling */
  className?: string;
}

/**
 * Status configuration with colors and icons
 */
const STATUS_CONFIG: Record<
  UploadStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ReactNode;
    className: string;
  }
> = {
  processing: {
    label: "Processing",
    variant: "secondary",
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
    className: "bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20",
  },
  completed: {
    label: "Completed",
    variant: "default",
    icon: <CheckCircle className="w-3 h-3" />,
    className: "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20",
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: <XCircle className="w-3 h-3" />,
    className: "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20",
  },
  partial: {
    label: "Partial",
    variant: "secondary",
    icon: <AlertCircle className="w-3 h-3" />,
    className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 hover:bg-yellow-500/20",
  },
};

/**
 * Size configuration for the badge
 */
const SIZE_CONFIG = {
  sm: "text-[10px] px-1.5 py-0 h-5",
  default: "text-xs px-2.5 py-0.5 h-6",
  lg: "text-sm px-3 py-1 h-7",
};

/**
 * Status Badge component for displaying upload statuses
 * Shows appropriate color, icon, and label based on status
 * 
 * @example
 * ```tsx
 * <StatusBadge status="completed" />
 * <StatusBadge status="processing" size="lg" showIcon={false} />
 * ```
 */
export function StatusBadge({
  status,
  size = "default",
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClasses = SIZE_CONFIG[size];

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "inline-flex items-center gap-1 font-medium border",
        sizeClasses,
        config.className,
        className
      )}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}

/**
 * Extended status badge with tooltip/description
 */
interface StatusBadgeWithDescriptionProps extends StatusBadgeProps {
  /** Description to show alongside the badge */
  description?: string;
}

/**
 * Status badge with optional description text
 */
export function StatusBadgeWithDescription({
  status,
  description,
  ...badgeProps
}: StatusBadgeWithDescriptionProps) {
  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={status} {...badgeProps} />
      {description && (
        <span className="text-xs text-muted-foreground">{description}</span>
      )}
    </div>
  );
}

/**
 * Status dot indicator (minimal variant)
 */
interface StatusDotProps {
  status: UploadStatus;
  className?: string;
}

/**
 * Minimal status indicator using just a colored dot
 */
export function StatusDot({ status, className }: StatusDotProps) {
  const dotColors = {
    processing: "bg-amber-500",
    completed: "bg-green-500",
    failed: "bg-red-500",
    partial: "bg-yellow-500",
  };

  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full",
        status === "processing" && "animate-pulse",
        dotColors[status],
        className
      )}
    />
  );
}
