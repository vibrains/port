import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  // Time logs are complex and not shown in main views — return empty data
  return NextResponse.json({ reqId: "mock", data: [] });
}
