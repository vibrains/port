/**
 * Web Pages Client Component
 * Renders page charts and DataTables with function-based props on the client side
 * @module components/web/pages-client
 */

"use client";

import {
  FileText,
  TrendingUp,
} from "lucide-react";
import { DataTable } from "@/components/dashboard/data-table";
import { ChartContainer } from "@/components/charts/chart-container";
import { BarChart } from "@/components/charts/bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils/format";
import type { GA4Page } from "@/types/database";
import type { ColumnDef } from "@tanstack/react-table";

interface PagesClientProps {
  topPages: GA4Page[];
  pages: { data: GA4Page[]; count: number };
  topPagesData: { name: string; value: number }[];
  sourceData: { name: string; value: number }[];
}

/**
 * Pages table columns defined on the client side
 */
const pagesColumns: ColumnDef<GA4Page>[] = [
  {
    accessorKey: "page_path",
    header: "Page",
    cell: ({ row }) => {
      const path = row.original.page_path;
      return (
        <div className="font-medium text-muted-foreground truncate max-w-[300px]">
          {path || "/"}
        </div>
      );
    },
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const source = row.getValue("source") as string;
      return source ? (
        <Badge variant="outline">{source}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "views",
    header: "Views",
    cell: ({ row }) => formatNumber(Number(row.getValue("views")) || 0),
  },
  {
    accessorKey: "active_users",
    header: "Users",
    cell: ({ row }) => formatNumber(Number(row.getValue("active_users")) || 0),
  },
  {
    accessorKey: "views_per_user",
    header: "Views/User",
    cell: ({ row }) => {
      const raw = row.getValue("views_per_user");
      const value = Number(raw);
      return value && Number.isFinite(value) ? value.toFixed(2) : "—";
    },
  },
  {
    accessorKey: "avg_engagement_time",
    header: "Avg. Time",
    cell: ({ row }) => {
      const seconds = Number(row.getValue("avg_engagement_time")) || 0;
      return `${Math.round(seconds)}s`;
    },
  },
];

/**
 * Client component that renders page charts and DataTables.
 * Column definitions with cell renderers and chart formatter functions
 * are kept on the client side to avoid serialization errors.
 */
export function PagesClient({
  topPages,
  pages,
  topPagesData,
  sourceData,
}: PagesClientProps) {
  return (
    <>
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartContainer
          title="Top Pages by Views"
          description="Most viewed pages"
        >
          <BarChart
            data={topPagesData}
            bars={[{ key: "value", name: "Views", color: "#3b82f6" }]}
            layout="horizontal"
            yAxisFormatter={(value: number) => formatNumber(value)}
          />
        </ChartContainer>

        <ChartContainer
          title="Views by Source"
          description="Traffic distribution by source"
        >
          <BarChart
            data={sourceData}
            bars={[{ key: "value", name: "Views", color: "#10b981" }]}
            yAxisFormatter={(value: number) => formatNumber(value)}
          />
        </ChartContainer>
      </div>

      {/* Top Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={topPages}
            columns={pagesColumns}
          />
        </CardContent>
      </Card>

      {/* All Pages Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Pages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={pages.data}
            columns={pagesColumns}
          />
        </CardContent>
      </Card>
    </>
  );
}
