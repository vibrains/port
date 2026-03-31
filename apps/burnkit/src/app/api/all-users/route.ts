import { NextResponse } from "next/server";
import { MOCK_ALL_USERS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(MOCK_ALL_USERS);
  } catch (error) {
    console.error("Error fetching all users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
