/**
 * Web Traffic Client Component
 * Renders traffic charts and DataTable with function-based props on the client side
 * @module components/web/traffic-client
 */

"use client";

import { Globe } from "lucide-react";
import { DataTable } from "@/components/dashboard/data-table";
import { ChartContainer } from "@/components/charts/chart-container";
import { BarChart } from "@/components/charts/bar-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import type { GA4Acquisition } from "@/types/database";
import type { ColumnDef } from "@tanstack/react-table";

interface TrafficClientProps {
  acquisition: GA4Acquisition[];
  topSources: { name: string; value: number }[];
  userTypeData: { name: string; value: number }[];
}

/**
 * Acquisition table columns
 */
const acquisitionColumns: ColumnDef<GA4Acquisition>[] = [
  {
    accessorKey: "first_user_source",
    header: "Source",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("first_user_source") || "Direct"}</div>
    ),
  },
  {
    accessorKey: "sessions",
    header: "Sessions",
    cell: ({ row }) => formatNumber(Number(row.getValue("sessions")) || 0),
  },
  {
    accessorKey: "new_users",
    header: "New Users",
    cell: ({ row }) => formatNumber(Number(row.getValue("new_users")) || 0),
  },
  {
    accessorKey: "total_users",
    header: "Total Users",
    cell: ({ row }) => formatNumber(Number(row.getValue("total_users")) || 0),
  },
  {
    accessorKey: "engagement_rate",
    header: "Engagement Rate",
    cell: ({ row }) => formatPercent(Number(row.getValue("engagement_rate")) || 0),
  },
  {
    accessorKey: "avg_engagement_time",
    header: "Avg. Engagement",
    cell: ({ row }) => {
      const seconds = Number(row.getValue("avg_engagement_time")) || 0;
      return `${Math.round(seconds)}s`;
    },
  },
];

/**
 * Client component that renders traffic charts and acquisition DataTable.
 * Column definitions with cell renderers and chart formatter functions
 * are kept on the client side to avoid serialization errors.
 */
export function TrafficClient({
  acquisition,
  topSources,
  userTypeData,
}: TrafficClientProps) {
  return (
    <>
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartContainer
          title="Traffic by Source"
          description="Sessions by acquisition source"
        >
          <BarChart
            data={topSources}
            bars={[{ key: "value", name: "Sessions", color: "#3b82f6" }]}
            yAxisFormatter={(value: number) => formatNumber(value)}
          />
        </ChartContainer>

        <ChartContainer
          title="User Type Distribution"
          description="New vs returning visitors"
        >
          <PieChart
            data={userTypeData}
            innerRadius={0.6}
            showLegend
          />
        </ChartContainer>
      </div>

      {/* Acquisition Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Acquisition by Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={acquisition}
            columns={acquisitionColumns}
          />
        </CardContent>
      </Card>
    </>
  );
}
