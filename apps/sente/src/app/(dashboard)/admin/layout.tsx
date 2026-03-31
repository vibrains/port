/**
 * Admin Layout
 * Layout for admin pages with navigation and access control
 * @module app/(dashboard)/admin/layout
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { Upload, History, Shield, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin | Sente",
  description: "Administration panel for managing data uploads",
};

// Admin pages rely on per-request session state and must never be statically prerendered.
export const dynamic = "force-dynamic";

/**
 * Admin navigation items
 */
const adminNavItems = [
  {
    href: "/admin/upload",
    label: "Upload Data",
    icon: Upload,
    description: "Import marketing data from CSV files",
  },
  {
    href: "/admin/uploads",
    label: "Upload History",
    icon: History,
    description: "View and manage past uploads",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    description: "Manage user accounts and permissions",
  },
];

/**
 * Admin layout with sidebar navigation
 * Restricts access to admin users only
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check admin role
  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Administration</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Manage data uploads and system settings
        </p>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <nav className="space-y-1">
          {adminNavItems.map((item) => (
            <AdminNavLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Main content */}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

/**
 * Admin navigation link component
 */
interface AdminNavLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

function AdminNavLink({ href, label, icon: Icon, description }: AdminNavLinkProps) {
  // Note: In a real app, you'd use usePathname() to determine active state
  // For server components, we can use a client component wrapper or pass the pathname
  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors",
        "hover:bg-muted group"
      )}
    >
      <Icon className="w-5 h-5 text-muted-foreground group-hover:text-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
    </Link>
  );
}
