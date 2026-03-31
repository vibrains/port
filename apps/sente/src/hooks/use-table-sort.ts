/**
 * useTableSort Hook
 * A custom hook for managing table sort state
 * @module hooks/use-table-sort
 */

"use client";

import { useState, useCallback } from "react";

/**
 * Sort direction type
 */
type SortDirection = "asc" | "desc";

/**
 * Sort state interface
 */
interface SortState {
  /** The column key being sorted */
  column: string;
  /** The sort direction */
  direction: SortDirection;
}

/**
 * Options for the useTableSort hook
 */
interface UseTableSortOptions {
  /** Default sort configuration */
  defaultSort?: SortState;
  /** Callback when sort changes */
  onSort?: (sort: SortState | undefined) => void;
  /** Whether to support multi-column sort (future enhancement) */
  multiColumn?: boolean;
}

/**
 * Return type for the useTableSort hook
 */
interface UseTableSortReturn {
  /** Current sort state */
  sort: SortState | undefined;
  /** Toggle sort for a column */
  toggleSort: (column: string) => void;
  /** Set sort explicitly */
  setSort: (sort: SortState | undefined) => void;
  /** Get sort direction for a column */
  getSortDirection: (column: string) => SortDirection | undefined;
  /** Check if a column is currently sorted */
  isSorted: (column: string) => boolean;
  /** Clear all sorting */
  clearSort: () => void;
  /** Sort indicator for UI (1-based index for multi-sort) */
  getSortIndex: (column: string) => number | undefined;
}

/**
 * Sorts data array based on current sort state
 */
function sortData<T>(
  data: T[],
  sort: SortState | undefined,
  getValue?: (item: T, column: string) => unknown
): T[] {
  if (!sort) return data;

  return [...data].sort((a, b) => {
    let aValue: unknown;
    let bValue: unknown;

    if (getValue) {
      aValue = getValue(a, sort.column);
      bValue = getValue(b, sort.column);
    } else {
      aValue = (a as Record<string, unknown>)[sort.column];
      bValue = (b as Record<string, unknown>)[sort.column];
    }

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return sort.direction === "asc" ? -1 : 1;
    if (bValue == null) return sort.direction === "asc" ? 1 : -1;

    // Compare values
    if (typeof aValue === "string" && typeof bValue === "string") {
      const comparison = aValue.localeCompare(bValue);
      return sort.direction === "asc" ? comparison : -comparison;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sort.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      const comparison = aValue.getTime() - bValue.getTime();
      return sort.direction === "asc" ? comparison : -comparison;
    }

    // Fallback to string comparison
    const aString = String(aValue);
    const bString = String(bValue);
    const comparison = aString.localeCompare(bString);
    return sort.direction === "asc" ? comparison : -comparison;
  });
}

/**
 * useTableSort hook provides state management for table column sorting.
 * Supports toggling between asc/desc/unsorted states.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { sort, toggleSort, getSortDirection } = useTableSort({
 *   defaultSort: { column: "name", direction: "asc" },
 * });
 *
 * // With sort callback
 * const { sort, toggleSort } = useTableSort({
 *   onSort: (newSort) => console.log("Sort changed:", newSort),
 * });
 *
 * // In table header
 * <TableHead onClick={() => toggleSort("name")}>
 *   Name
 *   {getSortDirection("name") === "asc" && <ArrowUpIcon />}
 *   {getSortDirection("name") === "desc" && <ArrowDownIcon />}
 * </TableHead>
 *
 * // Sort data
 * const sortedData = useMemo(() => {
 *   return sortData(data, sort);
 * }, [data, sort]);
 * ```
 */
export function useTableSort(
  options: UseTableSortOptions = {}
): UseTableSortReturn {
  const { defaultSort, onSort } = options;

  const [sort, setSortState] = useState<SortState | undefined>(defaultSort);

  // Wrap setSort to call onChange callback
  const setSort = useCallback(
    (newSort: SortState | undefined) => {
      setSortState(newSort);
      onSort?.(newSort);
    },
    [onSort]
  );

  // Toggle sort for a column
  const toggleSort = useCallback(
    (column: string) => {
      setSortState((prev: SortState | undefined) => {
        // If clicking the same column
        if (prev?.column === column) {
          // Cycle: asc -> desc -> undefined
          if (prev.direction === "asc") {
            const newSort: SortState = { column, direction: "desc" };
            onSort?.(newSort);
            return newSort;
          }
          // Remove sort
          onSort?.(undefined);
          return undefined;
        }
        // New column, start with asc
        const newSort: SortState = { column, direction: "asc" };
        onSort?.(newSort);
        return newSort;
      });
    },
    [onSort]
  );

  // Get sort direction for a column
  const getSortDirection = useCallback(
    (column: string): SortDirection | undefined => {
      return sort?.column === column ? sort.direction : undefined;
    },
    [sort]
  );

  // Check if a column is sorted
  const isSorted = useCallback(
    (column: string): boolean => {
      return sort?.column === column;
    },
    [sort]
  );

  // Clear all sorting
  const clearSort = useCallback(() => {
    setSort(undefined);
  }, [setSort]);

  // Get sort index (for multi-column sort display)
  const getSortIndex = useCallback(
    (column: string): number | undefined => {
      // Currently only single sort is supported
      return sort?.column === column ? 1 : undefined;
    },
    [sort]
  );

  return {
    sort,
    toggleSort,
    setSort,
    getSortDirection,
    isSorted,
    clearSort,
    getSortIndex,
  };
}

export type {
  SortDirection,
  SortState,
  UseTableSortOptions,
  UseTableSortReturn,
};
export { sortData };
