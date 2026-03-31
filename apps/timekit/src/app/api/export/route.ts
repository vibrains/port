/**
 * Export API Route
 * Creates a new time log export with filter support
 */

import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TIME_LOGS, MOCK_COMPANIES } from '@/lib/mock-data';
import { addExport } from '@/lib/export-store';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

function filterLogs(body: Record<string, string | undefined>) {
  const { startDate, endDate, userId, projectId, companyId, approvalStatus, billableStatus } = body;

  let filtered = [...MOCK_TIME_LOGS];

  if (startDate) filtered = filtered.filter(log => log.date >= startDate);
  if (endDate) filtered = filtered.filter(log => log.date <= endDate);
  if (userId) filtered = filtered.filter(log => log.userId === userId);
  if (projectId) filtered = filtered.filter(log => log.projectId === projectId);
  if (companyId) {
    let resolved = companyId;
    if (/^\d+$/.test(companyId)) {
      const c = MOCK_COMPANIES.find(co => co.teamworkCompanyId === parseInt(companyId, 10));
      resolved = c?.id || 'no-match';
    }
    filtered = filtered.filter(log => log.user.company?.id === resolved);
  }
  if (!approvalStatus) {
    // No status specified: default to approved only
    filtered = filtered.filter(log => log.approvalStatus === 'approved');
  } else if (approvalStatus !== 'all') {
    filtered = filtered.filter(log =>
      approvalStatus === 'null' ? log.approvalStatus === null : log.approvalStatus === approvalStatus
    );
  }
  // approvalStatus === 'all' → no filtering
  if (billableStatus && billableStatus !== 'all') {
    filtered = filtered.filter(log => log.billable === (billableStatus === 'billable'));
  }

  return filtered;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const matchingLogs = filterLogs(body);

    const newExport = addExport({
      dateRangeStart: body.startDate || '2026-02-01',
      dateRangeEnd: body.endDate || '2026-03-19',
      recordCount: matchingLogs.length,
      filters: {
        userId: body.userId,
        projectId: body.projectId,
        companyId: body.companyId,
        approvalStatus: body.approvalStatus,
        billableStatus: body.billableStatus,
      },
    });

    return NextResponse.json({
      success: true,
      exportId: newExport.id,
      downloadUrl: `${BASE_PATH}/api/exports/${newExport.id}/download`,
      fileName: newExport.fileName,
      expiresAt: newExport.expiresAt,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create export' },
      { status: 500 }
    );
  }
}
