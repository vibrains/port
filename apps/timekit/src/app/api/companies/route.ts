/**
 * Companies API Route
 *
 * Endpoint for fetching list of companies
 */

import { NextResponse } from 'next/server';
import { MOCK_COMPANIES, MOCK_USERS, MOCK_PROJECTS } from '@/lib/mock-data';

// Cache this route data for 10 minutes (companies change infrequently)
export const revalidate = 600;

/**
 * GET /api/companies
 * Fetch all companies with user/project counts
 */
export async function GET() {
  const data = MOCK_COMPANIES
    .map(company => ({
      id: company.id,
      name: company.name,
      teamworkCompanyId: company.teamworkCompanyId,
      userCount: MOCK_USERS.filter(u => u.companyId === company.id && u.deletedAt === null).length,
      projectCount: MOCK_PROJECTS.filter(p => p.companyId === company.id).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const response = NextResponse.json({ success: true, data });
  response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
  return response;
}
