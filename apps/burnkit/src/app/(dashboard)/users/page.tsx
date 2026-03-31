import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@ndos/ui"
import { UsersTable } from "./users-table"
import { getPersonData, getPersonClientData, getFilteredDepartments, getDateRange, getFilteredUsers, getFilteredProjects } from '@/actions/dashboard-data'
import { buildFilters } from '@/lib/filters'

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

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filters = buildFilters(params)

  const [userData, personClientData, departments, dateRange, allUsers, projects] = await Promise.all([
    getPersonData(filters),
    getPersonClientData(filters),
    getFilteredDepartments(filters),
    getDateRange(),
    getFilteredUsers(filters),
    getFilteredProjects(filters),
  ])

  return (
    <>
      <DashboardHeader
        title="Users"
        description={`${userData.length} team members with activity`}
        showFilters={userData.length > 0}
        departments={departments}
        dateRange={dateRange}
        users={allUsers}
        projects={projects}
      />
      <main className="flex-1 p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <UsersTable data={userData} personClientData={personClientData} />
          </CardContent>
        </Card>
      </main>
    </>
  )
}
