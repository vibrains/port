/**
 * Web Traffic Page
 * Displays web analytics with acquisition data
 * @module app/(dashboard)/web/page
 */

import { Suspense } from "react";
import { Metadata } from "next";
import {
  Eye,
  Users,
  Clock,
  MousePointerClick,
  TrendingUp,
} from "lucide-react";

import { MOCK_CLIENT_ID } from "@/lib/mock-data";
import {
  getGA4Acquisition,
  getAcquisitionSummary,
  getWebSummary,
} from "@/lib/db/queries/web";
import { getExecutiveSummary } from "@/lib/db/queries/executive-summary";
import { ExecutiveSummaryEditor } from "@/components/dashboard/executive-summary-editor";
import { KPICard } from "@/components/dashboard/kpi-card";
import { KPICardGroup } from "@/components/dashboard/kpi-card-group";
import { TrafficClient } from "@/components/web/traffic-client";
import { DashboardSkeleton } from "@/components/dashboard/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatNumber, formatPercent } from "@/lib/utils/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  parseRollupDateParams,
  getPreviousPeriod,
  getPreviousMonth,
  getMonthDateRange,
} from "@/lib/utils/dates";
import { computeChange } from "@/lib/utils/comparison";

export const metadata: Metadata = {
  title: "Web Traffic | Sente Dashboard",
  description: "Website traffic and acquisition analytics",
};

/**
 * Web traffic content component
 */
async function WebTrafficContent({
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
    const [webSummary, acquisitionSummary, acquisition] = await Promise.all([
      getWebSummary(clientId, dateRange),
      getAcquisitionSummary(clientId, dateRange),
      getGA4Acquisition({
        clientId,
        startDate: dateRange?.start,
        endDate: dateRange?.end,
      }),
    ]);

    let prevWebSummary: typeof webSummary | undefined;
    let prevAcquisitionSummary: typeof acquisitionSummary | undefined;
    if (compare && dateRange) {
      try {
        if (month) {
          const previousMonth = getPreviousMonth(month);
          const previousMonthRange = previousMonth ? getMonthDateRange(previousMonth) : undefined;
          if (previousMonthRange) {
            [prevWebSummary, prevAcquisitionSummary] = await Promise.all([
              getWebSummary(clientId, previousMonthRange),
              getAcquisitionSummary(clientId, previousMonthRange),
            ]);
          }
        } else {
          const prev = getPreviousPeriod(dateRange.start, dateRange.end);
          [prevWebSummary, prevAcquisitionSummary] = await Promise.all([
            getWebSummary(clientId, prev),
            getAcquisitionSummary(clientId, prev),
          ]);
        }
      } catch {
        // Previous period data unavailable; trends will not show
      }
    }

    const hasData = webSummary.totalViews > 0 || acquisition.length > 0;

    if (!hasData) {
      return (
        <EmptyState
          title="No Web Data"
          description="Upload your GA4 data to see website analytics."
        />
      );
    }

    // Prepare source breakdown for chart
    const topSources = acquisition
      .slice(0, 8)
      .map((a) => ({
        name: a.first_user_source || "Direct",
        value: a.sessions,
      }));

    // New vs returning users
    const userTypeData = [
      { name: "New Users", value: acquisitionSummary.totalNewUsers },
      {
        name: "Returning Users",
        value: Math.max(0, acquisitionSummary.totalSessions - acquisitionSummary.totalNewUsers),
      },
    ].filter((d) => d.value > 0);

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <KPICardGroup columns={4}>
          <KPICard
            title="Page Views"
            value={formatNumber(webSummary.totalViews)}
            icon={Eye}
            description="Total page views"
            trend={prevWebSummary ? computeChange(webSummary.totalViews, prevWebSummary.totalViews) : undefined}
          />
          <KPICard
            title="Active Users"
            value={formatNumber(webSummary.totalUsers)}
            icon={Users}
            description="Unique visitors"
            trend={prevWebSummary ? computeChange(webSummary.totalUsers, prevWebSummary.totalUsers) : undefined}
          />
          <KPICard
            title="Avg. Engagement"
            value={`${Math.round(webSummary.avgEngagementTime)}s`}
            icon={Clock}
            description="Average session duration"
            trend={prevWebSummary ? computeChange(webSummary.avgEngagementTime, prevWebSummary.avgEngagementTime) : undefined}
          />
          <KPICard
            title="Engagement Rate"
            value={formatPercent(acquisitionSummary.avgEngagementRate)}
            icon={MousePointerClick}
            description="Average engagement rate"
            trend={prevAcquisitionSummary ? computeChange(acquisitionSummary.avgEngagementRate, prevAcquisitionSummary.avgEngagementRate) : undefined}
          />
        </KPICardGroup>

        {/* Charts + Acquisition Table */}
        <TrafficClient
          acquisition={acquisition}
          topSources={topSources}
          userTypeData={userTypeData}
        />

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Traffic Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{formatNumber(acquisitionSummary.totalSessions)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">New Users</p>
                <p className="text-2xl font-bold">{formatNumber(acquisitionSummary.totalNewUsers)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Engagement Rate</p>
                <p className="text-2xl font-bold">{formatPercent(acquisitionSummary.avgEngagementRate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error loading web traffic:", error);
    return (
      <EmptyState
        title="Error Loading Data"
        description="There was a problem loading your web analytics data."
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
 * Web Traffic Page
 */
export default async function WebTrafficPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { dateRange, compare, month } = parseRollupDateParams(params);
  const activeMonth = month ?? new Date().toISOString().slice(0, 7);

  const clientId = MOCK_CLIENT_ID;
  const executiveSummaryContent = await getExecutiveSummary(clientId, "web-traffic", activeMonth).catch(() => "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Web Traffic</h1>
        <p className="text-muted-foreground">
          Website traffic analytics and acquisition insights
        </p>
      </div>

      {/* Executive Summary */}
      <ExecutiveSummaryEditor
        initialContent={executiveSummaryContent}
        channel="web-traffic"
        month={activeMonth}
        canEdit={true}
      />

      {/* Content with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <WebTrafficContent dateRange={dateRange} compare={compare} month={month} />
      </Suspense>
    </div>
  );
}
