/**
 * Users API Route
 * GET: list all users, POST: create a new user
 * @module app/api/users/route
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllUsers, createUser } from "@/lib/db/queries/users";

export async function GET(): Promise<NextResponse> {
  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email, name, role, password } = body;

    if (!email || !name || !role || !password) {
      return NextResponse.json(
        { error: "Email, name, role, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be admin, editor, or viewer" },
        { status: 400 }
      );
    }

    const user = await createUser({ email, name, role, password });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
