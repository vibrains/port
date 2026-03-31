/**
 * Dashboard header component
 * @module components/dashboard/header
 */

import { Suspense } from "react";
import { MobileNav } from "@/components/dashboard/nav/mobile-nav";
import { GlobalDateFilter } from "@/components/dashboard/global-date-filter";
import { PDFExportButton } from "@/components/dashboard/pdf-export-button";

/**
 * Dashboard header component
 * Displays the mobile navigation trigger, global date filter, and user navigation
 */
export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <MobileNav />
      <div className="flex-1">
        <h1 className="text-lg font-semibold">Senté Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <Suspense fallback={null}>
          <PDFExportButton />
        </Suspense>
        <Suspense fallback={null}>
          <GlobalDateFilter />
        </Suspense>
      </div>
    </header>
  );
}
