/**
 * Web Section Loading State
 * Shows skeleton loader while web analytics content loads
 * @module app/(dashboard)/web/loading
 */

import { DashboardSkeleton } from "@/components/dashboard/skeleton";

export default function WebLoading() {
  return <DashboardSkeleton />;
}
