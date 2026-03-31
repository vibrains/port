import { NextResponse } from 'next/server';

/**
 * POST /api/clear-cache
 * Clears the job number cache tables (mock implementation)
 */
export async function POST() {
  return NextResponse.json({
    success: true,
    data: {
      message: 'Cache cleared successfully',
      deletedTasks: 0,
      deletedProjects: 0,
    },
  });
}
