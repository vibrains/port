'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Label, Calendar, Popover, PopoverContent, PopoverTrigger, MultiSelect } from '@ndos/ui'
import { X, Filter, CalendarIcon } from 'lucide-react'
import { format, parse } from 'date-fns'

interface FilterBarProps {
  departments?: string[]
  dateRange?: { min: string | null; max: string | null }
  users?: { id: string; name: string }[]
  projects?: { id: string; name: string }[]
}

export function FilterBar({ departments = [], dateRange, users = [], projects = [] }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [startOpen, setStartOpen] = useState(false)
  const [endOpen, setEndOpen] = useState(false)

  // Default to last 30 days (matching page.tsx logic) so pickers always show a date
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
  const defaultStart = format(thirtyDaysAgo, 'yyyy-MM-dd')
  const defaultEnd = format(now, 'yyyy-MM-dd')

  const dateStart = searchParams.get('dateStart') || defaultStart
  const dateEnd = searchParams.get('dateEnd') || defaultEnd
  const department = searchParams.get('department') || 'all'
  const clientType = searchParams.get('clientType') || 'all'

  // Users: no param = all selected. "none" = explicitly none selected.
  const filterUsersParam = searchParams.get('filterUsers') || ''
  const filterUsers = filterUsersParam === 'none'
    ? new Set<string>()
    : filterUsersParam
    ? new Set(filterUsersParam.split(',').filter(Boolean))
    : new Set(users.map((u) => u.id))

  // Projects: no param = all selected. "none" = explicitly none selected.
  const filterProjectsParam = searchParams.get('filterProjects') || ''
  const filterProjects = filterProjectsParam === 'none'
    ? new Set<string>()
    : filterProjectsParam
    ? new Set(filterProjectsParam.split(',').filter(Boolean))
    : new Set(projects.map((p) => p.id))

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || value === 'all') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }

      return params.toString()
    },
    [searchParams]
  )

  const updateFilter = (key: string, value: string | null) => {
    startTransition(() => {
      const queryString = createQueryString({ [key]: value })
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
      router.refresh()
    })
  }

  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname)
      router.refresh()
    })
  }

  const allUserIds = users.map((u) => u.id)
  const updateFilterUsers = (selected: Set<string>) => {
    startTransition(() => {
      const isAll = selected.size === allUserIds.length
      const value = isAll ? null : selected.size === 0 ? 'none' : Array.from(selected).join(',')
      const queryString = createQueryString({ filterUsers: value })
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
      router.refresh()
    })
  }

  const allProjectIds = projects.map((p) => p.id)
  const updateFilterProjects = (selected: Set<string>) => {
    startTransition(() => {
      const isAll = selected.size === allProjectIds.length
      const value = isAll ? null : selected.size === 0 ? 'none' : Array.from(selected).join(',')
      const queryString = createQueryString({ filterProjects: value })
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
      router.refresh()
    })
  }

  const startDate = dateStart ? parse(dateStart, 'yyyy-MM-dd', new Date()) : undefined
  const endDate = dateEnd ? parse(dateEnd, 'yyyy-MM-dd', new Date()) : undefined
  const fromDate = dateRange?.min ? new Date(dateRange.min + 'T00:00:00') : undefined
  const toDate = dateRange?.max ? new Date(dateRange.max + 'T00:00:00') : undefined

  const hasActiveFilters = dateStart || dateEnd || (department && department !== 'all') || (clientType && clientType !== 'all') || filterUsers.size < allUserIds.length || filterProjects.size < allProjectIds.length

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filters
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Start Date</Label>
        <Popover open={startOpen} onOpenChange={setStartOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-40 justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'MMM d, yyyy') : <span className="text-muted-foreground">Start date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => {
                updateFilter('dateStart', date ? format(date, 'yyyy-MM-dd') : null)
                setStartOpen(false)
              }}
              defaultMonth={startDate}
              startMonth={fromDate}
              endMonth={toDate}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">End Date</Label>
        <Popover open={endOpen} onOpenChange={setEndOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-40 justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'MMM d, yyyy') : <span className="text-muted-foreground">End date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={(date) => {
                updateFilter('dateEnd', date ? format(date, 'yyyy-MM-dd') : null)
                setEndOpen(false)
              }}
              defaultMonth={endDate}
              startMonth={fromDate}
              endMonth={toDate}
              autoFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {departments.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Department</Label>
          <Select
            value={department}
            onValueChange={(value) => updateFilter('department', value)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Client Type</Label>
        <Select
          value={clientType}
          onValueChange={(value) => updateFilter('clientType', value)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="external">External Only</SelectItem>
            <SelectItem value="internal">Internal Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {projects.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Projects</Label>
          <MultiSelect
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            selected={filterProjects}
            onChange={updateFilterProjects}
            placeholder="All Projects"
            label="projects"
            searchPlaceholder="Search projects..."
          />
        </div>
      )}

      {users.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Users</Label>
          <MultiSelect
            options={users.map((u) => ({ value: u.id, label: u.name }))}
            selected={filterUsers}
            onChange={updateFilterUsers}
            placeholder="All Users"
            label="users"
            searchPlaceholder="Search users..."
          />
        </div>
      )}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={isPending}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}

      {isPending && (
        <span className="text-xs text-muted-foreground animate-pulse">Updating...</span>
      )}
    </div>
  )
}
