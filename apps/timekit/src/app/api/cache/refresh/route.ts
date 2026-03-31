/**
 * Cache Refresh API Route
 * Clears and refreshes project job code cache (mock implementation)
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'Cache refreshed successfully',
    updated: 0,
    stillNull: 1,
    total: 1,
  });
}
