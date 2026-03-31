/**
 * Upload API Route (MOCK)
 * Handles CSV file uploads — returns mock success responses
 * @module app/api/upload/route
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUploadHistory } from "@/lib/db/queries/uploads";

/**
 * POST handler for file uploads — mock mode returns success without processing
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden. Admin access required for uploads." }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Mock mode: return success without actual processing
    return NextResponse.json({
      success: true,
      uploadId: crypto.randomUUID(),
      parsed: 50,
      inserted: 50,
      sourceType: "mock",
      warnings: [],
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET handler for upload history
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const clientId = session.user.clientIds?.[0];
    if (!clientId) {
      return NextResponse.json({ error: "No client associated with user account." }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const month = searchParams.get("month") || undefined;

    const uploads = await getUploadHistory(clientId, month);
    const paginatedUploads = uploads.slice(offset, offset + limit);

    return NextResponse.json({
      uploads: paginatedUploads,
      pagination: { total: uploads.length, limit, offset, hasMore: offset + limit < uploads.length },
    });
  } catch (error) {
    console.error("Get upload history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE handler for upload history — mock mode
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get("uploadId");
    if (!uploadId) {
      return NextResponse.json({ error: "Missing uploadId." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      uploadId,
      deleted: { klaviyoFlows: 0, emailCampaigns: 0, pardotFlows: 0, ga4Pages: 0, ga4Acquisition: 0, socialPosts: 0, uploadRecord: 1 },
    });
  } catch (error) {
    console.error("Delete upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
