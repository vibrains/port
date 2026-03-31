/**
 * Email Section Loading State
 * Shows skeleton loader while email content loads
 * @module app/(dashboard)/email/loading
 */

import { DashboardSkeleton } from "@/components/dashboard/skeleton";

export default function EmailLoading() {
  return <DashboardSkeleton />;
}
