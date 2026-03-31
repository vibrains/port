'use client'

import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@ndos/ui'
import { Badge, Button } from '@ndos/ui'
import { ArrowUpDown } from 'lucide-react'
import type { ClientData, PersonClientData } from '@/types/dashboard'

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(num)
}

const formatCurrency = (num: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num)
}

const columns: ColumnDef<ClientData>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Client
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{row.original.name}</span>
        {row.original.isInternal && (
          <Badge variant="secondary" className="text-xs">Internal</Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'totalHours',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Total Hours
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{formatNumber(row.original.totalHours)}</span>
    ),
  },
  {
    accessorKey: 'billableHours',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Billable
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-green-600">{formatNumber(row.original.billableHours)}</span>
    ),
  },
  {
    accessorKey: 'gapHours',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Non-Billable
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-amber-600">{formatNumber(row.original.gapHours)}</span>
    ),
  },
  {
    accessorKey: 'internalHours',
    header: 'Internal',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{formatNumber(row.original.internalHours)}</span>
    ),
  },
  {
    accessorKey: 'billablePercent',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Billable %
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const percent = row.original.billablePercent
      const color = percent >= 70 ? 'text-green-600' : percent >= 50 ? 'text-amber-600' : 'text-red-600'
      return <span className={color}>{percent.toFixed(1)}%</span>
    },
  },
  {
    accessorKey: 'totalDollars',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="-ml-4"
      >
        Total $
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {formatCurrency(row.original.totalDollars)}
        {row.original.hasEstimatedRates && (
          <span className="text-amber-500 ml-0.5" title="Includes hours valued at estimated $150/hr rate">*</span>
        )}
      </span>
    ),
  },
]

interface ClientsTableProps {
  data: ClientData[]
  personClientData: PersonClientData[]
}

export function ClientsTable({ data, personClientData }: ClientsTableProps) {
  const hasAnyEstimated = data.some((d) => d.hasEstimatedRates)

  // Group person-client data by clientId for sub-row lookup
  const personsByClient = useMemo(() => {
    const map = new Map<string, PersonClientData[]>()
    for (const pc of personClientData) {
      const list = map.get(pc.clientId) || []
      list.push(pc)
      map.set(pc.clientId, list)
    }
    // Sort each client's users by totalHours descending
    for (const list of map.values()) {
      list.sort((a, b) => b.totalHours - a.totalHours)
    }
    return map
  }, [personClientData])

  const renderSubRow = (client: ClientData) => {
    const people = personsByClient.get(client.id) || []
    if (people.length === 0) {
      return (
        <div className="pl-12 py-4 text-sm text-muted-foreground">
          No user breakdown available
        </div>
      )
    }

    return (
      <div className="px-10 py-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th className="text-left font-medium py-1.5 pr-4">User</th>
              <th className="text-left font-medium py-1.5 pr-4">Total Hours</th>
              <th className="text-left font-medium py-1.5 pr-4">Billable</th>
              <th className="text-left font-medium py-1.5 pr-4">Non-Billable</th>
              <th className="text-left font-medium py-1.5 pr-4">Billable %</th>
              <th className="text-right font-medium py-1.5">Total $</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => {
              const billablePercent = p.totalHours > 0
                ? (p.billableHours / p.totalHours) * 100
                : 0
              const percentColor = billablePercent >= 70 ? 'text-green-600' : billablePercent >= 50 ? 'text-amber-600' : 'text-red-600'

              return (
                <tr key={p.personId} className="border-t border-border/50">
                  <td className="py-1.5 pr-4 font-medium">{p.personName}</td>
                  <td className="py-1.5 pr-4">{formatNumber(p.totalHours)}</td>
                  <td className="py-1.5 pr-4 text-green-600">{formatNumber(p.billableHours)}</td>
                  <td className="py-1.5 pr-4 text-amber-600">{formatNumber(p.gapHours)}</td>
                  <td className={`py-1.5 pr-4 ${percentColor}`}>{billablePercent.toFixed(1)}%</td>
                  <td className="py-1.5 text-right">
                    {formatCurrency(p.totalDollars)}
                    {p.hasEstimatedRates && (
                      <span className="text-amber-500 ml-0.5">*</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      <DataTable
        columns={columns}
        data={data}
        searchColumn="name"
        searchPlaceholder="Search clients..."
        exportFilename="clients-breakdown"
        renderSubRow={renderSubRow}
      />
      {hasAnyEstimated && (
        <p className="text-xs text-amber-500 mt-2">
          * Dollar values include hours valued at estimated $150/hr for users without a set rate.
        </p>
      )}
    </div>
  )
}
