/**
 * Social Section Loading State
 * Shows skeleton loader while social media content loads
 * @module app/(dashboard)/social/loading
 */

import { DashboardSkeleton } from "@/components/dashboard/skeleton";

export default function SocialLoading() {
  return <DashboardSkeleton />;
}
