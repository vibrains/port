/**
 * Users API Route
 * Frontend Lead Agent - Phase 4 + User Management
 *
 * Endpoints for managing users (mock implementation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { MOCK_USERS } from '@/lib/mock-data';

/**
 * GET /api/users
 * Fetch all active (non-deleted) users
 */
export async function GET() {
  const users = MOCK_USERS
    .filter(u => u.deletedAt === null)
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      employeeCode: u.employeeCode,
      departmentCode: u.departmentCode,
      fncCode: u.fncCode,
      companyId: u.companyId,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ success: true, data: users });
}

/**
 * POST /api/users
 * Create a new user (mock — returns success with provided data)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    return NextResponse.json({
      success: true,
      data: {
        id: `usr-${Date.now()}`,
        ...body,
        googleId: `manual-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      },
      { status: 500 }
    );
  }
}
