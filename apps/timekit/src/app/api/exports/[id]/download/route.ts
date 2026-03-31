/**
 * Export Download Route
 * Generates a fixed-width Advantage payroll file using stored filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExportById } from '@/lib/export-store';
import { MOCK_TIME_LOGS, MOCK_COMPANIES } from '@/lib/mock-data';

function pad(str: string, len: number, align: 'left' | 'right' = 'left'): string {
  const s = str.slice(0, len);
  return align === 'right' ? s.padStart(len) : s.padEnd(len);
}

function formatLine(log: typeof MOCK_TIME_LOGS[0]): string {
  // Parse YYYY-MM-DD directly to avoid timezone offset issues
  const [yyyy, mm, dd] = log.date.split('-');
  const dateStr = `${mm}/${dd}/${yyyy}`;
  const hours = (log.minutes / 60).toFixed(2);
  const empCode = log.user.employeeCode || 'XXXXXX';
  const deptCode = log.user.departmentCode || '    ';
  const jobNum = log.jobNumber || '';
  const jobComp = log.billable ? ' 7' : ' 5';
  const fncCode = log.user.fncCode || '';
  const comment = (log.description || '').slice(0, 300);

  return (
    pad(dateStr, 10) +
    pad(empCode, 6) +
    pad(deptCode, 4) +
    pad(hours, 9, 'right') +
    pad(jobNum, 30, 'right') +
    jobComp +
    pad(fncCode, 10) +
    pad(comment, 300)
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const exp = getExportById(id);

  if (!exp) {
    return NextResponse.json({ error: 'Export not found' }, { status: 404 });
  }

  if (exp.isExpired) {
    return NextResponse.json({ error: 'Export link expired' }, { status: 410 });
  }

  // Apply date range + all stored filters
  let logs = MOCK_TIME_LOGS.filter(
    log => log.date >= exp.dateRangeStart && log.date <= exp.dateRangeEnd
  );

  const f = exp.filters;
  if (f?.userId) logs = logs.filter(log => log.userId === f.userId);
  if (f?.projectId) logs = logs.filter(log => log.projectId === f.projectId);
  if (f?.companyId) {
    let resolved = f.companyId;
    if (/^\d+$/.test(f.companyId)) {
      const c = MOCK_COMPANIES.find(co => co.teamworkCompanyId === parseInt(f.companyId!, 10));
      resolved = c?.id || 'no-match';
    }
    logs = logs.filter(log => log.user.company?.id === resolved);
  }
  if (!f?.approvalStatus) {
    logs = logs.filter(log => log.approvalStatus === 'approved');
  } else if (f.approvalStatus !== 'all') {
    logs = logs.filter(log =>
      f.approvalStatus === 'null' ? log.approvalStatus === null : log.approvalStatus === f.approvalStatus
    );
  }
  if (f?.billableStatus && f.billableStatus !== 'all') {
    logs = logs.filter(log => log.billable === (f.billableStatus === 'billable'));
  }

  const lines = logs.map(formatLine);
  const content = lines.join('\n');

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="${exp.fileName}"`,
    },
  });
}
