import { NextRequest, NextResponse } from "next/server";
import { MOCK_ALL_PROJECTS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyIdsParam = searchParams.get("companyIds");

    // If no companyIds provided, return empty array
    if (!companyIdsParam || companyIdsParam.trim() === "") {
      return NextResponse.json([]);
    }

    // Parse comma-separated company IDs
    const companyIds = companyIdsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (companyIds.length === 0) {
      return NextResponse.json([]);
    }

    const projects = MOCK_ALL_PROJECTS
      .filter((p) => p.company_id && companyIds.includes(p.company_id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        company_id: p.company_id,
      }));

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
