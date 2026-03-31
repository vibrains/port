/**
 * Users [id] API Route
 * PUT: update user, DELETE: delete user
 * @module app/api/users/[id]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { updateUser, deleteUser } from "@/lib/db/queries/users";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, role, password } = body;

    if (role && !["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be admin, editor, or viewer" },
        { status: 400 }
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const user = await updateUser(id, { name, email, role, password });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    await deleteUser(id, "mock-user-id");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
