'use client'

import { Suspense } from 'react'
import { SidebarTrigger, Separator } from '@ndos/ui'
import { FilterBar } from './filter-bar'

interface DashboardHeaderProps {
  title: string
  description?: string
  children?: React.ReactNode
  showFilters?: boolean
  departments?: string[]
  dateRange?: { min: string | null; max: string | null }
  users?: { id: string; name: string }[]
  projects?: { id: string; name: string }[]
}

export function DashboardHeader({
  title,
  description,
  children,
  showFilters = false,
  departments = [],
  dateRange,
  users = [],
  projects = [],
}: DashboardHeaderProps) {
  return (
    <>
      <div className="border-b">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {children && <div className="flex items-center gap-2">{children}</div>}
          </div>
        </header>
      </div>
      {showFilters && (
        <div className="px-6 pt-6">
          <Suspense fallback={<div className="h-10 bg-muted/30 rounded-lg animate-pulse" />}>
            <FilterBar departments={departments} dateRange={dateRange} users={users} projects={projects} />
          </Suspense>
        </div>
      )}
    </>
  )
}
