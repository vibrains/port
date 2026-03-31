/**
 * Centralized type definitions for dashboard data
 *
 * These types are shared across server actions, pages, and components
 * to ensure consistency and avoid duplication.
 */

// ============================================================================
// Filter Types
// ============================================================================

export interface FilterParams {
  dateStart?: string
  dateEnd?: string
  department?: string
  clientType?: 'internal' | 'external' | 'all'
  filterProjects?: string[]
  filterUsers?: string[]
}

// ============================================================================
// Aggregated Data Types
// ============================================================================

export interface ClientData {
  id: string
  name: string
  isInternal: boolean
  billableHours: number
  gapHours: number
  internalHours: number
  totalHours: number
  billableDollars: number
  gapDollars: number
  internalDollars: number
  totalDollars: number
  billablePercent: number
  hasEstimatedRates: boolean
}

export interface PersonData {
  id: string
  name: string
  department: string | null
  isFreelance: boolean
  billableHours: number
  gapHours: number
  internalHours: number
  totalHours: number
  billableDollars: number
  gapDollars: number
  internalDollars: number
  totalDollars: number
  billablePercent: number
  userRate: number | null
  hasEstimatedRates: boolean
}

export interface PersonClientData {
  personId: string
  personName: string
  clientId: string
  clientName: string
  isInternal: boolean
  billableHours: number
  gapHours: number
  internalHours: number
  totalHours: number
  billableDollars: number
  gapDollars: number
  internalDollars: number
  totalDollars: number
  hasEstimatedRates: boolean
}

export interface OverviewData {
  totalHours: number
  billableHours: number
  gapHours: number
  internalHours: number
  totalDollars: number
  billableDollars: number
  gapDollars: number
  internalDollars: number
  billablePercent: number
  clientCount: number
  personCount: number
  timeLogCount: number
  hasEstimatedRates: boolean
}

// ============================================================================
// Entity Types (used by dashboard filter/table components)
// ============================================================================

export interface Company {
  id: string
  name: string
  isInternal: boolean
}

export interface User {
  id: string
  name: string
  user_rate?: number
  department_code?: string | null
}

export interface Project {
  id: string
  name: string
  job_code?: string | null
}

// ============================================================================
// Time Log Types
// ============================================================================

export interface TimeLogUser {
  id: string
  name: string
  department_code?: string | null
}

export interface TimeLogProject {
  name: string
  company_name?: string | null
  teamwork_project_id?: string | null
}

export interface TimeLog {
  id: string
  date: string
  hours: number
  is_billable: boolean
  description?: string | null
  approval_status?: string | null
  user: TimeLogUser
  project: TimeLogProject
}

export interface CondensedProject {
  projectName: string
  companyName: string | null
  entryCount: number
  totalHours: number
}

// ============================================================================
// Sorting Types
// ============================================================================

export type SortDirection = 'asc' | 'desc'

export type SortColumn =
  | 'date'
  | 'user'
  | 'client'
  | 'project'
  | 'description'
  | 'hours'
  | 'is_billable'
  | 'approval_status'
  | 'teamwork_project_id'
  | (string & {})
