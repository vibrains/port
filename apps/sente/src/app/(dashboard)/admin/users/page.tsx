/**
 * Admin Users Page
 * Server component that fetches users and renders the client component
 * @module app/(dashboard)/admin/users/page
 */

import { Metadata } from "next";
import { getAllUsers } from "@/lib/db/queries/users";
import { UsersClient } from "@/components/admin/users-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Users | Admin | Sente",
  description: "Manage user accounts and permissions",
};

export default async function UsersPage() {
  const users = await getAllUsers();

  return <UsersClient initialUsers={users} />;
}
