import { DashboardHeader } from "@/components/dashboard/header"
import { getFilteredDepartments, getDateRange, getFilteredUsers, getFilteredProjects } from '@/actions/dashboard-data'
import { getDefaultDateRange, buildFilters } from '@/lib/filters'
import { InsightsContent } from '@/app/(dashboard)/insights/insights-content'

interface PageProps {
  searchParams: Promise<{
    dateStart?: string
    dateEnd?: string
    department?: string
    clientType?: string
    filterProjects?: string
    filterUsers?: string
  }>
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams

  const { dateStart: defaultDateStart, dateEnd: defaultDateEnd } = getDefaultDateRange()
  const filters = buildFilters(params)

  let departments: string[] = []
  let dateRange: { min: string | null; max: string | null } = { min: null, max: null }
  let users: { id: string; name: string }[] = []
  let projects: { id: string; name: string }[] = []

  try {
    ;[departments, dateRange, users, projects] = await Promise.all([
      getFilteredDepartments(filters),
      getDateRange(),
      getFilteredUsers(filters),
      getFilteredProjects(filters),
    ])
  } catch (error) {
    console.error('Error loading static data:', error)
  }

  return (
    <>
      <DashboardHeader
        title="Dashboard"
        description={
          !params.dateStart && !params.dateEnd
            ? "Showing last 30 days • Key findings and recommendations"
            : "Key findings and recommendations"
        }
        showFilters={true}
        departments={departments}
        dateRange={dateRange}
        users={users}
        projects={projects}
      />
      <InsightsContent defaultDateStart={defaultDateStart} defaultDateEnd={defaultDateEnd} />
    </>
  )
}
