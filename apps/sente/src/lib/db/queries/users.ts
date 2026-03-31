/**
 * User management database queries (MOCK)
 * @module lib/db/queries/users
 */

import type { User } from "@/types/database";
import { mockUsers } from "@/lib/mock-data";

// In-memory mutable copy
const users = [...mockUsers];

export async function getAllUsers(): Promise<User[]> {
  return [...users].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getUserById(id: string): Promise<User | null> {
  return users.find((u) => u.id === id) ?? null;
}

export async function createUser(data: {
  email: string;
  name: string;
  role: string;
  password: string;
}): Promise<User> {
  const user: User = {
    id: crypto.randomUUID(),
    email: data.email,
    name: data.name,
    role: data.role as User["role"],
    client_ids: ["550e8400-e29b-41d4-a716-446655440000"],
    created_at: new Date().toISOString(),
    last_login_at: null,
  };
  users.unshift(user);
  return user;
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; role?: string; password?: string }
): Promise<User> {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("User not found");
  if (data.name !== undefined) users[idx].name = data.name;
  if (data.email !== undefined) users[idx].email = data.email;
  if (data.role !== undefined) users[idx].role = data.role as User["role"];
  // password is accepted but we don't store hashes in mock mode
  return { ...users[idx] };
}

export async function deleteUser(id: string, currentUserId: string): Promise<void> {
  if (id === currentUserId) throw new Error("Cannot delete your own account");
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) throw new Error("User not found");
  if (users[idx].role === "admin") {
    const adminCount = users.filter((u) => u.role === "admin").length;
    if (adminCount <= 1) throw new Error("Cannot delete the last admin user");
  }
  users.splice(idx, 1);
}
