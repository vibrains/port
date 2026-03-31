/**
 * Teamwork Webhook Endpoint
 * Receives real-time updates from Teamwork (mock implementation)
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/webhooks/teamwork
 * Handle Teamwork webhook events (mock — acknowledges receipt)
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    event: 'mock',
    processedAt: new Date().toISOString(),
  });
}
