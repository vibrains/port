/**
 * Mock Data for TimeKit Portfolio Demo
 *
 * Realistic data for a marketing agency time-tracking/payroll system.
 * Replaces all database calls for demo purposes.
 */

// ─── Companies ───────────────────────────────────────────────────────────────

export const MOCK_COMPANIES = [
  { id: 'comp-001', name: 'Apex Digital', teamworkCompanyId: 48001 },
  { id: 'comp-002', name: 'Horizon Creative', teamworkCompanyId: 48002 },
  { id: 'comp-003', name: 'Summit Partners', teamworkCompanyId: 48003 },
  { id: 'comp-004', name: 'Internal Operations', teamworkCompanyId: 48004 },
  { id: 'comp-005', name: 'Freelance Pool', teamworkCompanyId: 48005 },
] as const;

// ─── Users ───────────────────────────────────────────────────────────────────

export const MOCK_USERS = [
  {
    id: 'usr-001', name: 'Sarah Chen', email: 'sarah.chen@ndos.co',
    googleId: 'g-100001', companyId: 'comp-001', employeeCode: 'SCHEN',
    departmentCode: 'CRTE', fncCode: '07cs0326', deletedAt: null,
    createdAt: '2025-09-15T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-002', name: 'Marcus Rivera', email: 'marcus.rivera@ndos.co',
    googleId: 'g-100002', companyId: 'comp-001', employeeCode: 'MRIVE',
    departmentCode: 'DEVL', fncCode: '07cs0327', deletedAt: null,
    createdAt: '2025-09-15T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-003', name: 'Emily Nakamura', email: 'emily.nakamura@ndos.co',
    googleId: 'g-100003', companyId: 'comp-001', employeeCode: 'ENAKA',
    departmentCode: 'CRTE', fncCode: '07cs0326', deletedAt: null,
    createdAt: '2025-10-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-004', name: 'James Okonkwo', email: 'james.okonkwo@ndos.co',
    googleId: 'g-100004', companyId: 'comp-002', employeeCode: 'JOKON',
    departmentCode: 'MKTG', fncCode: '07cs0330', deletedAt: null,
    createdAt: '2025-10-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-005', name: 'Ava Petrov', email: 'ava.petrov@ndos.co',
    googleId: 'g-100005', companyId: 'comp-002', employeeCode: 'APETR',
    departmentCode: 'CSVC', fncCode: '07cs0331', deletedAt: null,
    createdAt: '2025-10-15T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-006', name: 'David Kim', email: 'david.kim@ndos.co',
    googleId: 'g-100006', companyId: 'comp-002', employeeCode: 'DKIM0',
    departmentCode: 'DEVL', fncCode: '07cs0327', deletedAt: null,
    createdAt: '2025-11-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-007', name: 'Lucia Fernandez', email: 'lucia.fernandez@ndos.co',
    googleId: 'g-100007', companyId: 'comp-003', employeeCode: 'LFERN',
    departmentCode: 'CRTE', fncCode: '07cs0326', deletedAt: null,
    createdAt: '2025-11-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-008', name: 'Ryan O\'Brien', email: 'ryan.obrien@ndos.co',
    googleId: 'g-100008', companyId: 'comp-003', employeeCode: 'ROBRI',
    departmentCode: 'MKTG', fncCode: '07cs0330', deletedAt: null,
    createdAt: '2025-11-15T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-009', name: 'Priya Sharma', email: 'priya.sharma@ndos.co',
    googleId: 'g-100009', companyId: 'comp-004', employeeCode: 'PSHAR',
    departmentCode: 'CSVC', fncCode: '07cs0331', deletedAt: null,
    createdAt: '2025-12-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-010', name: 'Noah Williams', email: 'noah.williams@ndos.co',
    googleId: 'g-100010', companyId: 'comp-004', employeeCode: 'NWILL',
    departmentCode: 'DEVL', fncCode: '07cs0327', deletedAt: null,
    createdAt: '2025-12-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-011', name: 'Zoe Andersen', email: 'zoe.andersen@ndos.co',
    googleId: 'g-100011', companyId: 'comp-004', employeeCode: 'ZANDE',
    departmentCode: 'MKTG', fncCode: '07cs0330', deletedAt: null,
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-012', name: 'Tyler Brooks', email: 'tyler.brooks@freelance.co',
    googleId: 'g-100012', companyId: 'comp-005', employeeCode: null,
    departmentCode: null, fncCode: null, deletedAt: null,
    createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-013', name: 'Mia Thompson', email: 'mia.thompson@freelance.co',
    googleId: 'g-100013', companyId: 'comp-005', employeeCode: null,
    departmentCode: null, fncCode: null, deletedAt: null,
    createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-014', name: 'Carlos Reyes', email: 'carlos.reyes@ndos.co',
    googleId: 'g-100014', companyId: 'comp-001', employeeCode: 'CREYE',
    departmentCode: 'CRTE', fncCode: '07cs0326', deletedAt: null,
    createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'usr-015', name: 'Hannah Dubois', email: 'hannah.dubois@ndos.co',
    googleId: 'g-100015', companyId: 'comp-003', employeeCode: 'HDUBO',
    departmentCode: 'DEVL', fncCode: '07cs0327', deletedAt: null,
    createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
];

// ─── Projects ────────────────────────────────────────────────────────────────

export const MOCK_PROJECTS = [
  {
    id: 'proj-001', name: 'Apex Digital — Brand Refresh 2026', teamworkProjectId: 92001,
    jobCode: 'APX-2601', companyId: 'comp-001',
    createdAt: '2025-11-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'proj-002', name: 'Apex Digital — Q1 Social Campaign', teamworkProjectId: 92002,
    jobCode: 'APX-2602', companyId: 'comp-001',
    createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'proj-003', name: 'Horizon Creative — Website Redesign', teamworkProjectId: 92003,
    jobCode: 'HRZ-2601', companyId: 'comp-002',
    createdAt: '2025-12-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'proj-004', name: 'Horizon Creative — SEO Audit', teamworkProjectId: 92004,
    jobCode: 'HRZ-2602', companyId: 'comp-002',
    createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'proj-005', name: 'Summit Partners — Annual Report', teamworkProjectId: 92005,
    jobCode: 'SMP-2601', companyId: 'comp-003',
    createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'proj-006', name: 'Summit Partners — Investor Portal', teamworkProjectId: 92006,
    jobCode: 'SMP-2602', companyId: 'comp-003',
    createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'proj-007', name: 'Internal — Time Machine Development', teamworkProjectId: 92007,
    jobCode: 'INT-0001', companyId: 'comp-004',
    createdAt: '2025-09-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'proj-008', name: 'Internal — Team Training & Onboarding', teamworkProjectId: 92008,
    jobCode: 'INT-0002', companyId: 'comp-004',
    createdAt: '2025-10-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'proj-009', name: 'Apex Digital — Email Automation', teamworkProjectId: 92009,
    jobCode: 'APX-2603', companyId: 'comp-001',
    createdAt: '2026-02-10T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'proj-010', name: 'Horizon Creative — Product Launch', teamworkProjectId: 92010,
    jobCode: 'HRZ-2603', companyId: 'comp-002',
    createdAt: '2026-02-15T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'proj-011', name: 'Internal — Infrastructure & DevOps', teamworkProjectId: 92011,
    jobCode: 'INT-0003', companyId: 'comp-004',
    createdAt: '2026-01-01T10:00:00Z', updatedAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'proj-012', name: 'Summit Partners — Rebrand Strategy', teamworkProjectId: 92012,
    jobCode: null, companyId: 'comp-003',
    createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-03-15T08:00:00Z',
  },
];

// ─── Time Log Descriptions (pool for generation) ────────────────────────────

const DESCRIPTIONS = [
  'Brand strategy meeting with stakeholders',
  'Social media content creation and scheduling',
  'Client presentation prep and rehearsal',
  'Creative direction review — round 2 feedback',
  'Website wireframe iteration',
  'SEO keyword research and competitor analysis',
  'Email campaign template design',
  'Sprint planning and backlog grooming',
  'Code review and pull request feedback',
  'User testing session — mobile prototype',
  'Analytics dashboard configuration',
  'Quarterly performance report compilation',
  'Team standup and project status update',
  'Photography art direction for hero banner',
  'Copywriting — landing page headlines A/B variants',
  'Video editing — 30s product teaser',
  'Print collateral layout — investor brochure',
  'UX audit and accessibility improvements',
  'API integration debugging — third-party feed',
  'Database migration planning and documentation',
  'Client onboarding call and requirements gathering',
  'Design system component library updates',
  'Marketing automation workflow setup',
  'Content calendar planning — March/April',
  'Budget reconciliation and time review',
  'Internal tooling feature development',
  'Cross-team sync — creative and engineering',
  'Vendor coordination and asset delivery',
  'QA testing — staging environment regression',
  'Deployment and post-launch monitoring',
  'Social listening report and sentiment analysis',
  'Competitive landscape benchmark study',
  'Brand guidelines document revision',
  'Client feedback incorporation — final round',
  'Performance optimization — page load times',
  'Training session — new team member onboarding',
  'Invoice review and project cost tracking',
  'Responsive design testing across devices',
  'Illustration concepts for campaign assets',
  'Stakeholder presentation — Q1 results',
];

// ─── Generate Time Logs ──────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateTimeLogs() {
  const rand = seededRandom(42);
  const logs: Array<{
    id: string;
    teamworkLogId: number;
    userId: string;
    projectId: string;
    date: string;
    minutes: number;
    description: string | null;
    jobNumber: string | null;
    approvalStatus: 'approved' | 'inreview' | 'needschanges' | null;
    billable: boolean;
    syncedAt: string;
    deletedAt: null;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      employeeCode: string | null;
      departmentCode: string | null;
      fncCode: string | null;
      company: { id: string; name: string };
    };
    project: {
      id: string;
      name: string;
      jobCode: string | null;
      teamworkProjectId: number;
    };
  }> = [];

  // User-project affinities (each user works on 2-3 projects)
  const userProjectMap: Record<string, string[]> = {
    'usr-001': ['proj-001', 'proj-002', 'proj-009'],
    'usr-002': ['proj-001', 'proj-007', 'proj-011'],
    'usr-003': ['proj-002', 'proj-009'],
    'usr-004': ['proj-003', 'proj-004', 'proj-010'],
    'usr-005': ['proj-003', 'proj-010'],
    'usr-006': ['proj-003', 'proj-004'],
    'usr-007': ['proj-005', 'proj-006', 'proj-012'],
    'usr-008': ['proj-005', 'proj-006'],
    'usr-009': ['proj-007', 'proj-008'],
    'usr-010': ['proj-007', 'proj-011'],
    'usr-011': ['proj-008', 'proj-005'],
    'usr-012': ['proj-001', 'proj-003'],
    'usr-013': ['proj-010', 'proj-009'],
    'usr-014': ['proj-002', 'proj-001', 'proj-009'],
    'usr-015': ['proj-006', 'proj-012'],
  };

  const minuteOptions = [30, 60, 90, 120, 150, 180, 210, 240, 300, 360, 420, 480];
  const approvalStatuses: Array<'approved' | 'inreview' | 'needschanges' | null> = [
    'approved', 'approved', 'approved', 'approved', 'approved',
    'approved', 'approved', 'inreview', 'inreview', 'needschanges', null,
  ];

  let logCounter = 0;

  // Generate logs spread across Feb 1 - Mar 19, 2026 (business days)
  for (let day = 1; day <= 47; day++) {
    const baseDate = new Date(2026, 1, 1); // Feb 1, 2026
    baseDate.setDate(baseDate.getDate() + day - 1);
    const dayOfWeek = baseDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dateStr = baseDate.toISOString().split('T')[0];

    // 3-5 users log time each day
    const numUsersToday = 3 + Math.floor(rand() * 3);
    const shuffledUserIds = MOCK_USERS.map(u => u.id).sort(() => rand() - 0.5);
    const todayUsers = shuffledUserIds.slice(0, numUsersToday);

    for (const userId of todayUsers) {
      const user = MOCK_USERS.find(u => u.id === userId)!;
      const projects = userProjectMap[userId] || ['proj-007'];
      const projectId = projects[Math.floor(rand() * projects.length)];
      const project = MOCK_PROJECTS.find(p => p.id === projectId)!;
      const company = MOCK_COMPANIES.find(c => c.id === user.companyId)!;

      logCounter++;
      const minutes = minuteOptions[Math.floor(rand() * minuteOptions.length)];
      const approval = approvalStatuses[Math.floor(rand() * approvalStatuses.length)];
      const billable = rand() > 0.3;
      const description = DESCRIPTIONS[Math.floor(rand() * DESCRIPTIONS.length)];

      logs.push({
        id: `tl-${String(logCounter).padStart(4, '0')}`,
        teamworkLogId: 500000 + logCounter,
        userId,
        projectId,
        date: dateStr,
        minutes,
        description,
        jobNumber: project.jobCode,
        approvalStatus: approval,
        billable,
        syncedAt: '2026-03-19T18:30:00Z',
        deletedAt: null,
        createdAt: `${dateStr}T17:00:00Z`,
        updatedAt: `${dateStr}T17:00:00Z`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          employeeCode: user.employeeCode,
          departmentCode: user.departmentCode,
          fncCode: user.fncCode,
          company: { id: company.id, name: company.name },
        },
        project: {
          id: project.id,
          name: project.name,
          jobCode: project.jobCode,
          teamworkProjectId: project.teamworkProjectId,
        },
      });
    }
  }

  return logs;
}

export const MOCK_TIME_LOGS = generateTimeLogs();

// ─── Filters ─────────────────────────────────────────────────────────────────

export const MOCK_FILTERS = {
  users: MOCK_USERS
    .filter(u => u.deletedAt === null)
    .map(u => ({ id: u.id, name: u.name }))
    .sort((a, b) => a.name.localeCompare(b.name)),
  projects: MOCK_PROJECTS
    .map(p => ({ id: p.id, name: p.name }))
    .sort((a, b) => a.name.localeCompare(b.name)),
  companies: MOCK_COMPANIES
    .map(c => ({ id: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name)),
};

// ─── Sync Status ─────────────────────────────────────────────────────────────

export const MOCK_SYNC_STATUS = {
  success: true,
  health: {
    teamworkConnected: true,
    databaseConnected: true,
    lastSyncDate: '2026-03-19T18:30:00Z',
  },
};

// ─── Mock Exports History ────────────────────────────────────────────────────

export const MOCK_EXPORTS = [
  {
    id: 'exp-001',
    fileName: 'advtime_03192026.txt',
    s3Key: 'exports/advtime_03192026.txt',
    dateRangeStart: '2026-03-01',
    dateRangeEnd: '2026-03-15',
    recordCount: 87,
    fileSize: 24300,
    createdAt: '2026-03-19T14:00:00Z',
    expiresAt: '2026-03-26T14:00:00Z',
    isExpired: false,
  },
  {
    id: 'exp-002',
    fileName: 'advtime_03142026.txt',
    s3Key: 'exports/advtime_03142026.txt',
    dateRangeStart: '2026-02-16',
    dateRangeEnd: '2026-02-28',
    recordCount: 62,
    fileSize: 17400,
    createdAt: '2026-03-14T10:00:00Z',
    expiresAt: '2026-03-21T10:00:00Z',
    isExpired: false,
  },
  {
    id: 'exp-003',
    fileName: 'advtime_02282026.txt',
    s3Key: 'exports/advtime_02282026.txt',
    dateRangeStart: '2026-02-01',
    dateRangeEnd: '2026-02-15',
    recordCount: 53,
    fileSize: 14900,
    createdAt: '2026-02-28T16:00:00Z',
    expiresAt: '2026-03-07T16:00:00Z',
    isExpired: true,
  },
];

// ─── Admin Stats (precomputed from MOCK_TIME_LOGS) ──────────────────────────

export function getMockAdminStats() {
  const logs = MOCK_TIME_LOGS;
  const approved = logs.filter(l => l.approvalStatus === 'approved').length;
  const inReview = logs.filter(l => l.approvalStatus === 'inreview').length;
  const needsChanges = logs.filter(l => l.approvalStatus === 'needschanges').length;
  const notInWorkflow = logs.filter(l => l.approvalStatus === null).length;
  const billable = logs.filter(l => l.billable).length;
  const nonBillable = logs.filter(l => !l.billable).length;

  const syncDates = [
    new Date('2026-03-19T18:30:00Z'),
    new Date('2026-03-19T14:00:00Z'),
    new Date('2026-03-19T09:00:00Z'),
    new Date('2026-03-18T18:30:00Z'),
    new Date('2026-03-18T14:00:00Z'),
    new Date('2026-03-18T09:00:00Z'),
    new Date('2026-03-17T18:30:00Z'),
    new Date('2026-03-17T14:00:00Z'),
    new Date('2026-03-17T09:00:00Z'),
    new Date('2026-03-16T18:30:00Z'),
  ];

  return {
    totalTimeLogs: logs.length,
    totalUsers: MOCK_USERS.filter(u => u.deletedAt === null).length,
    totalProjects: MOCK_PROJECTS.length,
    lastSync: syncDates[0],
    recentSyncs: syncDates,
    approvalStats: { approved, inReview, needsChanges, notInWorkflow },
    billableStats: { billable, nonBillable },
  };
}
