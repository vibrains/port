/**
 * Data Table Component
 * Frontend Lead Agent - Phase 4
 *
 * TanStack React Table wrapper with sorting, filtering, and CSV export
 */

'use client';

import { useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { Search, Download, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
  exportFilename?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = 'Search...',
  exportFilename = 'export.csv',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  // Export to CSV with loading state
  const exportToCSV = useCallback(async () => {
    const rows = table.getFilteredRowModel().rows;
    if (rows.length === 0) return;

    setIsExporting(true);

    // Use setTimeout to allow UI to update before processing
    await new Promise((resolve) => setTimeout(resolve, 0));

    try {
      // Get headers from columns
      const headers = columns
        .map((col) => {
          if ('header' in col && typeof col.header === 'string') {
            return col.header;
          }
          return '';
        })
        .filter(Boolean);

      // Get data rows
      const csvRows = rows.map((row) => {
        return columns
          .map((col) => {
            const cellValue = row.getValue(col.id as string);
            // Handle different value types
            if (cellValue === null || cellValue === undefined) return '';
            if (typeof cellValue === 'object') return JSON.stringify(cellValue);
            // Escape values containing commas or quotes
            const strValue = String(cellValue);
            if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
              return `"${strValue.replace(/"/g, '""')}"`;
            }
            return strValue;
          })
          .join(',');
      });

      // Combine headers and rows
      const csv = [headers.join(','), ...csvRows].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = exportFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  }, [table, columns, exportFilename]);

  const hasData = data.length > 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {searchColumn ? (
          <div className="relative max-w-sm flex-1">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(searchColumn)?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
        ) : (
          <div className="relative max-w-sm flex-1">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9"
            />
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          disabled={!hasData || isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <div>
          Showing {table.getFilteredRowModel().rows.length} of {data.length} rows
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
