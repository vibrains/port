import type { FilterParams } from '@/types/dashboard'

/**
 * Compute default date range: last 30 days.
 * Used by both server pages and client components.
 */
export function getDefaultDateRange() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
  return {
    dateStart: thirtyDaysAgo.toISOString().split('T')[0],
    dateEnd: now.toISOString().split('T')[0],
  }
}

/**
 * Build FilterParams from search params, applying default date range
 * when no dates are specified in the URL.
 */
export function buildFilters(params: {
  dateStart?: string
  dateEnd?: string
  department?: string
  clientType?: string
  filterProjects?: string
  filterUsers?: string
}): FilterParams {
  const defaults = getDefaultDateRange()

  return {
    dateStart: params.dateStart || defaults.dateStart,
    dateEnd: params.dateEnd || defaults.dateEnd,
    department: params.department,
    clientType: params.clientType as 'internal' | 'external' | 'all' | undefined,
    filterProjects: params.filterProjects === 'none' ? [] : params.filterProjects?.split(',').filter(Boolean),
    filterUsers: params.filterUsers === 'none' ? [] : params.filterUsers?.split(',').filter(Boolean),
  }
}
