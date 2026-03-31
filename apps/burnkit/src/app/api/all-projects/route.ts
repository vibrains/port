import { NextRequest, NextResponse } from "next/server";
import { MOCK_ALL_PROJECTS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyIds = searchParams.get("companyIds");

    let projects = MOCK_ALL_PROJECTS;

    // Filter by company IDs if provided
    if (companyIds) {
      const companyIdArray = companyIds
        .split(",")
        .filter((id) => id.trim() !== "");
      if (companyIdArray.length > 0) {
        projects = projects.filter(
          (p) => p.company_id && companyIdArray.includes(p.company_id)
        );
      }
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching all projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
