/**
 * Executive Summary API Route
 * GET: returns channel summary content
 * PUT: saves channel summary (admin only)
 * @module app/api/executive-summary/route
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getExecutiveSummary,
  upsertExecutiveSummary,
} from "@/lib/db/queries/executive-summary";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = session.user.clientIds?.[0];
    if (!clientId) {
      return NextResponse.json({ error: "No client assigned" }, { status: 400 });
    }

    const url = new URL(request.url);
    const channel = url.searchParams.get("channel");
    const month = url.searchParams.get("month");
    if (!channel || !month) {
      return NextResponse.json({ error: "channel and month are required" }, { status: 400 });
    }

    const content = await getExecutiveSummary(clientId, channel, month);
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error fetching executive summary:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clientId = session.user.clientIds?.[0];
    if (!clientId) {
      return NextResponse.json({ error: "No client assigned" }, { status: 400 });
    }

    const body = await request.json() as { channel?: string; month?: string; content?: string };
    const { channel, month, content } = body;

    if (!channel || !month || content === undefined) {
      return NextResponse.json(
        { error: "channel, month, and content are required" },
        { status: 400 }
      );
    }

    await upsertExecutiveSummary(clientId, channel, month, content);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving executive summary:", error);
    return NextResponse.json({ error: "Failed to save summary" }, { status: 500 });
  }
}
