/**
 * User Update API Route
 * Admin endpoint for updating and deleting users (mock implementation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { MOCK_USERS } from '@/lib/mock-data';

/**
 * PUT /api/users/[id]
 * Update user export settings
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const user = MOCK_USERS.find(u => u.id === id);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: body.name ?? user.name,
        email: body.email ?? user.email,
        employeeCode: body.employeeCode ?? user.employeeCode,
        departmentCode: body.departmentCode ?? user.departmentCode,
        fncCode: body.fncCode ?? user.fncCode,
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
        error: error instanceof Error ? error.message : 'Failed to update user',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Soft delete a user (mock — returns success message)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = MOCK_USERS.find(u => u.id === id);

  if (!user) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      message: `Archived user ${user.name}. Time logs and exports preserved.`,
    },
  });
}
