/**
 * Web Pages Performance Page
 * Displays top performing pages and page analytics
 * @module app/(dashboard)/web/pages/page
 */

import { Suspense } from "react";
import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import {
  Eye,
  Users,
  Clock,
  MousePointerClick,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { getGA4Pages, getTopPages, getWebSummary } from "@/lib/db/queries/web";
import { getExecutiveSummary } from "@/lib/db/queries/executive-summary";
import { ExecutiveSummaryEditor } from "@/components/dashboard/executive-summary-editor";
import { KPICard } from "@/components/dashboard/kpi-card";
import { KPICardGroup } from "@/components/dashboard/kpi-card-group";
import { PagesClient } from "@/components/web/pages-client";
import { DashboardSkeleton } from "@/components/dashboard/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatNumber } from "@/lib/utils/format";
import {
  parseRollupDateParams,
  getPreviousPeriod,
  getPreviousMonth,
  getMonthDateRange,
} from "@/lib/utils/dates";
import { computeChange } from "@/lib/utils/comparison";

export const metadata: Metadata = {
  title: "Page Performance | Sente Dashboard",
  description: "Website page performance analytics",
};

/**
 * Web pages content component
 */
async function WebPagesContent({
  dateRange,
  compare,
  month,
}: {
  dateRange?: { start: Date; end: Date };
  compare: boolean;
  month?: string;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const clientId = session.user.clientIds?.[0];

  if (!clientId) {
    return (
      <EmptyState
        title="No Client Access"
        description="You don't have access to any client data."
      />
    );
  }

  try {
    const [webSummary, topPages, pages] = await Promise.all([
      getWebSummary(clientId, dateRange),
      getTopPages(clientId, { limit: 10, dateRange }),
      getGA4Pages({
        clientId,
        startDate: dateRange?.start,
        endDate: dateRange?.end,
        limit: 250,
        offset: 0,
      }),
    ]);

    let prevWebSummary: typeof webSummary | undefined;
    if (compare && dateRange) {
      if (month) {
        const previousMonth = getPreviousMonth(month);
        const previousMonthRange = previousMonth ? getMonthDateRange(previousMonth) : undefined;
        if (previousMonthRange) {
          prevWebSummary = await getWebSummary(clientId, previousMonthRange);
        }
      } else {
        const prev = getPreviousPeriod(dateRange.start, dateRange.end);
        prevWebSummary = await getWebSummary(clientId, prev);
      }
    }

    const hasData = webSummary.totalViews > 0 || pages.data.length > 0;

    if (!hasData) {
      return (
        <EmptyState
          title="No Page Data"
          description="Upload your GA4 page data to see page analytics."
        />
      );
    }

    // Top pages by views
    const topPagesData = topPages.slice(0, 10).map((p) => ({
      name: p.page_title?.slice(0, 30) || p.page_path?.slice(0, 30) || "Untitled",
      value: p.views,
    }));

    // Pages by source
    const sourceBreakdown = pages.data.reduce((acc, page) => {
      const source = page.source || "Direct";
      if (!acc[source]) {
        acc[source] = 0;
      }
      acc[source] += page.views;
      return acc;
    }, {} as Record<string, number>);

    const sourceData = Object.entries(sourceBreakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <KPICardGroup columns={4}>
          <KPICard
            title="Total Views"
            value={formatNumber(webSummary.totalViews)}
            icon={Eye}
            description="All page views"
            trend={prevWebSummary ? computeChange(webSummary.totalViews, prevWebSummary.totalViews) : undefined}
          />
          <KPICard
            title="Unique Users"
            value={formatNumber(webSummary.totalUsers)}
            icon={Users}
            description="Unique visitors"
            trend={prevWebSummary ? computeChange(webSummary.totalUsers, prevWebSummary.totalUsers) : undefined}
          />
          <KPICard
            title="Avg. Engagement"
            value={`${Math.round(webSummary.avgEngagementTime)}s`}
            icon={Clock}
            description="Average time on page"
            trend={prevWebSummary ? computeChange(webSummary.avgEngagementTime, prevWebSummary.avgEngagementTime) : undefined}
          />
          <KPICard
            title="Views per User"
            value={webSummary.totalUsers > 0 ? (webSummary.totalViews / webSummary.totalUsers).toFixed(1) : "—"}
            icon={MousePointerClick}
            description="Average pages per visitor"
            trend={prevWebSummary && prevWebSummary.totalUsers > 0
              ? computeChange(
                  webSummary.totalViews / webSummary.totalUsers,
                  prevWebSummary.totalViews / prevWebSummary.totalUsers
                )
              : undefined}
          />
        </KPICardGroup>

        {/* Charts + DataTables */}
        <PagesClient
          topPages={topPages}
          pages={pages}
          topPagesData={topPagesData}
          sourceData={sourceData}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading web pages:", error);
    return (
      <EmptyState
        title="Error Loading Data"
        description="There was a problem loading your page analytics data."
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
 * Web Pages Page
 */
export default async function WebPagesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { dateRange, compare, month } = parseRollupDateParams(params);
  const activeMonth = month ?? new Date().toISOString().slice(0, 7);

  const session = await getServerSession(authOptions);
  const clientId = session?.user?.clientIds?.[0];
  const executiveSummaryContent = clientId
    ? await getExecutiveSummary(clientId, "web-pages", activeMonth).catch(() => "")
    : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Page Performance</h1>
        <p className="text-muted-foreground">
          Analytics for individual page performance
        </p>
      </div>

      <ExecutiveSummaryEditor
        initialContent={executiveSummaryContent}
        channel="web-pages"
        month={activeMonth}
        canEdit={session?.user?.role === "admin"}
      />

      {/* Content with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <WebPagesContent dateRange={dateRange} compare={compare} month={month} />
      </Suspense>
    </div>
  );
}
