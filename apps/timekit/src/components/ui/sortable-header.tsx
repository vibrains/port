/**
 * Sortable Table Header Component
 * Reusable component for sortable column headers
 */

'use client';

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableHeaderProps<T extends string> {
  label: string;
  field: T;
  sortField: T | null;
  sortDirection: SortDirection;
  onSort: (field: T) => void;
  className?: string;
}

export function SortableHeader<T extends string>({
  label,
  field,
  sortField,
  sortDirection,
  onSort,
  className = '',
}: SortableHeaderProps<T>) {
  const isActive = sortField === field;

  return (
    <button
      onClick={() => onSort(field)}
      className={`group flex w-full items-center gap-1.5 px-4 py-3 text-left text-xs font-semibold tracking-[0.05em] uppercase transition-colors hover:bg-muted-foreground/10 ${className}`}
      type="button"
    >
      <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      {isActive && sortDirection === 'asc' && (
        <ChevronUp className="h-3.5 w-3.5 text-foreground" />
      )}
      {isActive && sortDirection === 'desc' && (
        <ChevronDown className="h-3.5 w-3.5 text-foreground" />
      )}
      {!isActive && (
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  );
}
