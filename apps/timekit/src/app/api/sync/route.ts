/**
 * Sync API Route
 * Backend Lead Agent - Phase 2
 *
 * Endpoint for triggering Teamwork time log synchronization
 * (Mock implementation for portfolio demo)
 */

import { NextRequest, NextResponse } from 'next/server';
import { MOCK_SYNC_STATUS } from '@/lib/mock-data';

/**
 * POST /api/sync
 * Trigger time log synchronization (mock — no actual sync)
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    syncedLogs: 0,
    timestamp: new Date().toISOString(),
  });
}

/**
 * GET /api/sync
 * Get sync status and health
 */
export async function GET() {
  return NextResponse.json(MOCK_SYNC_STATUS);
}
