import { NextResponse } from "next/server";
import { MOCK_ALL_COMPANIES } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(MOCK_ALL_COMPANIES);
  } catch (error) {
    console.error("Error fetching all companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
