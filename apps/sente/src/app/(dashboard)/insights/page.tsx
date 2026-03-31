/**
 * Insights Page
 * Server component that fetches insights and renders the client component
 * @module app/(dashboard)/insights/page
 */

import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInsights } from "@/lib/db/queries/insights";
import { InsightsClient } from "@/components/insights/insights-client";
import { Lightbulb } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Insights | Sente",
  description: "Marketing insights across all channels",
};

export default async function InsightsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const clientId = session.user.clientIds?.[0];
  if (!clientId) redirect("/");

  const insights = await getInsights(clientId);
  const canManageInsights = session.user.role === "admin";

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Insights</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Analysis and recommendations across all marketing channels
        </p>
      </div>
      <InsightsClient initialInsights={insights} canManageInsights={canManageInsights} />
    </div>
  );
}
