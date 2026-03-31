/**
 * Email Flows Client Component
 * Renders flow DataTables, PieChart, and summary card with function-based props on the client side
 * @module components/email/flows-client
 */

"use client";

import {
  Workflow,
  TrendingUp,
  Mail,
} from "lucide-react";
import { DataTable } from "@/components/dashboard/data-table";
import { ChartContainer } from "@/components/charts/chart-container";
import { PieChart } from "@/components/charts/pie-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPercent, formatCurrency } from "@/lib/utils/format";
import type { KlaviyoFlow, PardotFlow } from "@/types/database";
import type { ColumnDef } from "@tanstack/react-table";

interface FlowsClientProps {
  klaviyoFlows: KlaviyoFlow[];
  pardotFlows: PardotFlow[];
  channelData: { name: string; value: number }[];
  klaviyoFlowCount: number;
  pardotFlowCount: number;
  avgOpenRate: number;
}

/**
 * Klaviyo flows table columns defined on the client side
 */
const klaviyoFlowColumns: ColumnDef<KlaviyoFlow>[] = [
  {
    accessorKey: "flow_name",
    header: "Flow Name",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("flow_name") || "Untitled"}</div>
    ),
  },
  {
    accessorKey: "channel",
    header: "Channel",
    cell: ({ row }) => {
      const channel = row.getValue("channel") as string;
      return (
        <Badge variant="outline">
          {channel?.toLowerCase() === "sms" ? "SMS" : "Email"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "active" ? "default" : "secondary"}>
          {status || "Unknown"}
        </Badge>
      );
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
 * Pardot flows table columns defined on the client side
 */
const pardotFlowColumns: ColumnDef<PardotFlow>[] = [
  {
    accessorKey: "program_name",
    header: "Program",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("program_name") || "Untitled"}</div>
    ),
  },
  {
    accessorKey: "step_type",
    header: "Step Type",
    cell: ({ row }) => (
      <Badge variant="outline">
        {(row.getValue("step_type") as string) || "Unknown"}
      </Badge>
    ),
  },
  {
    accessorKey: "step_name",
    header: "Step Name",
    cell: ({ row }) => row.getValue("step_name") || "—",
  },
  {
    accessorKey: "sent",
    header: "Sent",
    cell: ({ row }) => formatNumber(Number(row.getValue("sent")) || 0),
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
];

/**
 * Client component that renders flow DataTables, PieChart, and summary card.
 * Column definitions with cell renderers are kept on the client side
 * to avoid serialization errors.
 */
export function FlowsClient({
  klaviyoFlows,
  pardotFlows,
  channelData,
  klaviyoFlowCount,
  pardotFlowCount,
  avgOpenRate,
}: FlowsClientProps) {
  return (
    <>
      {/* Channel Breakdown Chart */}
      {channelData.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <ChartContainer
            title="Flow Distribution"
            description="Breakdown by channel and type"
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
                Flow Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Klaviyo Flows</span>
                  <span className="font-medium">{formatNumber(klaviyoFlowCount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pardot Programs</span>
                  <span className="font-medium">{formatNumber(pardotFlowCount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Open Rate</span>
                  <span className="font-medium">{formatPercent(avgOpenRate)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Klaviyo Flows Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Klaviyo Flows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={klaviyoFlows}
            columns={klaviyoFlowColumns}
            emptyMessage="No Klaviyo flows found for the selected month."
          />
        </CardContent>
      </Card>

      {/* Pardot Flows Table */}
      {pardotFlows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Pardot Automation Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={pardotFlows}
              columns={pardotFlowColumns}
              emptyMessage="No Pardot programs found for the selected month."
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
