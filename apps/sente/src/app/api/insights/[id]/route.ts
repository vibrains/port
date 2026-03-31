/**
 * Insights [id] API Route
 * PUT: update insight, DELETE: delete insight
 * @module app/api/insights/[id]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { MOCK_CLIENT_ID } from "@/lib/mock-data";
import { updateInsight, deleteInsight } from "@/lib/db/queries/insights";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const clientId = MOCK_CLIENT_ID;

    const { id } = await params;
    const body = await request.json();
    const { title, content, promptContext } = body;

    const insight = await updateInsight(clientId, id, { title, content, promptContext });
    return NextResponse.json({ insight });
  } catch (error) {
    console.error("Error updating insight:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update insight";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const clientId = MOCK_CLIENT_ID;

    const { id } = await params;
    await deleteInsight(clientId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting insight:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete insight";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
