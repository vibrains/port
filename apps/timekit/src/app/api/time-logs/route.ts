/**
 * Time Logs API Route
 * Frontend Lead Agent - Phase 4
 *
 * Endpoint for fetching time logs with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TIME_LOGS, MOCK_COMPANIES } from '@/lib/mock-data';
import { timeLogQuerySchema, formatValidationErrors } from '@/lib/validation';

/**
 * GET /api/time-logs
 * Fetch time logs with optional filters and pagination
 *
 * Query parameters:
 * - startDate: Filter by start date (YYYY-MM-DD)
 * - endDate: Filter by end date (YYYY-MM-DD)
 * - userId: Filter by user ID
 * - projectId: Filter by project ID
 * - companyId: Filter by company ID (filters users by company)
 * - approvalStatus: Filter by approval status (approved, inreview, needschanges, null, or all)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      userId: searchParams.get('userId') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      companyId: searchParams.get('companyId') || undefined,
      approvalStatus: searchParams.get('approvalStatus') || undefined,
      billableStatus: searchParams.get('billableStatus') || undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '50',
    };

    const validationResult = timeLogQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatValidationErrors(validationResult.error),
        },
        { status: 400 }
      );
    }

    const {
      startDate,
      endDate,
      userId,
      projectId,
      companyId,
      approvalStatus,
      billableStatus,
      page,
      pageSize,
    } = validationResult.data;

    // Filter mock data
    let filtered = [...MOCK_TIME_LOGS];

    if (startDate) {
      const s = startDate instanceof Date ? startDate.toISOString().split("T")[0] : String(startDate); filtered = filtered.filter(log => log.date >= s);
    }
    if (endDate) {
      const e = endDate instanceof Date ? endDate.toISOString().split("T")[0] : String(endDate); filtered = filtered.filter(log => log.date <= e);
    }
    if (userId) {
      filtered = filtered.filter(log => log.userId === userId);
    }
    if (projectId) {
      filtered = filtered.filter(log => log.projectId === projectId);
    }
    if (companyId) {
      // Support both UUID and numeric Teamwork company ID
      let resolvedCompanyId = companyId;
      if (/^\d+$/.test(companyId)) {
        const company = MOCK_COMPANIES.find(c => c.teamworkCompanyId === parseInt(companyId, 10));
        resolvedCompanyId = company?.id || 'no-match';
      }
      filtered = filtered.filter(log => {
        const user = log.user;
        return user.company?.id === resolvedCompanyId;
      });
    }
    if (approvalStatus && approvalStatus !== 'all') {
      if (approvalStatus === 'null') {
        filtered = filtered.filter(log => log.approvalStatus === null);
      } else {
        filtered = filtered.filter(log => log.approvalStatus === approvalStatus);
      }
    }
    if (billableStatus && billableStatus !== 'all') {
      filtered = filtered.filter(log => log.billable === (billableStatus === 'billable'));
    }

    // Sort by date descending
    filtered.sort((a, b) => b.date.localeCompare(a.date));

    // Calculate summary
    const totalMinutes = filtered.reduce((sum, log) => sum + log.minutes, 0);
    const approvedCount = filtered.filter(l => l.approvalStatus === 'approved').length;
    const inReviewCount = filtered.filter(l => l.approvalStatus === 'inreview').length;
    const needsChangesCount = filtered.filter(l => l.approvalStatus === 'needschanges').length;
    const notInWorkflowCount = filtered.filter(l => l.approvalStatus === null).length;

    // Pagination
    const totalCount = filtered.length;
    const skip = (page - 1) * pageSize;
    const paginated = filtered.slice(skip, skip + pageSize);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      summary: {
        totalMinutes,
        approvedCount,
        inReviewCount,
        needsChangesCount,
        notInWorkflowCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch time logs',
      },
      { status: 500 }
    );
  }
}
