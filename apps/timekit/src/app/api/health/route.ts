/**
 * Health Check API Route
 * Backend Lead Agent - Phase 2
 *
 * Endpoint for checking application health status
 * (Mock implementation for portfolio demo)
 */

import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: true,
      teamwork: true,
    },
    details: {
      database: { connected: true },
      teamwork: {
        connected: true,
        lastSyncDate: '2026-03-19T18:30:00Z',
      },
    },
  });
}
