/**
 * useFilters Hook
 * A custom hook for managing filter state with URL persistence support
 * @module hooks/use-filters
 */

"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

/**
 * Filter state interface
 */
interface Filters {
  /** Date range filter */
  dateRange?: { from: Date; to: Date };
  /** Source/channel filter */
  sources?: string[];
  /** Social network filter */
  networks?: string[];
  /** Search query filter */
  search?: string;
  /** Generic key-value filters */
  [key: string]: unknown;
}

/**
 * Options for the useFilters hook
 */
interface UseFiltersOptions {
  /** Initial filter values */
  initialFilters?: Partial<Filters>;
  /** Whether to sync with URL query params (default: false) */
  syncWithUrl?: boolean;
  /** Callback when filters change */
  onChange?: (filters: Filters) => void;
  /** Debounce delay in ms for URL updates (default: 300) */
  debounceMs?: number;
}

/**
 * Return type for the useFilters hook
 */
interface UseFiltersReturn {
  /** Current filter values */
  filters: Filters;
  /** Update a specific filter key */
  updateFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  /** Update multiple filters at once */
  updateFilters: (newFilters: Partial<Filters>) => void;
  /** Reset all filters to initial values */
  resetFilters: () => void;
  /** Reset a specific filter key */
  resetFilter: (key: keyof Filters) => void;
  /** Check if any filters are active */
  hasActiveFilters: boolean;
  /** Get count of active filters */
  activeFilterCount: number;
  /** Check if a specific filter is active */
  isFilterActive: (key: keyof Filters) => boolean;
}

/**
 * Serializes filter state to URL query params
 */
function filtersToParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === "dateRange" && value) {
      const range = value as { from: Date; to: Date };
      params.set("from", range.from.toISOString());
      params.set("to", range.to.toISOString());
    } else if (Array.isArray(value) && value.length > 0) {
      params.set(key, value.join(","));
    } else if (typeof value === "string" && value) {
      params.set(key, value);
    }
  });

  return params;
}

/**
 * Parses URL query params to filter state
 */
function paramsToFilters(params: URLSearchParams): Partial<Filters> {
  const filters: Partial<Filters> = {};

  // Parse date range
  const from = params.get("from");
  const to = params.get("to");
  if (from && to) {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
      filters.dateRange = { from: fromDate, to: toDate };
    }
  }

  // Parse sources
  const sources = params.get("sources");
  if (sources) {
    filters.sources = sources.split(",").filter(Boolean);
  }

  // Parse networks
  const networks = params.get("networks");
  if (networks) {
    filters.networks = networks.split(",").filter(Boolean);
  }

  // Parse search
  const search = params.get("search");
  if (search) {
    filters.search = search;
  }

  return filters;
}

/**
 * Checks if a filter value is considered "active"
 */
function isActiveValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

/**
 * useFilters hook provides state management for filter controls.
 * Supports URL persistence and batch updates.
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { filters, updateFilter, resetFilters } = useFilters({
 *   initialFilters: { sources: ["email"] },
 * });
 *
 * // With URL sync
 * const { filters, updateFilter } = useFilters({
 *   syncWithUrl: true,
 * });
 *
 * // Update a filter
 * updateFilter("sources", ["email", "social"]);
 *
 * // Update multiple filters
 * updateFilters({ sources: [], networks: ["facebook"] });
 *
 * // Check if filters are active
 * if (hasActiveFilters) {
 *   console.log(`${activeFilterCount} filters active`);
 * }
 * ```
 */
export function useFilters(options: UseFiltersOptions = {}): UseFiltersReturn {
  const {
    initialFilters = {},
    syncWithUrl = false,
    onChange,
    debounceMs = 300,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize state from URL if sync is enabled
  const getInitialState = useCallback((): Filters => {
    if (syncWithUrl && searchParams) {
      const urlFilters = paramsToFilters(searchParams);
      return { ...initialFilters, ...urlFilters };
    }
    return initialFilters;
  }, [initialFilters, syncWithUrl, searchParams]);

  const [filters, setFilters] = useState<Filters>(getInitialState);

  // Sync with URL on mount and when URL changes
  useEffect(() => {
    if (syncWithUrl && searchParams) {
      const urlFilters = paramsToFilters(searchParams);
      setFilters((prev) => ({ ...prev, ...urlFilters }));
    }
  }, [syncWithUrl, searchParams]);

  // Debounced URL update
  useEffect(() => {
    if (!syncWithUrl) return;

    const timeoutId = setTimeout(() => {
      const params = filtersToParams(filters);
      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(url, { scroll: false });
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [filters, syncWithUrl, pathname, router, debounceMs]);

  // Update a single filter
  const updateFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      setFilters((prev) => {
        const newFilters = { ...prev, [key]: value };
        onChange?.(newFilters);
        return newFilters;
      });
    },
    [onChange]
  );

  // Update multiple filters
  const updateFilters = useCallback(
    (newFilters: Partial<Filters>) => {
      setFilters((prev) => {
        const merged = { ...prev, ...newFilters };
        onChange?.(merged);
        return merged;
      });
    },
    [onChange]
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    onChange?.(initialFilters);
  }, [initialFilters, onChange]);

  // Reset a specific filter
  const resetFilter = useCallback(
    (key: keyof Filters) => {
      setFilters((prev) => {
        const newFilters = { ...prev };
        delete newFilters[key];
        onChange?.(newFilters);
        return newFilters;
      });
    },
    [onChange]
  );

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(isActiveValue);
  }, [filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(isActiveValue).length;
  }, [filters]);

  // Check if specific filter is active
  const isFilterActive = useCallback(
    (key: keyof Filters) => {
      return isActiveValue(filters[key]);
    },
    [filters]
  );

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    resetFilter,
    hasActiveFilters,
    activeFilterCount,
    isFilterActive,
  };
}

export type { Filters, UseFiltersOptions, UseFiltersReturn };
