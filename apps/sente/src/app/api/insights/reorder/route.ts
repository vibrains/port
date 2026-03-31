/**
 * Insights Reorder API Route
 * PUT: batch-update sort order for month groups
 * @module app/api/insights/reorder/route
 */

import { NextRequest, NextResponse } from "next/server";
import { MOCK_CLIENT_ID } from "@/lib/mock-data";
import { updateSortOrders } from "@/lib/db/queries/insights";

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const clientId = MOCK_CLIENT_ID;

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
