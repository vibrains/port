/**
 * Projects API Route
 * Frontend Lead Agent - Phase 4
 *
 * Endpoint for fetching all projects (for filter dropdown)
 */

import { NextResponse } from 'next/server';
import { MOCK_PROJECTS } from '@/lib/mock-data';

// Cache this route data for 10 minutes (projects change infrequently)
export const revalidate = 600;

/**
 * GET /api/projects
 * Fetch all projects
 */
export async function GET() {
  const data = MOCK_PROJECTS
    .map(p => ({ id: p.id, name: p.name, jobCode: p.jobCode, teamworkProjectId: p.teamworkProjectId }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const response = NextResponse.json({ success: true, data });
  response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
  return response;
}
