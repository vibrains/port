/**
 * Dashboard layout with sidebar navigation and header
 * @module app/(dashboard)/layout
 */

import { Suspense } from "react";
import { Metadata } from "next";
import Image from "next/image";
import { DashboardHeader } from "@/components/dashboard/header";
import { MainNav } from "@/components/dashboard/nav/main-nav";

export const metadata: Metadata = {
  title: "Dashboard | Sente",
  description: "Marketing Performance Dashboard",
};

// Dashboard routes rely on request-time auth/session data and should not be statically prerendered.
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop only */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background">
        <div className="flex h-14 items-center border-b px-6">
          <Image
            src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/sente-logo-black.svg`}
            alt="Sente"
            width={120}
            height={28}
            priority
            className="h-7 w-auto"
          />
        </div>
        <div className="flex-1 overflow-auto py-4">
          <Suspense fallback={null}>
            <MainNav />
          </Suspense>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <main id="pdf-content" className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
