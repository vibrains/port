/**
 * Email Campaigns Client Component
 * Renders campaign DataTable with function-based props on the client side
 * @module components/email/campaigns-client
 */

"use client";

import { Mail, TrendingUp } from "lucide-react";
import { DataTable } from "@/components/dashboard/data-table";
import { ChartContainer } from "@/components/charts/chart-container";
import { PieChart } from "@/components/charts/pie-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPercent, formatCurrency } from "@/lib/utils/format";
import type { EmailCampaign } from "@/types/database";
import type { ColumnDef } from "@tanstack/react-table";

interface CampaignsClientProps {
  campaigns: EmailCampaign[];
  channelData?: { name: string; value: number }[];
  klaviyoCount?: number;
  pardotCount?: number;
  avgOpenRate?: number;
}

/**
 * Campaign table columns defined on the client side
 */
const campaignColumns: ColumnDef<EmailCampaign>[] = [
  {
    accessorKey: "campaign_name",
    header: "Campaign",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("campaign_name") || "Untitled"}</div>
    ),
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const source = row.getValue("source") as string;
      return (
        <Badge variant={source === "klaviyo" ? "default" : "secondary"}>
          {source === "klaviyo" ? "Klaviyo" : "Pardot"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "send_date",
    header: "Sent Date",
    cell: ({ row }) => {
      const raw = row.getValue("send_date");
      if (!raw) return "—";
      const dateObj = raw as Date;
      const str = typeof raw === "string"
        ? raw
        : `${dateObj.getUTCFullYear()}-${String(dateObj.getUTCMonth() + 1).padStart(2, "0")}-${String(dateObj.getUTCDate()).padStart(2, "0")}`;
      const [y, m, day] = str.split("T")[0].split("-").map(Number);
      return new Date(y, m - 1, day).toLocaleDateString();
    },
  },
  {
    accessorKey: "total_recipients",
    header: "Recipients",
    cell: ({ row }) => formatNumber(Number(row.getValue("total_recipients")) || 0),
  },
  {
    accessorKey: "open_rate",
    header: "Open Rate",
    cell: ({ row }) => formatPercent(Number(row.getValue("open_rate")) || 0),
  },
  {
    accessorKey: "click_rate",
    header: "Click Rate",
    cell: ({ row }) => formatPercent(Number(row.getValue("click_rate")) || 0),
  },
  {
    accessorKey: "revenue",
    header: "Revenue",
    cell: ({ row }) => {
      const rev = Number(row.original.revenue) || 0;
      return rev > 0 ? formatCurrency(rev) : "—";
    },
  },
];

/**
 * Client component that renders the campaigns DataTable.
 * Column definitions with cell renderers are kept on the client side
 * to avoid serialization errors.
 */
export function CampaignsClient({
  campaigns,
  channelData,
  klaviyoCount,
  pardotCount,
  avgOpenRate,
}: CampaignsClientProps) {
  return (
    <>
      {/* Campaign Distribution Chart */}
      {channelData && channelData.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <ChartContainer
            title="Campaign Distribution"
            description="Breakdown by source"
          >
            <PieChart
              data={channelData}
              innerRadius={0.6}
              showLegend
            />
          </ChartContainer>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Campaign Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Klaviyo Campaigns</span>
                  <span className="font-medium">{formatNumber(klaviyoCount ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pardot Campaigns</span>
                  <span className="font-medium">{formatNumber(pardotCount ?? 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Open Rate</span>
                  <span className="font-medium">{formatPercent(avgOpenRate ?? 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recent Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={campaigns}
            columns={campaignColumns}
          />
        </CardContent>
      </Card>
    </>
  );
}
