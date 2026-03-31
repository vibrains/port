/**
 * Social Media Client Component
 * Renders social charts, DataTables, and network summary with function-based props on the client side
 * @module components/social/social-client
 */

"use client";

import {
  Share2,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import { DataTable } from "@/components/dashboard/data-table";
import { ChartContainer } from "@/components/charts/chart-container";
import { PieChart } from "@/components/charts/pie-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { NETWORK_COLORS } from "@/lib/utils/colors";
import type { SocialPost } from "@/types/database";
import type { ColumnDef } from "@tanstack/react-table";

interface NetworkBreakdownItem {
  network: string;
  posts: number;
  impressions: number;
  engagements: number;
}

interface SocialClientProps {
  posts: { data: SocialPost[]; count: number };
  topPosts: SocialPost[];
  networkData: { name: string; value: number }[];
  engagementByNetwork: { name: string; value: number }[];
  networkBreakdown: NetworkBreakdownItem[];
}

/**
 * Get network color from NETWORK_COLORS constant
 */
function getNetworkColor(network: string): string {
  const colors: Record<string, string> = {
    facebook: NETWORK_COLORS.facebook,
    instagram: NETWORK_COLORS.instagram,
    linkedin: NETWORK_COLORS.linkedin,
    twitter: NETWORK_COLORS.twitter,
    tiktok: NETWORK_COLORS.tiktok,
    youtube: NETWORK_COLORS.youtube,
    pinterest: NETWORK_COLORS.pinterest,
  };
  return colors[network.toLowerCase()] || "#6b7280";
}

/**
 * Social posts table columns defined on the client side
 */
const postsColumns: ColumnDef<SocialPost>[] = [
  {
    accessorKey: "network",
    header: "Network",
    cell: ({ row }) => {
      const network = row.getValue("network") as string;
      return (
        <Badge
          variant="outline"
          style={{
            borderColor: getNetworkColor(network),
            color: getNetworkColor(network),
          }}
        >
          {network}
        </Badge>
      );
    },
  },
  {
    accessorKey: "post_text",
    header: "Content",
    cell: ({ row }) => {
      const text = row.getValue("post_text") as string;
      return (
        <div className="max-w-[300px] truncate text-sm">
          {text || "No text content"}
        </div>
      );
    },
  },
  {
    accessorKey: "post_type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("post_type") as string;
      return (
        <Badge variant="secondary">
          {type || "Post"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "content_type",
    header: "Content Type",
    cell: ({ row }) => {
      const contentType = row.getValue("content_type") as string;
      return contentType ? (
        <Badge variant="outline">
          {contentType}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "published_at",
    header: "Published",
    cell: ({ row }) => {
      const date = row.getValue("published_at") as string;
      return date ? new Date(date).toLocaleDateString() : "—";
    },
  },
  {
    accessorKey: "impressions",
    header: "Impressions",
    cell: ({ row }) => formatNumber(Number(row.getValue("impressions")) || 0),
  },
  {
    accessorKey: "engagements",
    header: "Engagements",
    cell: ({ row }) => formatNumber(Number(row.getValue("engagements")) || 0),
  },
  {
    accessorKey: "engagement_rate",
    header: "Eng. Rate",
    cell: ({ row }) => formatPercent(Number(row.getValue("engagement_rate")) || 0),
  },
];

/**
 * Client component that renders social media charts, DataTables, and network summary.
 * Column definitions with cell renderers and chart formatter functions
 * are kept on the client side to avoid serialization errors.
 */
export function SocialClient({
  posts,
  topPosts,
  networkData,
  engagementByNetwork,
  networkBreakdown,
}: SocialClientProps) {
  return (
    <>
      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartContainer
          title="Posts by Network"
          description="Distribution across platforms"
        >
          <PieChart
            data={networkData}
            innerRadius={0.6}
            showLegend
          />
        </ChartContainer>

        <ChartContainer
          title="Engagements by Network"
          description="Total engagements per platform"
        >
          <BarChart
            data={engagementByNetwork}
            bars={[{ key: "value", name: "Engagements", color: "#8b5cf6" }]}
            yAxisFormatter={(value: number) => formatNumber(value)}
          />
        </ChartContainer>
      </div>

      {/* Network Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Network Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {networkBreakdown.map((network) => (
              <div key={network.network} className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getNetworkColor(network.network) }}
                  />
                  <span className="font-medium capitalize">{network.network}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Posts</span>
                    <span>{formatNumber(network.posts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impressions</span>
                    <span>{formatNumber(network.impressions)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Engagements</span>
                    <span>{formatNumber(network.engagements)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={topPosts}
            columns={postsColumns}
            initialSorting={[{ id: "published_at", desc: true }]}
          />
        </CardContent>
      </Card>

      {/* All Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Recent Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={posts.data}
            columns={postsColumns}
            initialSorting={[{ id: "published_at", desc: true }]}
          />
        </CardContent>
      </Card>
    </>
  );
}
