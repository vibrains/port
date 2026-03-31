'use client'

import { Fragment, useState } from 'react'
import {
  ColumnDef,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
  ColumnFiltersState,
  Row,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Input } from './input'
import { Button } from './button'
import { ChevronRight, Download, Search } from 'lucide-react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchColumn?: string
  searchPlaceholder?: string
  exportFilename?: string
  renderSubRow?: (row: TData) => React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = 'Search...',
  exportFilename,
  renderSubRow,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(renderSubRow ? { getExpandedRowModel: getExpandedRowModel() } : {}),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    ...(renderSubRow ? { onExpandedChange: setExpanded } : {}),
    state: {
      sorting,
      columnFilters,
      ...(renderSubRow ? { expanded } : {}),
    },
  })

  const handleExport = () => {
    if (!exportFilename) return

    const headers = columns
      .map((col) => {
        if ('accessorKey' in col) {
          return String(col.accessorKey)
        }
        return col.id || ''
      })
      .filter(Boolean)

    const rows = table.getFilteredRowModel().rows.map((row) => {
      return headers.map((header) => {
        const value = (row.original as Record<string, unknown>)[header]
        return typeof value === 'number' ? value.toFixed(2) : String(value ?? '')
      })
    })

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportFilename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {searchColumn && (
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(searchColumn)?.setFilterValue(event.target.value)
              }
              className="pl-8 max-w-sm"
            />
          </div>
        )}
        {exportFilename && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>
      <div className="rounded-md border">
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
                <Fragment key={row.id}>
                  <TableRow
                    data-state={row.getIsSelected() && 'selected'}
                    className={renderSubRow ? 'cursor-pointer hover:bg-muted/50' : undefined}
                    onClick={renderSubRow ? () => row.toggleExpanded() : undefined}
                  >
                    {row.getVisibleCells().map((cell, i) => (
                      <TableCell key={cell.id}>
                        {i === 0 && renderSubRow ? (
                          <div className="flex items-center gap-1">
                            <ChevronRight
                              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${row.getIsExpanded() ? 'rotate-90' : ''}`}
                            />
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {renderSubRow && row.getIsExpanded() && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={columns.length} className="p-0">
                        {renderSubRow(row.original)}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-sm text-muted-foreground">
        Showing {table.getFilteredRowModel().rows.length} of {data.length} entries
      </div>
    </div>
  )
}
