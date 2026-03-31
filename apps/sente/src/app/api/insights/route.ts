/**
 * Insights API Route
 * GET: list insights with optional channel filter
 * POST: create a new insight
 * DELETE: delete all insights for a month
 * @module app/api/insights/route
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { MOCK_CLIENT_ID } from "@/lib/mock-data";
import { getInsights, createInsight, deleteInsightsByGroupId, deleteInsightsByMonth } from "@/lib/db/queries/insights";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const clientId = MOCK_CLIENT_ID;

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel") ?? undefined;

    const insights = await getInsights(clientId, channel);
    return NextResponse.json({ insights });
  } catch (error) {
    console.error("Error fetching insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const clientId = MOCK_CLIENT_ID;

    const body = await request.json();
    const { title, month, groupId: existingGroupId, channel: restoreChannel } = body;

    const channelTitles: Record<string, string> = {
      "null": "Cross-Channel Strategic Analysis",
      "email": "Email Channel Analysis",
      "web": "Web Channel Analysis",
      "social": "Social Channel Analysis",
    };

    // Restore a single channel insight within an existing group
    if (existingGroupId && restoreChannel !== undefined) {
      const chKey = restoreChannel === null ? "null" : restoreChannel;
      const chTitle = channelTitles[chKey] ?? "Analysis";
      const insight = await createInsight({
        clientId,
        channel: restoreChannel,
        title: chTitle,
        content: "",
        generatedBy: "manual",
        model: "manual",
        promptContext: { groupId: existingGroupId, monthLabel: title ?? "", targetMonth: month },
      });
      return NextResponse.json({ insight }, { status: 201 });
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const groupId = randomUUID();

    const channelEntries: [string | null, string][] = [
      [null, "Cross-Channel Strategic Analysis"],
      ["email", "Email Channel Analysis"],
      ["web", "Web Channel Analysis"],
      ["social", "Social Channel Analysis"],
    ];

    const insights = await Promise.all(
      channelEntries.map(([ch, chTitle]) =>
        createInsight({
          clientId,
          channel: ch,
          title: chTitle,
          content: "",
          generatedBy: "manual",
          model: "manual",
          promptContext: { groupId, monthLabel: title, targetMonth: month },
        })
      )
    );

    return NextResponse.json({ insights }, { status: 201 });
  } catch (error) {
    console.error("Error creating insight:", error);
    return NextResponse.json(
      { error: "Failed to create insight" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const clientId = MOCK_CLIENT_ID;

    const body = await request.json();
    const { groupId } = body;

    if (!groupId || typeof groupId !== "string") {
      return NextResponse.json({ error: "groupId is required" }, { status: 400 });
    }

    // Try groupId-based delete first; fall back to month-based for legacy insights
    let deleted = await deleteInsightsByGroupId(clientId, groupId);
    if (deleted === 0 && /^\d{4}-\d{2}$/.test(groupId)) {
      deleted = await deleteInsightsByMonth(clientId, groupId);
    }
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("Error deleting insights:", error);
    return NextResponse.json(
      { error: "Failed to delete insights" },
      { status: 500 }
    );
  }
}
