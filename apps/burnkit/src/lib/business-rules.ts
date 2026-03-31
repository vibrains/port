/**
 * Centralized business rules for BurnKit.
 * Single source of truth for categorization and rate logic.
 */

// ============================================================================
// Internal Company Detection
// ============================================================================

export const INTERNAL_KEYWORDS = [
  'internal',
  'moontide',
  'everywhen',
  'near&dear',
  'n&d',
  'bd',
] as const

export function isInternalCompany(companyName: string | null | undefined): boolean {
  if (!companyName) return false
  const normalized = companyName.toLowerCase().trim()
  return INTERNAL_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

// ============================================================================
// Rate Calculations
// ============================================================================

export const AVG_HOURLY_RATE = 150

// ============================================================================
// Time Entry Categorization
// ============================================================================

export type TimeEntryCategory = 'billable' | 'gap' | 'internal'

/**
 * Categorizes a time entry:
 *  - billable: is_billable = true (from DB)
 *  - gap: non-billable on external client (revenue at risk)
 *  - internal: non-billable on internal company project
 */
export function categorizeTimeEntry(entry: {
  isBillable: boolean
  companyName: string | null | undefined
}): TimeEntryCategory {
  if (entry.isBillable) return 'billable'
  if (!isInternalCompany(entry.companyName)) return 'gap'
  return 'internal'
}

// ============================================================================
// Percentage Calculations
// ============================================================================

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0
  return (part / total) * 100
}
