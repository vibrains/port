'use server'

import type {
  FilterParams,
  ClientData,
  PersonData,
  PersonClientData,
  OverviewData,
} from '@/types/dashboard'
import {
  MOCK_CLIENTS,
  MOCK_PEOPLE,
  MOCK_PERSON_CLIENTS,
  MOCK_DEPARTMENTS,
  MOCK_DATE_RANGE,
  MOCK_USERS,
  MOCK_PROJECTS,
  MOCK_ALL_PROJECTS,
} from '@/lib/mock-data'

// ============================================================================
// Filtering helpers
// ============================================================================

/**
 * Filter semantics:
 * - undefined / not provided → show all (no filter active)
 * - [] (empty array)         → none selected → empty results
 * - [...ids]                 → only matching items
 */

/** Resolve selected project IDs to the company IDs they belong to. */
function projectIdsToCompanyIds(projectIds: string[]): Set<string> {
  return new Set(
    MOCK_ALL_PROJECTS
      .filter((p) => projectIds.includes(p.id))
      .map((p) => p.company_id)
      .filter(Boolean) as string[]
  )
}

function filterPersonClients(filters: FilterParams): PersonClientData[] {
  if (Array.isArray(filters.filterUsers) && filters.filterUsers.length === 0) return []
  if (Array.isArray(filters.filterProjects) && filters.filterProjects.length === 0) return []

  let pcs = MOCK_PERSON_CLIENTS

  // Filter by selected projects → scope to their companies
  if (filters.filterProjects && filters.filterProjects.length > 0) {
    const companyIds = projectIdsToCompanyIds(filters.filterProjects)
    pcs = pcs.filter((pc) => companyIds.has(pc.clientId))
  }

  // Filter by department
  if (filters.department) {
    const deptPeopleIds = new Set(
      MOCK_PEOPLE.filter((p) => (p.department ?? '-') === filters.department).map((p) => p.id)
    )
    pcs = pcs.filter((pc) => deptPeopleIds.has(pc.personId))
  }

  // Filter by selected users
  if (filters.filterUsers && filters.filterUsers.length > 0) {
    pcs = pcs.filter((pc) => filters.filterUsers!.includes(pc.personId))
  }

  // Filter by client type
  if (filters.clientType === 'internal') {
    pcs = pcs.filter((pc) => pc.isInternal)
  } else if (filters.clientType === 'external') {
    pcs = pcs.filter((pc) => !pc.isInternal)
  }

  return pcs
}

function filterPeople(filters: FilterParams): PersonData[] {
  if (Array.isArray(filters.filterUsers) && filters.filterUsers.length === 0) return []
  if (Array.isArray(filters.filterProjects) && filters.filterProjects.length === 0) return []

  let people = MOCK_PEOPLE

  if (filters.department) {
    people = people.filter(
      (p) => (p.department ?? '-') === filters.department
    )
  }

  if (filters.filterUsers && filters.filterUsers.length > 0) {
    people = people.filter((p) => filters.filterUsers!.includes(p.id))
  }

  // If projects are selected, only show users who worked on those projects
  if (filters.filterProjects && filters.filterProjects.length > 0) {
    const pcs = filterPersonClients(filters)
    const userIds = new Set(pcs.map((pc) => pc.personId))
    people = people.filter((p) => userIds.has(p.id))
  }

  return people
}

function filterClients(filters: FilterParams): ClientData[] {
  if (Array.isArray(filters.filterUsers) && filters.filterUsers.length === 0) return []
  if (Array.isArray(filters.filterProjects) && filters.filterProjects.length === 0) return []

  let clients = MOCK_CLIENTS

  // Filter by selected projects → scope to their companies
  if (filters.filterProjects && filters.filterProjects.length > 0) {
    const companyIds = projectIdsToCompanyIds(filters.filterProjects)
    clients = clients.filter((c) => companyIds.has(c.id))
  }

  if (filters.clientType === 'internal') {
    clients = clients.filter((c) => c.isInternal)
  } else if (filters.clientType === 'external') {
    clients = clients.filter((c) => !c.isInternal)
  }

  // If user/department filters are active, only show clients those users worked on
  if (filters.department || (filters.filterUsers && filters.filterUsers.length > 0)) {
    const pcs = filterPersonClients(filters)
    const clientIds = new Set(pcs.map((pc) => pc.clientId))
    clients = clients.filter((c) => clientIds.has(c.id))
  }

  return clients
}

function computeOverview(people: PersonData[]): OverviewData {
  const totalHours = people.reduce((s, p) => s + p.totalHours, 0)
  const billableHours = people.reduce((s, p) => s + p.billableHours, 0)
  const gapHours = people.reduce((s, p) => s + p.gapHours, 0)
  const internalHours = people.reduce((s, p) => s + p.internalHours, 0)
  const totalDollars = people.reduce((s, p) => s + p.totalDollars, 0)
  const billableDollars = people.reduce((s, p) => s + p.billableDollars, 0)
  const gapDollars = people.reduce((s, p) => s + p.gapDollars, 0)
  const internalDollars = people.reduce((s, p) => s + p.internalDollars, 0)

  const clientIds = new Set(MOCK_PERSON_CLIENTS.filter(
    (pc) => people.some((p) => p.id === pc.personId)
  ).map((pc) => pc.clientId))

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    billableHours: Math.round(billableHours * 10) / 10,
    gapHours: Math.round(gapHours * 10) / 10,
    internalHours: Math.round(internalHours * 10) / 10,
    totalDollars: Math.round(totalDollars),
    billableDollars: Math.round(billableDollars),
    gapDollars: Math.round(gapDollars),
    internalDollars: Math.round(internalDollars),
    billablePercent: totalHours > 0
      ? Math.round((billableHours / totalHours) * 1000) / 10
      : 0,
    clientCount: clientIds.size,
    personCount: people.length,
    timeLogCount: people.length * 85,
    hasEstimatedRates: people.some((p) => p.hasEstimatedRates),
  }
}

// ============================================================================
// Server Actions
// ============================================================================

export async function getClientData(
  filters: FilterParams = {}
): Promise<ClientData[]> {
  return filterClients(filters)
}

export async function getPersonData(
  filters: FilterParams = {}
): Promise<PersonData[]> {
  return filterPeople(filters)
}

export async function getPersonClientData(
  filters: FilterParams = {}
): Promise<PersonClientData[]> {
  return filterPersonClients(filters)
}

export async function getOverviewData(
  filters: FilterParams = {}
): Promise<OverviewData> {
  const people = filterPeople(filters)
  return computeOverview(people)
}

// ============================================================================
// Filter Dropdown Data
// ============================================================================

export async function getDepartments(): Promise<string[]> {
  return MOCK_DEPARTMENTS
}

/**
 * Return departments filtered by current user/project selection.
 */
export async function getFilteredDepartments(filters: FilterParams): Promise<string[]> {
  let people = MOCK_PEOPLE

  if (filters.filterUsers && filters.filterUsers.length > 0) {
    people = people.filter((p) => filters.filterUsers!.includes(p.id))
  } else if (Array.isArray(filters.filterUsers) && filters.filterUsers.length === 0) {
    return []
  }

  if (filters.filterProjects && filters.filterProjects.length > 0) {
    const companyIds = projectIdsToCompanyIds(filters.filterProjects)
    const userIds = new Set(
      MOCK_PERSON_CLIENTS
        .filter((pc) => companyIds.has(pc.clientId))
        .map((pc) => pc.personId)
    )
    people = people.filter((p) => userIds.has(p.id))
  } else if (Array.isArray(filters.filterProjects) && filters.filterProjects.length === 0) {
    return []
  }

  const depts = new Set(people.map((p) => p.department ?? '-').filter(Boolean))
  return MOCK_DEPARTMENTS.filter((d) => depts.has(d))
}

export async function getDateRange(): Promise<{
  min: string | null
  max: string | null
}> {
  return MOCK_DATE_RANGE
}

export async function getUsers(): Promise<{ id: string; name: string }[]> {
  return MOCK_USERS
}

export async function getProjects(): Promise<{ id: string; name: string }[]> {
  return MOCK_PROJECTS
}

/**
 * Return users filtered by current project selection.
 * If specific projects are selected, only return users who worked on those projects.
 */
export async function getFilteredUsers(filters: FilterParams): Promise<{ id: string; name: string }[]> {
  if (Array.isArray(filters.filterProjects) && filters.filterProjects.length > 0) {
    // Map project IDs to company IDs
    const companyIds = new Set(
      MOCK_ALL_PROJECTS
        .filter((p) => filters.filterProjects!.includes(p.id))
        .map((p) => p.company_id)
        .filter(Boolean)
    )
    const userIds = new Set(
      MOCK_PERSON_CLIENTS
        .filter((pc) => companyIds.has(pc.clientId))
        .map((pc) => pc.personId)
    )
    return MOCK_USERS.filter((u) => userIds.has(u.id))
  }
  if (filters.department) {
    const deptPeople = MOCK_PEOPLE.filter((p) => (p.department ?? '-') === filters.department)
    const ids = new Set(deptPeople.map((p) => p.id))
    return MOCK_USERS.filter((u) => ids.has(u.id))
  }
  return MOCK_USERS
}

/**
 * Return projects filtered by current user selection.
 * If specific users are selected, only return projects those users worked on.
 */
export async function getFilteredProjects(filters: FilterParams): Promise<{ id: string; name: string }[]> {
  if (Array.isArray(filters.filterUsers) && filters.filterUsers.length > 0) {
    const companyIds = new Set(
      MOCK_PERSON_CLIENTS
        .filter((pc) => filters.filterUsers!.includes(pc.personId))
        .map((pc) => pc.clientId)
    )
    return MOCK_PROJECTS.filter((p) => {
      const proj = MOCK_ALL_PROJECTS.find((ap) => ap.id === p.id)
      return proj && companyIds.has(proj.company_id ?? '')
    })
  }
  if (filters.department) {
    const deptPeople = MOCK_PEOPLE.filter((p) => (p.department ?? '-') === filters.department)
    const userIds = new Set(deptPeople.map((p) => p.id))
    const companyIds = new Set(
      MOCK_PERSON_CLIENTS
        .filter((pc) => userIds.has(pc.personId))
        .map((pc) => pc.clientId)
    )
    return MOCK_PROJECTS.filter((p) => {
      const proj = MOCK_ALL_PROJECTS.find((ap) => ap.id === p.id)
      return proj && companyIds.has(proj.company_id ?? '')
    })
  }
  return MOCK_PROJECTS
}
