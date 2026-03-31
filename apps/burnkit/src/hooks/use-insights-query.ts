'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { fetchWithRetry } from '@/lib/fetch-with-retry'
import type { ClientData, PersonData, OverviewData } from '@/types/dashboard'

interface InsightsData {
  overview: OverviewData
  clients: ClientData[]
  people: PersonData[]
}

export function useInsightsQuery(defaultDateStart: string, defaultDateEnd: string) {
  const searchParams = useSearchParams()

  const filters = useMemo(() => {
    const filterProjectsParam = searchParams.get('filterProjects') || ''
    const filterUsersParam = searchParams.get('filterUsers') || ''
    return {
      dateStart: searchParams.get('dateStart') || defaultDateStart,
      dateEnd: searchParams.get('dateEnd') || defaultDateEnd,
      department: searchParams.get('department') || undefined,
      clientType: searchParams.get('clientType') || undefined,
      filterProjects: filterProjectsParam === 'none'
        ? []
        : filterProjectsParam
          ? filterProjectsParam.split(',').filter(Boolean)
          : undefined,
      filterUsers: filterUsersParam === 'none'
        ? []
        : filterUsersParam
          ? filterUsersParam.split(',').filter(Boolean)
          : undefined,
    }
  }, [searchParams, defaultDateStart, defaultDateEnd])

  const { data, isLoading, isFetching, error } = useQuery<InsightsData>({
    queryKey: ['insights', filters],
    queryFn: async () => {
      const response = await fetchWithRetry(
        `${process.env.NEXT_PUBLIC_BASE_PATH}/api/insights`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters),
        }
      )

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || `Server error (${response.status})`)
      }

      return response.json()
    },
    placeholderData: (prev) => prev,
    retry: false, // fetchWithRetry handles retries
    staleTime: 2 * 60 * 1000, // 2 min
  })

  return {
    overview: data?.overview ?? null,
    clients: data?.clients ?? [],
    people: data?.people ?? [],
    isLoading,
    isFetching,
    error: error instanceof Error ? error.message : null,
  }
}
