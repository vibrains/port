/**
 * Mock data for BurnKit dashboard.
 *
 * All numbers are internally consistent:
 *   - overview totals = sum of all person rows
 *   - each person's totalHours = billableHours + gapHours + internalHours
 *   - billablePercent = billableHours / totalHours * 100
 *   - dollars computed at each user's rate (or $150/hr estimated)
 */

import type {
  OverviewData,
  ClientData,
  PersonData,
  PersonClientData,
} from '@/types/dashboard'

// ============================================================================
// Users
// ============================================================================

export const MOCK_ALL_USERS: Array<{
  id: string
  name: string
  email: string
  department_code: string | null
  user_rate: number | null
}> = [
  // Creative (cr)
  { id: 'u-001', name: 'Ava Chen', email: 'ava.chen@moontide.co', department_code: 'cr', user_rate: 22500 },
  { id: 'u-002', name: 'Marco Reyes', email: 'marco.reyes@moontide.co', department_code: 'cr', user_rate: 28000 },
  { id: 'u-003', name: 'Priya Nair', email: 'priya.nair@moontide.co', department_code: 'cr', user_rate: 19500 },
  { id: 'u-004', name: 'Jordan Blake', email: 'jordan.blake@moontide.co', department_code: 'cr', user_rate: null },
  { id: 'u-005', name: 'Sofia Lindström', email: 'sofia.lindstrom@moontide.co', department_code: 'cr', user_rate: 35000 },

  // Client Services (cs)
  { id: 'u-006', name: 'Leo Tanaka', email: 'leo.tanaka@moontide.co', department_code: 'cs', user_rate: 24000 },
  { id: 'u-007', name: 'Camille Dubois', email: 'camille.dubois@moontide.co', department_code: 'cs', user_rate: 30000 },
  { id: 'u-008', name: 'Ethan Park', email: 'ethan.park@moontide.co', department_code: 'cs', user_rate: null },
  { id: 'u-009', name: 'Nadia Okafor', email: 'nadia.okafor@moontide.co', department_code: 'cs', user_rate: 26000 },
  { id: 'u-010', name: 'Ryan Mitchell', email: 'ryan.mitchell@moontide.co', department_code: 'cs', user_rate: 21000 },

  // Social (so)
  { id: 'u-011', name: 'Isla Varga', email: 'isla.varga@moontide.co', department_code: 'so', user_rate: 18000 },
  { id: 'u-012', name: 'Dylan Cruz', email: 'dylan.cruz@moontide.co', department_code: 'so', user_rate: 16000 },
  { id: 'u-013', name: 'Mei-Lin Wu', email: 'meilin.wu@moontide.co', department_code: 'so', user_rate: null },
  { id: 'u-014', name: 'Tomas Havel', email: 'tomas.havel@moontide.co', department_code: 'so', user_rate: 14000 },

  // Business Intelligence (bi)
  { id: 'u-015', name: 'Zara Khan', email: 'zara.khan@moontide.co', department_code: 'bi', user_rate: 40000 },
  { id: 'u-016', name: "Finn O'Sullivan", email: 'finn.osullivan@moontide.co', department_code: 'bi', user_rate: 36000 },
  { id: 'u-017', name: 'Anika Bergström', email: 'anika.bergstrom@moontide.co', department_code: 'bi', user_rate: null },

  // Development (de)
  { id: 'u-018', name: 'Kai Nakamura', email: 'kai.nakamura@moontide.co', department_code: 'de', user_rate: 45000 },
  { id: 'u-019', name: 'Luna Petrova', email: 'luna.petrova@moontide.co', department_code: 'de', user_rate: 60000 },
  { id: 'u-020', name: 'Sam Adeyemi', email: 'sam.adeyemi@moontide.co', department_code: 'de', user_rate: 50000 },
  { id: 'u-021', name: 'Ravi Patel', email: 'ravi.patel@moontide.co', department_code: 'de', user_rate: null },

  // No department
  { id: 'u-022', name: 'Harper Ellis', email: 'harper.ellis@moontide.co', department_code: null, user_rate: 20000 },
  { id: 'u-023', name: 'Oscar Moretti', email: 'oscar.moretti@moontide.co', department_code: null, user_rate: null },
  { id: 'u-024', name: 'Leila Farouk', email: 'leila.farouk@freelance.io', department_code: null, user_rate: 32000 },
  { id: 'u-025', name: 'Jasper Wren', email: 'jasper.wren@freelance.io', department_code: null, user_rate: 28000 },
]

// ============================================================================
// Companies / Clients
// ============================================================================

export const MOCK_ALL_COMPANIES: Array<{
  id: string
  name: string
  teamwork_company_id: string
  isInternal: boolean
}> = [
  // Internal
  { id: 'c-001', name: 'Moontide Media', teamwork_company_id: 'tw-c-001', isInternal: true },
  { id: 'c-002', name: 'Everywhen Labs', teamwork_company_id: 'tw-c-002', isInternal: true },
  { id: 'c-003', name: 'Near&Dear Ventures', teamwork_company_id: 'tw-c-003', isInternal: true },

  // External
  { id: 'c-004', name: 'Solstice Skincare', teamwork_company_id: 'tw-c-004', isInternal: false },
  { id: 'c-005', name: 'Vanta Athletics', teamwork_company_id: 'tw-c-005', isInternal: false },
  { id: 'c-006', name: 'Birchwood Spirits', teamwork_company_id: 'tw-c-006', isInternal: false },
  { id: 'c-007', name: 'Meridian Hotels', teamwork_company_id: 'tw-c-007', isInternal: false },
  { id: 'c-008', name: 'Halcyon Magazine', teamwork_company_id: 'tw-c-008', isInternal: false },
  { id: 'c-009', name: 'Noctis Coffee', teamwork_company_id: 'tw-c-009', isInternal: false },
  { id: 'c-010', name: 'Prism Automotive', teamwork_company_id: 'tw-c-010', isInternal: false },
  { id: 'c-011', name: 'Verdant Foods', teamwork_company_id: 'tw-c-011', isInternal: false },
  { id: 'c-012', name: 'Azimuth Airlines', teamwork_company_id: 'tw-c-012', isInternal: false },
  { id: 'c-013', name: 'Kindling Home', teamwork_company_id: 'tw-c-013', isInternal: false },
  { id: 'c-014', name: 'Luminary Finance', teamwork_company_id: 'tw-c-014', isInternal: false },
  { id: 'c-015', name: 'Caspian Swim', teamwork_company_id: 'tw-c-015', isInternal: false },
]

// ============================================================================
// Projects
// ============================================================================

export const MOCK_ALL_PROJECTS: Array<{
  id: string
  name: string
  job_code: string | null
  company_id: string | null
  companies: { id: string; name: string } | null
  isInternal: boolean
}> = [
  // Internal projects
  { id: 'p-001', name: 'Moontide Brand Refresh', job_code: 'MT-001', company_id: 'c-001', companies: { id: 'c-001', name: 'Moontide Media' }, isInternal: true },
  { id: 'p-002', name: 'Everywhen Platform Build', job_code: 'EW-001', company_id: 'c-002', companies: { id: 'c-002', name: 'Everywhen Labs' }, isInternal: true },
  { id: 'p-003', name: 'N&D Internal Ops', job_code: 'ND-001', company_id: 'c-003', companies: { id: 'c-003', name: 'Near&Dear Ventures' }, isInternal: true },

  // External projects
  { id: 'p-004', name: 'Solstice Summer Campaign', job_code: 'SOL-2025', company_id: 'c-004', companies: { id: 'c-004', name: 'Solstice Skincare' }, isInternal: false },
  { id: 'p-005', name: 'Vanta Q1 Launch', job_code: 'VAN-Q1', company_id: 'c-005', companies: { id: 'c-005', name: 'Vanta Athletics' }, isInternal: false },
  { id: 'p-006', name: 'Birchwood Holiday Packaging', job_code: 'BIR-HOL', company_id: 'c-006', companies: { id: 'c-006', name: 'Birchwood Spirits' }, isInternal: false },
  { id: 'p-007', name: 'Meridian Rebrand', job_code: 'MER-RB', company_id: 'c-007', companies: { id: 'c-007', name: 'Meridian Hotels' }, isInternal: false },
  { id: 'p-008', name: 'Halcyon Editorial Redesign', job_code: 'HAL-ED', company_id: 'c-008', companies: { id: 'c-008', name: 'Halcyon Magazine' }, isInternal: false },
  { id: 'p-009', name: 'Noctis Brand Identity', job_code: 'NOC-BI', company_id: 'c-009', companies: { id: 'c-009', name: 'Noctis Coffee' }, isInternal: false },
  { id: 'p-010', name: 'Prism EV Launch', job_code: 'PRI-EV', company_id: 'c-010', companies: { id: 'c-010', name: 'Prism Automotive' }, isInternal: false },
  { id: 'p-011', name: 'Verdant Organic Rebrand', job_code: 'VER-OR', company_id: 'c-011', companies: { id: 'c-011', name: 'Verdant Foods' }, isInternal: false },
  { id: 'p-012', name: 'Azimuth Loyalty Program', job_code: 'AZI-LP', company_id: 'c-012', companies: { id: 'c-012', name: 'Azimuth Airlines' }, isInternal: false },
  { id: 'p-013', name: 'Kindling Spring Collection', job_code: 'KIN-SP', company_id: 'c-013', companies: { id: 'c-013', name: 'Kindling Home' }, isInternal: false },
  { id: 'p-014', name: 'Luminary App Design', job_code: 'LUM-AD', company_id: 'c-014', companies: { id: 'c-014', name: 'Luminary Finance' }, isInternal: false },
  { id: 'p-015', name: 'Caspian Social Strategy', job_code: 'CAS-SS', company_id: 'c-015', companies: { id: 'c-015', name: 'Caspian Swim' }, isInternal: false },
  { id: 'p-016', name: 'Solstice Winter Campaign', job_code: 'SOL-W25', company_id: 'c-004', companies: { id: 'c-004', name: 'Solstice Skincare' }, isInternal: false },
  { id: 'p-017', name: 'Vanta Social Media', job_code: 'VAN-SM', company_id: 'c-005', companies: { id: 'c-005', name: 'Vanta Athletics' }, isInternal: false },
]

// ============================================================================
// Helper: rate in $/hr from user_rate in cents
// ============================================================================

function ratePerHour(userId: string): number {
  const user = MOCK_ALL_USERS.find((u) => u.id === userId)
  return user?.user_rate ? user.user_rate / 100 : 150 // $150 fallback
}

function dollars(hours: number, userId: string): number {
  return Math.round(hours * ratePerHour(userId) * 100) / 100
}

// ============================================================================
// Person Data (~25 people)
// ============================================================================

// Raw person rows: [id, billableH, gapH, internalH, isFreelance]
const personRows: Array<[string, number, number, number, boolean]> = [
  ['u-001', 168.5, 12.0, 8.5, false],
  ['u-002', 195.0, 5.0, 30.0, false],
  ['u-003', 142.0, 18.5, 6.0, false],
  ['u-004', 88.0, 32.0, 10.0, false],
  ['u-005', 210.0, 0.0, 20.0, false],
  ['u-006', 175.0, 8.0, 12.0, false],
  ['u-007', 155.0, 15.0, 5.0, false],
  ['u-008', 120.0, 25.0, 15.0, false],
  ['u-009', 190.0, 3.5, 8.0, false],
  ['u-010', 95.0, 40.0, 5.0, false],
  ['u-011', 130.0, 10.0, 20.0, false],
  ['u-012', 78.0, 22.0, 8.0, false],
  ['u-013', 105.0, 15.5, 12.0, false],
  ['u-014', 55.0, 35.0, 10.0, false],
  ['u-015', 180.0, 2.0, 25.0, false],
  ['u-016', 165.0, 5.0, 18.0, false],
  ['u-017', 110.0, 20.0, 10.0, false],
  ['u-018', 200.0, 0.0, 15.0, false],
  ['u-019', 185.0, 5.0, 10.0, false],
  ['u-020', 160.0, 10.0, 12.0, false],
  ['u-021', 135.0, 15.0, 8.0, false],
  ['u-022', 60.0, 25.0, 5.0, false],
  ['u-023', 40.0, 30.0, 0.0, false],
  ['u-024', 145.0, 0.0, 0.0, true],
  ['u-025', 120.0, 0.0, 0.0, true],
]

export const MOCK_PEOPLE: PersonData[] = personRows.map(
  ([id, billableH, gapH, internalH, isFreelance]) => {
    const user = MOCK_ALL_USERS.find((u) => u.id === id)!
    const totalH = billableH + gapH + internalH
    return {
      id,
      name: user.name,
      department: user.department_code,
      isFreelance,
      billableHours: billableH,
      gapHours: gapH,
      internalHours: internalH,
      totalHours: totalH,
      billableDollars: dollars(billableH, id),
      gapDollars: dollars(gapH, id),
      internalDollars: dollars(internalH, id),
      totalDollars: dollars(totalH, id),
      billablePercent: totalH > 0 ? Math.round((billableH / totalH) * 10000) / 100 : 0,
      userRate: user.user_rate ? user.user_rate / 100 : null,
      hasEstimatedRates: user.user_rate === null,
    }
  }
)

// ============================================================================
// Person-Client Data (links people to clients they worked on)
// ============================================================================

// [personId, projectId, billableH, gapH, internalH]
const personClientRows: Array<[string, string, number, number, number]> = [
  // Ava Chen — Solstice Summer, Meridian Rebrand, Moontide Brand
  ['u-001', 'p-004', 80.0, 5.0, 0],
  ['u-001', 'p-007', 65.0, 4.0, 0],
  ['u-001', 'p-001', 0, 0, 8.5],
  ['u-001', 'p-004', 23.5, 3.0, 0],

  // Marco Reyes — Prism EV, Halcyon, Everywhen
  ['u-002', 'p-010', 95.0, 2.0, 0],
  ['u-002', 'p-008', 60.0, 3.0, 0],
  ['u-002', 'p-002', 0, 0, 30.0],
  ['u-002', 'p-010', 40.0, 0, 0],

  // Priya Nair — Noctis, Verdant, N&D
  ['u-003', 'p-009', 72.0, 5.0, 0],
  ['u-003', 'p-011', 50.0, 8.0, 0],
  ['u-003', 'p-003', 0, 0, 6.0],
  ['u-003', 'p-009', 20.0, 5.5, 0],

  // Jordan Blake — Kindling, Birchwood
  ['u-004', 'p-013', 48.0, 15.0, 0],
  ['u-004', 'p-006', 30.0, 12.0, 0],
  ['u-004', 'p-001', 0, 0, 10.0],
  ['u-004', 'p-013', 10.0, 5.0, 0],

  // Sofia Lindström — Azimuth, Luminary, Prism
  ['u-005', 'p-012', 85.0, 0, 0],
  ['u-005', 'p-014', 75.0, 0, 0],
  ['u-005', 'p-010', 50.0, 0, 0],
  ['u-005', 'p-001', 0, 0, 20.0],

  // Leo Tanaka — Solstice Summer + Winter, Vanta Q1
  ['u-006', 'p-004', 80.0, 3.0, 0],
  ['u-006', 'p-016', 55.0, 2.0, 0],
  ['u-006', 'p-005', 40.0, 3.0, 0],
  ['u-006', 'p-002', 0, 0, 12.0],

  // Camille Dubois — Meridian, Halcyon
  ['u-007', 'p-007', 90.0, 5.0, 0],
  ['u-007', 'p-008', 45.0, 8.0, 0],
  ['u-007', 'p-007', 20.0, 2.0, 0],
  ['u-007', 'p-003', 0, 0, 5.0],

  // Ethan Park — Birchwood, Caspian, Kindling
  ['u-008', 'p-006', 50.0, 8.0, 0],
  ['u-008', 'p-015', 40.0, 10.0, 0],
  ['u-008', 'p-013', 15.0, 5.0, 0],
  ['u-008', 'p-001', 0, 0, 15.0],
  ['u-008', 'p-006', 15.0, 2.0, 0],

  // Nadia Okafor — Vanta Q1 + Social, Azimuth
  ['u-009', 'p-005', 85.0, 1.5, 0],
  ['u-009', 'p-017', 55.0, 2.0, 0],
  ['u-009', 'p-012', 50.0, 0, 0],
  ['u-009', 'p-003', 0, 0, 8.0],

  // Ryan Mitchell — Solstice Winter, Verdant
  ['u-010', 'p-016', 50.0, 20.0, 0],
  ['u-010', 'p-011', 30.0, 12.0, 0],
  ['u-010', 'p-016', 15.0, 8.0, 0],
  ['u-010', 'p-001', 0, 0, 5.0],

  // Isla Varga — Caspian, Noctis, Vanta Social
  ['u-011', 'p-015', 55.0, 2.0, 0],
  ['u-011', 'p-009', 40.0, 3.0, 0],
  ['u-011', 'p-017', 35.0, 5.0, 0],
  ['u-011', 'p-002', 0, 0, 20.0],

  // Dylan Cruz — Kindling, Birchwood
  ['u-012', 'p-013', 22.0, 5.0, 0],
  ['u-012', 'p-006', 40.0, 10.0, 0],
  ['u-012', 'p-006', 16.0, 7.0, 0],
  ['u-012', 'p-003', 0, 0, 8.0],

  // Mei-Lin Wu — Solstice Summer, Prism
  ['u-013', 'p-004', 55.0, 5.0, 0],
  ['u-013', 'p-010', 35.0, 8.0, 0],
  ['u-013', 'p-004', 15.0, 2.5, 0],
  ['u-013', 'p-002', 0, 0, 12.0],

  // Tomas Havel — Verdant, Halcyon
  ['u-014', 'p-011', 25.0, 15.0, 0],
  ['u-014', 'p-008', 20.0, 14.0, 0],
  ['u-014', 'p-008', 10.0, 6.0, 0],
  ['u-014', 'p-003', 0, 0, 10.0],

  // Zara Khan — Luminary, Azimuth, Prism
  ['u-015', 'p-014', 80.0, 1.0, 0],
  ['u-015', 'p-012', 60.0, 1.0, 0],
  ['u-015', 'p-010', 40.0, 0, 0],
  ['u-015', 'p-001', 0, 0, 25.0],

  // Finn O'Sullivan — Luminary, Meridian
  ['u-016', 'p-014', 85.0, 2.0, 0],
  ['u-016', 'p-007', 60.0, 1.0, 0],
  ['u-016', 'p-014', 20.0, 2.0, 0],
  ['u-016', 'p-002', 0, 0, 18.0],

  // Anika Bergström — Azimuth, Vanta Q1
  ['u-017', 'p-012', 65.0, 5.0, 0],
  ['u-017', 'p-005', 30.0, 10.0, 0],
  ['u-017', 'p-005', 15.0, 5.0, 0],
  ['u-017', 'p-003', 0, 0, 10.0],

  // Kai Nakamura — Prism, Luminary
  ['u-018', 'p-010', 120.0, 0, 0],
  ['u-018', 'p-014', 50.0, 0, 0],
  ['u-018', 'p-010', 30.0, 0, 0],
  ['u-018', 'p-002', 0, 0, 15.0],

  // Luna Petrova — Solstice Winter, Azimuth
  ['u-019', 'p-016', 100.0, 2.0, 0],
  ['u-019', 'p-012', 55.0, 3.0, 0],
  ['u-019', 'p-016', 30.0, 0, 0],
  ['u-019', 'p-001', 0, 0, 10.0],

  // Sam Adeyemi — Vanta Social, Noctis
  ['u-020', 'p-017', 80.0, 5.0, 0],
  ['u-020', 'p-009', 55.0, 2.0, 0],
  ['u-020', 'p-009', 25.0, 3.0, 0],
  ['u-020', 'p-001', 0, 0, 12.0],

  // Ravi Patel — Caspian, Kindling
  ['u-021', 'p-015', 70.0, 5.0, 0],
  ['u-021', 'p-013', 40.0, 5.0, 0],
  ['u-021', 'p-015', 25.0, 5.0, 0],
  ['u-021', 'p-002', 0, 0, 8.0],

  // Harper Ellis — Birchwood, Solstice Summer
  ['u-022', 'p-006', 34.0, 10.0, 0],
  ['u-022', 'p-004', 16.0, 12.0, 0],
  ['u-022', 'p-004', 10.0, 3.0, 0],
  ['u-022', 'p-003', 0, 0, 5.0],

  // Oscar Moretti — Halcyon, Verdant
  ['u-023', 'p-008', 15.0, 10.0, 0],
  ['u-023', 'p-011', 20.0, 15.0, 0],
  ['u-023', 'p-008', 5.0, 5.0, 0],

  // Leila Farouk — Prism, Meridian (freelance)
  ['u-024', 'p-010', 85.0, 0, 0],
  ['u-024', 'p-007', 40.0, 0, 0],
  ['u-024', 'p-010', 20.0, 0, 0],

  // Jasper Wren — Vanta Q1, Solstice Summer (freelance)
  ['u-025', 'p-005', 70.0, 0, 0],
  ['u-025', 'p-004', 40.0, 0, 0],
  ['u-025', 'p-004', 10.0, 0, 0],
]

// Aggregate rows by person+company (not project) to avoid duplicate keys
const personClientMap = new Map<string, PersonClientData>()
for (const [personId, projectId, billableH, gapH, internalH] of personClientRows) {
  const user = MOCK_ALL_USERS.find((u) => u.id === personId)!
  const proj = MOCK_ALL_PROJECTS.find((p) => p.id === projectId)!
  const companyId = proj.company_id ?? projectId
  const companyName = proj.companies?.name ?? proj.name
  const key = `${personId}::${companyId}`
  const existing = personClientMap.get(key)
  if (existing) {
    existing.billableHours += billableH
    existing.gapHours += gapH
    existing.internalHours += internalH
    existing.totalHours += billableH + gapH + internalH
    existing.billableDollars += dollars(billableH, personId)
    existing.gapDollars += dollars(gapH, personId)
    existing.internalDollars += dollars(internalH, personId)
    existing.totalDollars += dollars(billableH + gapH + internalH, personId)
  } else {
    personClientMap.set(key, {
      personId,
      personName: user.name,
      clientId: companyId,
      clientName: companyName,
      isInternal: proj.isInternal,
      billableHours: billableH,
      gapHours: gapH,
      internalHours: internalH,
      totalHours: billableH + gapH + internalH,
      billableDollars: dollars(billableH, personId),
      gapDollars: dollars(gapH, personId),
      internalDollars: dollars(internalH, personId),
      totalDollars: dollars(billableH + gapH + internalH, personId),
      hasEstimatedRates: user.user_rate === null,
    })
  }
}
export const MOCK_PERSON_CLIENTS: PersonClientData[] = Array.from(personClientMap.values())

// ============================================================================
// Client Data (aggregated from MOCK_PERSON_CLIENTS by company)
// ============================================================================

const clientAgg = new Map<string, ClientData>()
for (const pc of MOCK_PERSON_CLIENTS) {
  const existing = clientAgg.get(pc.clientId)
  if (existing) {
    existing.billableHours += pc.billableHours
    existing.gapHours += pc.gapHours
    existing.internalHours += pc.internalHours
    existing.totalHours += pc.totalHours
    existing.billableDollars += pc.billableDollars
    existing.gapDollars += pc.gapDollars
    existing.internalDollars += pc.internalDollars
    existing.totalDollars += pc.totalDollars
    if (pc.hasEstimatedRates) existing.hasEstimatedRates = true
  } else {
    clientAgg.set(pc.clientId, {
      id: pc.clientId,
      name: pc.clientName,
      isInternal: pc.isInternal,
      billableHours: pc.billableHours,
      gapHours: pc.gapHours,
      internalHours: pc.internalHours,
      totalHours: pc.totalHours,
      billableDollars: pc.billableDollars,
      gapDollars: pc.gapDollars,
      internalDollars: pc.internalDollars,
      totalDollars: pc.totalDollars,
      billablePercent: 0,
      hasEstimatedRates: pc.hasEstimatedRates,
    })
  }
}
for (const c of clientAgg.values()) {
  c.billablePercent = c.totalHours > 0
    ? Math.round((c.billableHours / c.totalHours) * 1000) / 10
    : 0
}
export const MOCK_CLIENTS: ClientData[] = Array.from(clientAgg.values())

// ============================================================================
// Overview (computed from MOCK_PEOPLE for consistency)
// ============================================================================

const _totalHours = MOCK_PEOPLE.reduce((s, p) => s + p.totalHours, 0)
const _billableHours = MOCK_PEOPLE.reduce((s, p) => s + p.billableHours, 0)
const _gapHours = MOCK_PEOPLE.reduce((s, p) => s + p.gapHours, 0)
const _internalHours = MOCK_PEOPLE.reduce((s, p) => s + p.internalHours, 0)
const _totalDollars = MOCK_PEOPLE.reduce((s, p) => s + p.totalDollars, 0)
const _billableDollars = MOCK_PEOPLE.reduce((s, p) => s + p.billableDollars, 0)
const _gapDollars = MOCK_PEOPLE.reduce((s, p) => s + p.gapDollars, 0)
const _internalDollars = MOCK_PEOPLE.reduce((s, p) => s + p.internalDollars, 0)

export const MOCK_OVERVIEW: OverviewData = {
  totalHours: _totalHours,
  billableHours: _billableHours,
  gapHours: _gapHours,
  internalHours: _internalHours,
  totalDollars: Math.round(_totalDollars * 100) / 100,
  billableDollars: Math.round(_billableDollars * 100) / 100,
  gapDollars: Math.round(_gapDollars * 100) / 100,
  internalDollars: Math.round(_internalDollars * 100) / 100,
  billablePercent:
    _totalHours > 0
      ? Math.round((_billableHours / _totalHours) * 10000) / 100
      : 0,
  clientCount: MOCK_CLIENTS.length,
  personCount: MOCK_PEOPLE.length,
  timeLogCount: 4872,
  hasEstimatedRates: MOCK_PEOPLE.some((p) => p.hasEstimatedRates),
}

// ============================================================================
// Filter dropdown helpers
// ============================================================================

export const MOCK_DEPARTMENTS: string[] = ['bi', 'cr', 'cs', 'de', 'so']

export const MOCK_USERS: { id: string; name: string }[] = MOCK_ALL_USERS
  .map((u) => ({ id: u.id, name: u.name }))
  .sort((a, b) => a.name.localeCompare(b.name))

export const MOCK_PROJECTS: { id: string; name: string }[] = MOCK_ALL_PROJECTS
  .map((p) => ({ id: p.id, name: p.name }))
  .sort((a, b) => a.name.localeCompare(b.name))

export const MOCK_DATE_RANGE: { min: string; max: string } = {
  min: '2024-07-01',
  max: '2025-06-30',
}
