/**
 * Executive Summary Dashboard Page
 * Main dashboard with KPI cards, trend charts, and summary metrics
 * @module app/(dashboard)/page
 */

import { Suspense } from "react";
import { Metadata } from "next";
import {
  Mail,
  Users,
  MousePointerClick,
  Eye,
  Clock,
  Share2,
  TrendingUp,
  DollarSign,
} from "lucide-react";

import { MOCK_CLIENT_ID } from "@/lib/mock-data";
import { getExecutiveSummary, getClickRateTrendBySplit, getEngagementTrendByNetwork } from "@/lib/db/queries/summary";
import { getSocialEngagementByDayHour } from "@/lib/db/queries/social";
import { getEmailEngagementByDayHour } from "@/lib/db/queries/email";
import { getExecutiveSummary as getChannelSummary } from "@/lib/db/queries/executive-summary";
import { ExecutiveSummaryEditor } from "@/components/dashboard/executive-summary-editor";
import { KPICard } from "@/components/dashboard/kpi-card";
import { KPICardGroup } from "@/components/dashboard/kpi-card-group";
import { ExecutiveCharts } from "@/components/dashboard/executive-charts";
import {
  ExecutiveFunnel,
  ExecutiveFunnelSkeleton,
} from "@/components/dashboard/executive-funnel";
import { EngagementBubbleChart } from "@/components/charts/engagement-bubble-chart";
import { DashboardSkeleton } from "@/components/dashboard/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatNumber, formatPercent, formatCurrency } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  parseRollupDateParams,
  getPreviousPeriod,
  getPreviousMonth,
  getMonthDateRange,
} from "@/lib/utils/dates";
import { computeChange } from "@/lib/utils/comparison";

export const metadata: Metadata = {
  title: "Executive Summary | Sente Dashboard",
  description: "Marketing performance executive summary",
};

/**
 * Executive Summary content component
 * Fetches and displays summary data with optional date filtering and period comparison
 */
async function ExecutiveSummaryContent({
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
    const [summary, engagementsTrend, clickRateTrend, socialByDayHour, emailByDayHour] = await Promise.all([
      getExecutiveSummary(clientId, dateRange),
      getEngagementTrendByNetwork(clientId, "day", dateRange),
      getClickRateTrendBySplit(clientId, "day", dateRange),
      getSocialEngagementByDayHour(clientId, dateRange),
      getEmailEngagementByDayHour(clientId, dateRange),
    ]);

    // Fetch previous period data when comparison is enabled
    let prevSummary: typeof summary | undefined;
    if (compare && dateRange) {
      try {
        if (month) {
          const previousMonth = getPreviousMonth(month);
          const previousMonthRange = previousMonth ? getMonthDateRange(previousMonth) : undefined;
          if (previousMonthRange) {
            prevSummary = await getExecutiveSummary(clientId, previousMonthRange);
          }
        } else {
          const prev = getPreviousPeriod(dateRange.start, dateRange.end);
          prevSummary = await getExecutiveSummary(clientId, prev);
        }
      } catch {
        // Previous period data unavailable; trends will not show
      }
    }

    const hasData =
      summary.email.campaigns > 0 ||
      summary.emailB2B.campaigns > 0 ||
      summary.web.views > 0 ||
      summary.social.posts > 0;

    if (!hasData) {
      return (
        <EmptyState
          title="No Data Available"
          description="Upload your marketing data to see performance metrics and trends."
          action={{
            label: "Upload Data",
            href: "/admin/upload",
            variant: "default",
          }}
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* Quick Links */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/email">
              <Mail className="mr-2 h-4 w-4" />
              Email Details
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/web">
              <Eye className="mr-2 h-4 w-4" />
              Web Analytics
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/social">
              <Share2 className="mr-2 h-4 w-4" />
              Social Media
            </Link>
          </Button>
        </div>

        {/* Consumer Email KPIs */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            B2C Email Performance
          </h2>
          <KPICardGroup columns={5}>
            <KPICard
              title="Total Campaigns"
              value={formatNumber(summary.email.campaigns)}
              icon={Mail}
              description="Email campaigns sent"
              trend={prevSummary ? computeChange(summary.email.campaigns, prevSummary.email.campaigns) : undefined}
            />
            <KPICard
              title="Messages Sent"
              value={formatNumber(summary.email.recipients)}
              icon={Users}
              description="Emails sent"
              trend={prevSummary ? computeChange(summary.email.recipients, prevSummary.email.recipients) : undefined}
            />
            <KPICard
              title="Open Rate"
              value={formatPercent(summary.email.openRate)}
              icon={Eye}
              description="Average open rate"
              trend={prevSummary ? computeChange(summary.email.openRate, prevSummary.email.openRate) : undefined}
            />
            <KPICard
              title="Click Rate"
              value={formatPercent(summary.email.clickRate)}
              icon={MousePointerClick}
              description="Average click rate"
              trend={prevSummary ? computeChange(summary.email.clickRate, prevSummary.email.clickRate) : undefined}
            />
            <KPICard
              title="Revenue"
              value={formatCurrency(summary.email.revenue)}
              icon={DollarSign}
              description="Total campaign revenue"
              trend={prevSummary ? computeChange(summary.email.revenue, prevSummary.email.revenue) : undefined}
            />
          </KPICardGroup>
        </section>

        {summary.emailB2B.campaigns > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-slate-500" />
              B2B Email Performance
            </h2>
            <KPICardGroup columns={4}>
              <KPICard
                title="Total Campaigns"
                value={formatNumber(summary.emailB2B.campaigns)}
                icon={Mail}
                description="B2B campaigns sent"
                trend={prevSummary ? computeChange(summary.emailB2B.campaigns, prevSummary.emailB2B.campaigns) : undefined}
              />
              <KPICard
                title="Messages Sent"
                value={formatNumber(summary.emailB2B.recipients)}
                icon={Users}
                description="B2B emails sent"
                trend={prevSummary ? computeChange(summary.emailB2B.recipients, prevSummary.emailB2B.recipients) : undefined}
              />
              <KPICard
                title="Open Rate"
                value={formatPercent(summary.emailB2B.openRate)}
                icon={Eye}
                description="B2B average open rate"
                trend={prevSummary ? computeChange(summary.emailB2B.openRate, prevSummary.emailB2B.openRate) : undefined}
              />
              <KPICard
                title="Click Rate"
                value={formatPercent(summary.emailB2B.clickRate)}
                icon={MousePointerClick}
                description="B2B average click rate"
                trend={prevSummary ? computeChange(summary.emailB2B.clickRate, prevSummary.emailB2B.clickRate) : undefined}
              />
            </KPICardGroup>
          </section>
        )}

        {/* Web KPIs */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-500" />
            Web Analytics
          </h2>
          <KPICardGroup columns={4}>
            <KPICard
              title="Page Views"
              value={formatNumber(summary.web.views)}
              icon={Eye}
              description="Total page views"
              trend={prevSummary ? computeChange(summary.web.views, prevSummary.web.views) : undefined}
            />
            <KPICard
              title="Active Users"
              value={formatNumber(summary.web.users)}
              icon={Users}
              description="Unique visitors"
              trend={prevSummary ? computeChange(summary.web.users, prevSummary.web.users) : undefined}
            />
            <KPICard
              title="Avg. Engagement"
              value={`${formatNumber(summary.web.engagementTime)}s`}
              icon={Clock}
              description="Average session duration"
              trend={prevSummary ? computeChange(summary.web.engagementTime, prevSummary.web.engagementTime) : undefined}
            />
            <KPICard
              title="Views per User"
              value={summary.web.users > 0 ? (summary.web.views / summary.web.users).toFixed(1) : "—"}
              icon={MousePointerClick}
              description="Average pages per visitor"
              trend={prevSummary && prevSummary.web.users > 0
                ? computeChange(
                    summary.web.views / summary.web.users,
                    prevSummary.web.views / prevSummary.web.users
                  )
                : undefined}
            />
          </KPICardGroup>
        </section>

        {/* Social KPIs */}
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-purple-500" />
            Social Media
          </h2>
          <KPICardGroup columns={4}>
            <KPICard
              title="Posts"
              value={formatNumber(summary.social.posts)}
              icon={Share2}
              description="Total posts published"
              trend={prevSummary ? computeChange(summary.social.posts, prevSummary.social.posts) : undefined}
            />
            <KPICard
              title="Impressions"
              value={formatNumber(summary.social.impressions)}
              icon={Eye}
              description="Total impressions"
              trend={prevSummary ? computeChange(summary.social.impressions, prevSummary.social.impressions) : undefined}
            />
            <KPICard
              title="Engagements"
              value={formatNumber(summary.social.engagements)}
              icon={TrendingUp}
              description="Total engagements"
              trend={prevSummary ? computeChange(summary.social.engagements, prevSummary.social.engagements) : undefined}
            />
            <KPICard
              title="Engagement Rate"
              value={formatPercent(summary.social.engagementRate)}
              icon={MousePointerClick}
              description="Average engagement rate"
              trend={prevSummary ? computeChange(summary.social.engagementRate, prevSummary.social.engagementRate) : undefined}
            />
          </KPICardGroup>
        </section>

        {/* Marketing Funnel */}
        <Suspense fallback={<ExecutiveFunnelSkeleton />}>
          <ExecutiveFunnel clientId={clientId} dateRange={dateRange} compare={compare} month={month} />
        </Suspense>

        {/* Engagement Timing */}
        <EngagementBubbleChart
          socialData={socialByDayHour}
          emailData={emailByDayHour}
        />

        {/* Trend Charts */}
        <ExecutiveCharts
          engagementsTrend={engagementsTrend}
          clickRateTrend={clickRateTrend}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading executive summary:", error);
    return (
      <EmptyState
        title="Error Loading Data"
        description="There was a problem loading your dashboard data. Please try again later."
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
 * Executive Summary Page
 */
export default async function ExecutiveSummaryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { dateRange, compare, month } = parseRollupDateParams(params);

  const clientId = MOCK_CLIENT_ID;
  const activeMonth = month ?? new Date().toISOString().slice(0, 7);
  const channelSummaryContent = await getChannelSummary(clientId, "overview", activeMonth).catch(() => "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Executive Summary</h1>
        <p className="text-muted-foreground">
          Overview of your marketing performance across all channels
        </p>
      </div>

      <ExecutiveSummaryEditor
        initialContent={channelSummaryContent}
        channel="overview"
        month={activeMonth}
        canEdit={false}
      />

      {/* Content with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <ExecutiveSummaryContent dateRange={dateRange} compare={compare} month={month} />
      </Suspense>
    </div>
  );
}
