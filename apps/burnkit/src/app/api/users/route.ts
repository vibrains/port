import { NextRequest, NextResponse } from "next/server";
import { MOCK_ALL_USERS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    // Return a subset of users (in mock mode, return all since we don't track company membership)
    const users = MOCK_ALL_USERS.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      department_code: u.department_code,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
