/**
 * Social Media Posts Page
 * Displays social media performance analytics
 * @module app/(dashboard)/social/page
 */

import { Suspense } from "react";
import { Metadata } from "next";
import {
  Share2,
  Eye,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

import { MOCK_CLIENT_ID } from "@/lib/mock-data";
import {
  getSocialPosts,
  getSocialSummary,
  getTopPerformingPosts,
  getNetworkBreakdown,
} from "@/lib/db/queries/social";
import { getExecutiveSummary } from "@/lib/db/queries/executive-summary";
import { ExecutiveSummaryEditor } from "@/components/dashboard/executive-summary-editor";
import { KPICard } from "@/components/dashboard/kpi-card";
import { KPICardGroup } from "@/components/dashboard/kpi-card-group";
import { SocialClient } from "@/components/social/social-client";
import { DashboardSkeleton } from "@/components/dashboard/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import {
  parseRollupDateParams,
  getPreviousPeriod,
  getPreviousMonth,
  getMonthDateRange,
} from "@/lib/utils/dates";
import { computeChange } from "@/lib/utils/comparison";

export const metadata: Metadata = {
  title: "Social Media | Sente Dashboard",
  description: "Social media performance analytics",
};

/**
 * Social media content component
 */
async function SocialMediaContent({
  dateRange,
  compare,
  month,
}: {
  dateRange?: { start: Date; end: Date };
  compare: boolean;
  month?: string;
}) {
  const clientId = MOCK_CLIENT_ID;

  try {
    const [summary, posts, topPosts, networkBreakdown] = await Promise.all([
      getSocialSummary(clientId, dateRange),
      getSocialPosts({
        clientId,
        startDate: dateRange?.start,
        endDate: dateRange?.end,
        limit: 1000,
        offset: 0,
      }),
      getTopPerformingPosts(clientId, { metric: "engagement", limit: 10 }),
      getNetworkBreakdown(clientId, dateRange),
    ]);

    let prevSummary: typeof summary | undefined;
    if (compare && dateRange) {
      try {
        if (month) {
          const previousMonth = getPreviousMonth(month);
          const previousMonthRange = previousMonth ? getMonthDateRange(previousMonth) : undefined;
          if (previousMonthRange) {
            prevSummary = await getSocialSummary(clientId, previousMonthRange);
          }
        } else {
          const prev = getPreviousPeriod(dateRange.start, dateRange.end);
          prevSummary = await getSocialSummary(clientId, prev);
        }
      } catch {
        // Previous period data unavailable; trends will not show
      }
    }

    const hasData = summary.totalPosts > 0 || posts.data.length > 0;

    if (!hasData) {
      return (
        <EmptyState
          title="No Social Data"
          description="Upload your Sprout Social data to see social media analytics."
        />
      );
    }

    // Network breakdown for pie chart
    const networkData = networkBreakdown.map((n) => ({
      name: n.network.charAt(0).toUpperCase() + n.network.slice(1),
      value: n.posts,
    }));

    // Engagement by network
    const engagementByNetwork = networkBreakdown.map((n) => ({
      name: n.network.charAt(0).toUpperCase() + n.network.slice(1),
      value: n.engagements,
    }));

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <KPICardGroup columns={4}>
          <KPICard
            title="Total Posts"
            value={formatNumber(summary.totalPosts)}
            icon={Share2}
            description="Posts published"
            trend={prevSummary ? computeChange(summary.totalPosts, prevSummary.totalPosts) : undefined}
          />
          <KPICard
            title="Total Impressions"
            value={formatNumber(summary.totalImpressions)}
            icon={Eye}
            description="Total reach"
            trend={prevSummary ? computeChange(summary.totalImpressions, prevSummary.totalImpressions) : undefined}
          />
          <KPICard
            title="Total Engagements"
            value={formatNumber(summary.totalEngagements)}
            icon={ThumbsUp}
            description="Likes, comments, shares"
            trend={prevSummary ? computeChange(summary.totalEngagements, prevSummary.totalEngagements) : undefined}
          />
          <KPICard
            title="Engagement Rate"
            value={formatPercent(summary.avgEngagementRate)}
            icon={TrendingUp}
            description="Average engagement rate"
            trend={prevSummary ? computeChange(summary.avgEngagementRate, prevSummary.avgEngagementRate) : undefined}
          />
        </KPICardGroup>

        {/* Charts + DataTables + Network Summary */}
        <SocialClient
          posts={posts}
          topPosts={topPosts}
          networkData={networkData}
          engagementByNetwork={engagementByNetwork}
          networkBreakdown={networkBreakdown}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading social media data:", error);
    return (
      <EmptyState
        title="Error Loading Data"
        description="There was a problem loading your social media data."
        action={{
          label: "Retry",
          actionType: "reload",
          variant: "outline",
        }}
      />
    );
  }
}

/**
 * Social Media Page
 */
export default async function SocialMediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { dateRange, compare, month } = parseRollupDateParams(params);
  const activeMonth = month ?? new Date().toISOString().slice(0, 7);

  const clientId = MOCK_CLIENT_ID;
  const executiveSummaryContent = await getExecutiveSummary(clientId, "social", activeMonth).catch(() => "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Social Media</h1>
        <p className="text-muted-foreground">
          Performance analytics for your social media posts
        </p>
      </div>

      {/* Executive Summary */}
      <ExecutiveSummaryEditor
        initialContent={executiveSummaryContent}
        channel="social"
        month={activeMonth}
        canEdit={true}
      />

      {/* Content with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <SocialMediaContent dateRange={dateRange} compare={compare} month={month} />
      </Suspense>
    </div>
  );
}
