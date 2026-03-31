/**
 * Export URL Regeneration API Route
 * Regenerates presigned URL for an export (mock implementation)
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/exports/[id]/regenerate
 * Regenerate presigned URL for an expired export
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return NextResponse.json({
    success: true,
    downloadUrl: `#regenerated-${id}`,
  });
}
