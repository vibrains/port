import { DashboardHeader } from '@/components/dashboard/header'
import { Card, CardContent, CardHeader, CardTitle } from '@ndos/ui'
import { ClientsTable } from './clients-table'
import { getClientData, getPersonClientData, getFilteredDepartments, getDateRange, getFilteredUsers, getFilteredProjects } from '@/actions/dashboard-data'
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

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const filters = buildFilters(params)

  const [clients, personClientData, departments, dateRange, users, projects] = await Promise.all([
    getClientData(filters),
    getPersonClientData(filters),
    getFilteredDepartments(filters),
    getDateRange(),
    getFilteredUsers(filters),
    getFilteredProjects(filters),
  ])

  return (
    <>
      <DashboardHeader
        title="Clients"
        description={`${clients.length} clients with activity`}
        showFilters={clients.length > 0}
        departments={departments}
        dateRange={dateRange}
        users={users}
        projects={projects}
      />
      <main className="flex-1 p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientsTable data={clients} personClientData={personClientData} />
          </CardContent>
        </Card>
      </main>
    </>
  )
}
