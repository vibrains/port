/**
 * Insights Reorder API Route
 * PUT: batch-update sort order for month groups
 * @module app/api/insights/reorder/route
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { updateSortOrders } from "@/lib/db/queries/insights";

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

    const body = await request.json();
    const { orders } = body;

    if (!Array.isArray(orders)) {
      return NextResponse.json({ error: "orders array is required" }, { status: 400 });
    }

    await updateSortOrders(clientId, orders);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating sort orders:", error);
    return NextResponse.json(
      { error: "Failed to update sort orders" },
      { status: 500 }
    );
  }
}
