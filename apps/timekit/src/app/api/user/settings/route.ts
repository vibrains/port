/**
 * User Settings API Route
 * Frontend Lead Agent - Phase 5 Enhancement
 *
 * Endpoint for managing user export settings (mock implementation)
 */

import { NextRequest, NextResponse } from 'next/server';
import { MOCK_USERS } from '@/lib/mock-data';

/**
 * GET /api/user/settings
 * Fetch first user's export settings
 */
export async function GET() {
  const user = MOCK_USERS[0];

  return NextResponse.json({
    success: true,
    data: {
      employeeCode: user.employeeCode || '',
      departmentCode: user.departmentCode || '',
      fncCode: user.fncCode || '',
    },
  });
}

/**
 * PATCH /api/user/settings
 * Update first user's export settings (mock — returns provided values)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeCode, departmentCode, fncCode } = body;

    if (employeeCode && employeeCode.length > 6) {
      return NextResponse.json(
        { success: false, error: 'Employee Code must be 6 characters or less' },
        { status: 400 }
      );
    }

    if (departmentCode && departmentCode.length > 4) {
      return NextResponse.json(
        { success: false, error: 'Department Code must be 4 characters or less' },
        { status: 400 }
      );
    }

    if (fncCode && fncCode.length > 10) {
      return NextResponse.json(
        { success: false, error: 'FNC Code must be 10 characters or less' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        employeeCode: employeeCode || '',
        departmentCode: departmentCode || '',
        fncCode: fncCode || '',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user settings',
      },
      { status: 500 }
    );
  }
}
