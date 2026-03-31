/**
 * Table Sort Hook
 * Reusable hook for managing table sorting state and logic
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SortDirection } from '@/components/ui/sortable-header';

export function useTableSort<T, K extends keyof T>(data: T[]) {
  const [sortField, setSortField] = useState<K | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = useCallback((field: K) => {
    setSortField((currentField) => {
      if (currentField === field) {
        // Cycle: asc -> desc -> null
        setSortDirection((currentDirection) => {
          if (currentDirection === 'asc') {
            return 'desc';
          } else if (currentDirection === 'desc') {
            setSortField(null);
            return null;
          }
          return 'asc';
        });
        return currentField;
      } else {
        setSortDirection('asc');
        return field;
      }
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null/undefined values (put them at the end)
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      // String comparison (case-insensitive)
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase() as T[K];
        bVal = bVal.toLowerCase() as T[K];
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection]);

  return {
    sortField,
    sortDirection,
    handleSort,
    sortedData,
  };
}
