/**
 * Dashboard Loading State
 * Shows skeleton loader while dashboard content loads
 * @module app/(dashboard)/loading
 */

import { DashboardSkeleton } from "@/components/dashboard/skeleton";

export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
