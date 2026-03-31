/**
 * Filter Bar Component
 * A container component for organizing filter controls
 * @module components/filters/filter-bar
 */

"use client";

import * as React from "react";
import { X, Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Props for the FilterBar component
 */
interface FilterBarProps {
  /** Filter components to render inside the bar */
  children: React.ReactNode;
  /** Callback when reset button is clicked */
  onReset?: () => void;
  /** Whether to show the reset button (default: true when onReset is provided) */
  showReset?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Optional title for the filter bar */
  title?: string;
  /** Whether to show the filter icon (default: true) */
  showIcon?: boolean;
  /** Optional count of active filters */
  activeFilterCount?: number;
}

/**
 * FilterBar component provides a consistent container for filter controls.
 * Includes a reset button and optional title/icon.
 *
 * @example
 * ```tsx
 * <FilterBar onReset={handleReset} activeFilterCount={3}>
 *   <DateRangeFilter value={dateRange} onChange={setDateRange} />
 *   <SourceFilter value={sources} onChange={setSources} />
 *   <NetworkFilter value={networks} onChange={setNetworks} />
 * </FilterBar>
 *
 * // With custom styling
 * <FilterBar
 *   onReset={handleReset}
 *   title="Filters"
 *   className="bg-muted"
 * >
 *   {...}
 * </FilterBar>
 * ```
 */
export function FilterBar({
  children,
  onReset,
  showReset,
  className,
  title,
  showIcon = true,
  activeFilterCount,
}: FilterBarProps) {
  // Default showReset to true if onReset is provided
  const shouldShowReset = showReset ?? !!onReset;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 p-4 border rounded-lg bg-card",
        className
      )}
    >
      {/* Optional icon and title */}
      {(showIcon || title) && (
        <div className="flex items-center gap-2 text-muted-foreground">
          {showIcon && <Filter className="h-4 w-4" />}
          {title && <span className="text-sm font-medium">{title}</span>}
          {activeFilterCount !== undefined && activeFilterCount > 0 && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </div>
      )}

      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-4 flex-1">
        {children}
      </div>

      {/* Reset button */}
      {shouldShowReset && onReset && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="ml-auto"
        >
          <X className="mr-2 h-4 w-4" />
          Reset
        </Button>
      )}
    </div>
  );
}

/**
 * Props for the FilterGroup component
 */
interface FilterGroupProps {
  /** Label for this filter group */
  label: string;
  /** Filter components in this group */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FilterGroup component for grouping related filters with a label.
 *
 * @example
 * ```tsx
 * <FilterGroup label="Date Range">
 *   <DateRangeFilter value={dateRange} onChange={setDateRange} />
 * </FilterGroup>
 * ```
 */
export function FilterGroup({
  label,
  children,
  className,
}: FilterGroupProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

/**
 * Props for the FilterDivider component
 */
interface FilterDividerProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * FilterDivider component for visually separating filter groups.
 *
 * @example
 * ```tsx
 * <FilterBar>
 *   <DateRangeFilter />
 *   <FilterDivider />
 *   <SourceFilter />
 * </FilterBar>
 * ```
 */
export function FilterDivider({ className }: FilterDividerProps) {
  return (
    <div
      className={cn("h-8 w-px bg-border", className)}
      role="separator"
      aria-orientation="vertical"
    />
  );
}

export type { FilterBarProps, FilterGroupProps, FilterDividerProps };
