/**
 * Exports API Route
 * Handles fetching export history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getExports } from '@/lib/export-store';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * GET /api/exports
 * Fetch recent exports
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  const exports = getExports(limit).map(exp => ({
    ...exp,
    downloadUrl: exp.isExpired ? null : `${BASE_PATH}/api/exports/${exp.id}/download`,
  }));

  return NextResponse.json({
    success: true,
    data: exports,
  });
}

/**
 * DELETE /api/exports
 * Clear all export history
 */
export async function DELETE() {
  const { clearExports } = await import('@/lib/export-store');
  clearExports();
  return NextResponse.json({ success: true });
}
