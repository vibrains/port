/**
 * Full-report page — renders all dashboard sections for print / PDF export
 * @module app/(report)/report/page
 */

import { Suspense } from "react";
import { Metadata } from "next";
import { MOCK_CLIENT_ID } from "@/lib/mock-data";
import {
  Mail,
  Users,
  Eye,
  MousePointerClick,
  Clock,
  Share2,
  TrendingUp,
  Workflow,
} from "lucide-react";


// Data queries
import {
  getExecutiveSummary as getOverviewSummary,
  getClickRateTrendBySplit,
  getEngagementTrendByNetwork,
} from "@/lib/db/queries/summary";
import { getExecutiveSummary as getChannelSummary } from "@/lib/db/queries/executive-summary";
import { getEmailCampaigns, getEmailCampaignsSummary, getEmailEngagementByDayHour, getKlaviyoFlows, getKlaviyoFlowsSummary, getPardotFlows } from "@/lib/db/queries/email";
import { getInsights } from "@/lib/db/queries/insights";
import { getDistinctUploadMonths } from "@/lib/db/queries/uploads";
import { getGA4Acquisition, getGA4Pages, getAcquisitionSummary, getTopPages, getWebSummary } from "@/lib/db/queries/web";

// Shared UI components
import { getSocialEngagementByDayHour } from "@/lib/db/queries/social";
import { ExecutiveSummaryEditor } from "@/components/dashboard/executive-summary-editor";
import { KPICard } from "@/components/dashboard/kpi-card";
import { KPICardGroup } from "@/components/dashboard/kpi-card-group";
import { ExecutiveCharts } from "@/components/dashboard/executive-charts";
import { EngagementBubbleChart } from "@/components/charts/engagement-bubble-chart";
import { ExecutiveFunnel, ExecutiveFunnelSkeleton } from "@/components/dashboard/executive-funnel";
import { CampaignsClient } from "@/components/email/campaigns-client";
import { FlowsClient } from "@/components/email/flows-client";
import { TrafficClient } from "@/components/web/traffic-client";
import { PagesClient } from "@/components/web/pages-client";
import { DashboardSkeleton } from "@/components/dashboard/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportControls } from "@/components/report/print-button";
import { InsightsReport } from "@/components/insights/insights-client";

import { formatNumber, formatPercent } from "@/lib/utils/format";
import { parseRollupDateParams, getPreviousPeriod, getPreviousMonth, getMonthDateRange } from "@/lib/utils/dates";
import { computeChange } from "@/lib/utils/comparison";

export const metadata: Metadata = {
  title: "Full Report | Sente Dashboard",
};

// ─── Section header ─────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b pb-4 mb-6">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── Overview section ────────────────────────────────────────────────────────

async function OverviewSection({
  clientId,
  dateRange,
  compare,
  month,
}: {
  clientId: string;
  dateRange?: { start: Date; end: Date };
  compare: boolean;
  month?: string;
}) {
  try {
    const [summary, engagementsTrend, clickRateTrend, execSummaryText, socialByDayHour, emailByDayHour] = await Promise.all([
      getOverviewSummary(clientId, dateRange),
      getEngagementTrendByNetwork(clientId, "day", dateRange),
      getClickRateTrendBySplit(clientId, "day", dateRange),
      getChannelSummary(clientId, "overview", month ?? new Date().toISOString().slice(0, 7)).catch(() => ""),
      getSocialEngagementByDayHour(clientId, dateRange),
      getEmailEngagementByDayHour(clientId, dateRange),
    ]);

    let prevSummary: typeof summary | undefined;
    if (compare && dateRange) {
      try {
        const prev = month
          ? (() => { const pm = getPreviousMonth(month); return pm ? getMonthDateRange(pm) : undefined; })()
          : getPreviousPeriod(dateRange.start, dateRange.end);
        if (prev) prevSummary = await getOverviewSummary(clientId, prev);
      } catch { /* no prev data */ }
    }

    return (
      <div className="space-y-6">
        {execSummaryText && (
          <ExecutiveSummaryEditor initialContent={execSummaryText} channel="overview" month={month ?? new Date().toISOString().slice(0, 7)} canEdit={false} />
        )}

        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" /> B2C Email Performance
          </h3>
          <KPICardGroup columns={4}>
            <KPICard title="Total Campaigns" value={formatNumber(summary.email.campaigns)} icon={Mail} description="Email campaigns sent" trend={prevSummary ? computeChange(summary.email.campaigns, prevSummary.email.campaigns) : undefined} />
            <KPICard title="Messages Sent" value={formatNumber(summary.email.recipients)} icon={Users} description="Emails sent" trend={prevSummary ? computeChange(summary.email.recipients, prevSummary.email.recipients) : undefined} />
            <KPICard title="Open Rate" value={formatPercent(summary.email.openRate)} icon={Eye} description="Average open rate" trend={prevSummary ? computeChange(summary.email.openRate, prevSummary.email.openRate) : undefined} />
            <KPICard title="Click Rate" value={formatPercent(summary.email.clickRate)} icon={MousePointerClick} description="Average click rate" trend={prevSummary ? computeChange(summary.email.clickRate, prevSummary.email.clickRate) : undefined} />
          </KPICardGroup>
        </section>

        {summary.emailB2B.campaigns > 0 && (
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-slate-500" /> B2B Email Performance
            </h3>
            <KPICardGroup columns={4}>
              <KPICard title="Total Campaigns" value={formatNumber(summary.emailB2B.campaigns)} icon={Mail} description="B2B campaigns sent" trend={prevSummary ? computeChange(summary.emailB2B.campaigns, prevSummary.emailB2B.campaigns) : undefined} />
              <KPICard title="Messages Sent" value={formatNumber(summary.emailB2B.recipients)} icon={Users} description="B2B emails sent" trend={prevSummary ? computeChange(summary.emailB2B.recipients, prevSummary.emailB2B.recipients) : undefined} />
              <KPICard title="Open Rate" value={formatPercent(summary.emailB2B.openRate)} icon={Eye} description="B2B average open rate" trend={prevSummary ? computeChange(summary.emailB2B.openRate, prevSummary.emailB2B.openRate) : undefined} />
              <KPICard title="Click Rate" value={formatPercent(summary.emailB2B.clickRate)} icon={MousePointerClick} description="B2B average click rate" trend={prevSummary ? computeChange(summary.emailB2B.clickRate, prevSummary.emailB2B.clickRate) : undefined} />
            </KPICardGroup>
          </section>
        )}

        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-500" /> Web Analytics
          </h3>
          <KPICardGroup columns={4}>
            <KPICard title="Page Views" value={formatNumber(summary.web.views)} icon={Eye} description="Total page views" trend={prevSummary ? computeChange(summary.web.views, prevSummary.web.views) : undefined} />
            <KPICard title="Active Users" value={formatNumber(summary.web.users)} icon={Users} description="Unique visitors" trend={prevSummary ? computeChange(summary.web.users, prevSummary.web.users) : undefined} />
            <KPICard title="Avg. Engagement" value={`${formatNumber(summary.web.engagementTime)}s`} icon={Clock} description="Average session duration" trend={prevSummary ? computeChange(summary.web.engagementTime, prevSummary.web.engagementTime) : undefined} />
            <KPICard title="Views per User" value={summary.web.users > 0 ? (summary.web.views / summary.web.users).toFixed(1) : "—"} icon={MousePointerClick} description="Average pages per visitor" />
          </KPICardGroup>
        </section>

        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-purple-500" /> Social Media
          </h3>
          <KPICardGroup columns={4}>
            <KPICard title="Posts" value={formatNumber(summary.social.posts)} icon={Share2} description="Total posts published" trend={prevSummary ? computeChange(summary.social.posts, prevSummary.social.posts) : undefined} />
            <KPICard title="Impressions" value={formatNumber(summary.social.impressions)} icon={Eye} description="Total impressions" trend={prevSummary ? computeChange(summary.social.impressions, prevSummary.social.impressions) : undefined} />
            <KPICard title="Engagements" value={formatNumber(summary.social.engagements)} icon={TrendingUp} description="Total engagements" trend={prevSummary ? computeChange(summary.social.engagements, prevSummary.social.engagements) : undefined} />
            <KPICard title="Engagement Rate" value={formatPercent(summary.social.engagementRate)} icon={MousePointerClick} description="Average engagement rate" trend={prevSummary ? computeChange(summary.social.engagementRate, prevSummary.social.engagementRate) : undefined} />
          </KPICardGroup>
        </section>

        <Suspense fallback={<ExecutiveFunnelSkeleton />}>
          <ExecutiveFunnel clientId={clientId} dateRange={dateRange} compare={compare} month={month} />
        </Suspense>

        <EngagementBubbleChart socialData={socialByDayHour} emailData={emailByDayHour} />

        <ExecutiveCharts engagementsTrend={engagementsTrend} clickRateTrend={clickRateTrend} />
      </div>
    );
  } catch {
    return <EmptyState title="Overview data unavailable" description="Could not load overview data." />;
  }
}

// ─── Email Campaigns section ─────────────────────────────────────────────────

async function EmailCampaignsSection({
  clientId,
  dateRange,
  compare,
  month,
}: {
  clientId: string;
  dateRange?: { start: Date; end: Date };
  compare: boolean;
  month?: string;
}) {
  try {
    const [summary, campaigns, execSummaryText] = await Promise.all([
      getEmailCampaignsSummary(clientId, dateRange),
      getEmailCampaigns({ clientId, startDate: dateRange?.start, endDate: dateRange?.end, limit: 50, offset: 0 }),
      getChannelSummary(clientId, "email", month ?? new Date().toISOString().slice(0, 7)).catch(() => ""),
    ]);

    let prevSummary: typeof summary | undefined;
    if (compare && dateRange) {
      try {
        const prev = month
          ? (() => { const pm = getPreviousMonth(month); return pm ? getMonthDateRange(pm) : undefined; })()
          : getPreviousPeriod(dateRange.start, dateRange.end);
        if (prev) prevSummary = await getEmailCampaignsSummary(clientId, prev);
      } catch { /* no prev data */ }
    }

    if (!summary.totalCampaigns) {
      return <EmptyState title="No Email Campaigns" description="No campaign data available." />;
    }

    return (
      <div className="space-y-6">
        {execSummaryText && (
          <ExecutiveSummaryEditor initialContent={execSummaryText} channel="email" month={month ?? new Date().toISOString().slice(0, 7)} canEdit={false} />
        )}
        <KPICardGroup columns={4}>
          <KPICard title="Total Campaigns" value={formatNumber(summary.totalCampaigns)} icon={Mail} description="Email campaigns sent" trend={prevSummary ? computeChange(summary.totalCampaigns, prevSummary.totalCampaigns) : undefined} />
          <KPICard title="Total Recipients" value={formatNumber(summary.totalRecipients)} icon={Users} description="Emails delivered" trend={prevSummary ? computeChange(summary.totalRecipients, prevSummary.totalRecipients) : undefined} />
          <KPICard title="Avg Open Rate" value={formatPercent(summary.avgOpenRate)} icon={Eye} description="Average open rate" trend={prevSummary ? computeChange(summary.avgOpenRate, prevSummary.avgOpenRate) : undefined} />
          <KPICard title="Avg Click Rate" value={formatPercent(summary.avgClickRate)} icon={MousePointerClick} description="Average click rate" trend={prevSummary ? computeChange(summary.avgClickRate, prevSummary.avgClickRate) : undefined} />
        </KPICardGroup>
        <CampaignsClient campaigns={campaigns.data} />
      </div>
    );
  } catch {
    return <EmptyState title="Email campaigns unavailable" description="Could not load campaign data." />;
  }
}

// ─── Email Flows section ─────────────────────────────────────────────────────

async function EmailFlowsSection({
  clientId,
  dateRange,
  compare,
  month,
}: {
  clientId: string;
  dateRange?: { start: Date; end: Date };
  compare: boolean;
  month?: string;
}) {
  try {
    const [klaviyoSummary, klaviyoFlows, pardotFlows, execSummaryText] = await Promise.all([
      getKlaviyoFlowsSummary(clientId, dateRange, month),
      getKlaviyoFlows({ clientId, startDate: dateRange?.start, endDate: dateRange?.end, monthKey: month }),
      getPardotFlows({ clientId }),
      getChannelSummary(clientId, "email-flows", month ?? new Date().toISOString().slice(0, 7)).catch(() => ""),
    ]);

    let prevSummary: typeof klaviyoSummary | undefined;
    if (compare && dateRange) {
      try {
        const prev = month
          ? (() => { const pm = getPreviousMonth(month); return pm ? getMonthDateRange(pm) : undefined; })()
          : getPreviousPeriod(dateRange.start, dateRange.end);
        if (prev) prevSummary = await getKlaviyoFlowsSummary(clientId, prev);
      } catch { /* no prev data */ }
    }

    if (!klaviyoFlows.length && !pardotFlows.length) {
      return <EmptyState title="No Email Flows" description="No flow data available." />;
    }

    const pardotDelivered = pardotFlows.reduce((sum, f) => sum + (f.delivered || 0), 0);
    const channelData = [
      { name: "Email Flows", value: klaviyoFlows.filter((f) => f.channel === "email").length || klaviyoFlows.length },
      { name: "SMS Flows", value: klaviyoFlows.filter((f) => f.channel === "sms").length },
      { name: "Pardot Programs", value: pardotFlows.length },
    ].filter((d) => d.value > 0);

    return (
      <div className="space-y-6">
        {execSummaryText && (
          <ExecutiveSummaryEditor initialContent={execSummaryText} channel="email-flows" month={month ?? new Date().toISOString().slice(0, 7)} canEdit={false} />
        )}
        <KPICardGroup columns={4}>
          <KPICard title="Total Flows" value={formatNumber(klaviyoFlows.length + pardotFlows.length)} icon={Workflow} description="Active automation flows" />
          <KPICard title="Total Recipients" value={formatNumber(klaviyoSummary.totalRecipients + pardotDelivered)} icon={Users} description="Flow recipients" trend={prevSummary ? computeChange(klaviyoSummary.totalRecipients, prevSummary.totalRecipients) : undefined} />
          <KPICard title="Avg Open Rate" value={formatPercent(klaviyoSummary.avgOpenRate)} icon={Eye} description="Average flow open rate" trend={prevSummary ? computeChange(klaviyoSummary.avgOpenRate, prevSummary.avgOpenRate) : undefined} />
          <KPICard title="Avg Click Rate" value={formatPercent(klaviyoSummary.avgClickRate)} icon={MousePointerClick} description="Average click rate" trend={prevSummary ? computeChange(klaviyoSummary.avgClickRate, prevSummary.avgClickRate) : undefined} />
        </KPICardGroup>
        <FlowsClient klaviyoFlows={klaviyoFlows} pardotFlows={pardotFlows} channelData={channelData} klaviyoFlowCount={klaviyoFlows.length} pardotFlowCount={pardotFlows.length} avgOpenRate={klaviyoSummary.avgOpenRate} />
      </div>
    );
  } catch {
    return <EmptyState title="Email flows unavailable" description="Could not load flow data." />;
  }
}

// ─── Web Traffic section ─────────────────────────────────────────────────────

async function WebTrafficSection({
  clientId,
  dateRange,
  compare,
  month,
}: {
  clientId: string;
  dateRange?: { start: Date; end: Date };
  compare: boolean;
  month?: string;
}) {
  try {
    const [webSummary, acquisitionSummary, acquisition, execSummaryText] = await Promise.all([
      getWebSummary(clientId, dateRange),
      getAcquisitionSummary(clientId, dateRange),
      getGA4Acquisition({ clientId, startDate: dateRange?.start, endDate: dateRange?.end }),
      getChannelSummary(clientId, "web-traffic", month ?? new Date().toISOString().slice(0, 7)).catch(() => ""),
    ]);

    let prevWebSummary: typeof webSummary | undefined;
    let prevAcquisitionSummary: typeof acquisitionSummary | undefined;
    if (compare && dateRange) {
      try {
        const prev = month
          ? (() => { const pm = getPreviousMonth(month); return pm ? getMonthDateRange(pm) : undefined; })()
          : getPreviousPeriod(dateRange.start, dateRange.end);
        if (prev) {
          [prevWebSummary, prevAcquisitionSummary] = await Promise.all([
            getWebSummary(clientId, prev),
            getAcquisitionSummary(clientId, prev),
          ]);
        }
      } catch { /* no prev data */ }
    }

    if (!webSummary.totalViews && !acquisition.length) {
      return <EmptyState title="No Web Traffic Data" description="No web analytics data available." />;
    }

    const topSources = acquisition.slice(0, 8).map((a) => ({ name: a.first_user_source || "Direct", value: a.sessions }));
    const userTypeData = [
      { name: "New Users", value: acquisitionSummary.totalNewUsers },
      { name: "Returning Users", value: Math.max(0, acquisitionSummary.totalSessions - acquisitionSummary.totalNewUsers) },
    ].filter((d) => d.value > 0);

    return (
      <div className="space-y-6">
        {execSummaryText && (
          <ExecutiveSummaryEditor initialContent={execSummaryText} channel="web-traffic" month={month ?? new Date().toISOString().slice(0, 7)} canEdit={false} />
        )}
        <KPICardGroup columns={4}>
          <KPICard title="Page Views" value={formatNumber(webSummary.totalViews)} icon={Eye} description="Total page views" trend={prevWebSummary ? computeChange(webSummary.totalViews, prevWebSummary.totalViews) : undefined} />
          <KPICard title="Active Users" value={formatNumber(webSummary.totalUsers)} icon={Users} description="Unique visitors" trend={prevWebSummary ? computeChange(webSummary.totalUsers, prevWebSummary.totalUsers) : undefined} />
          <KPICard title="Avg. Engagement" value={`${Math.round(webSummary.avgEngagementTime)}s`} icon={Clock} description="Average session duration" trend={prevWebSummary ? computeChange(webSummary.avgEngagementTime, prevWebSummary.avgEngagementTime) : undefined} />
          <KPICard title="Engagement Rate" value={formatPercent(acquisitionSummary.avgEngagementRate)} icon={MousePointerClick} description="Average engagement rate" trend={prevAcquisitionSummary ? computeChange(acquisitionSummary.avgEngagementRate, prevAcquisitionSummary.avgEngagementRate) : undefined} />
        </KPICardGroup>
        <TrafficClient acquisition={acquisition} topSources={topSources} userTypeData={userTypeData} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Traffic Summary
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
  } catch {
    return <EmptyState title="Web traffic unavailable" description="Could not load web analytics data." />;
  }
}

// ─── Web Pages section ───────────────────────────────────────────────────────

async function WebPagesSection({
  clientId,
  dateRange,
  compare,
  month,
}: {
  clientId: string;
  dateRange?: { start: Date; end: Date };
  compare: boolean;
  month?: string;
}) {
  try {
    const [webSummary, topPages, pages, execSummaryText] = await Promise.all([
      getWebSummary(clientId, dateRange),
      getTopPages(clientId, { limit: 10, dateRange }),
      getGA4Pages({ clientId, startDate: dateRange?.start, endDate: dateRange?.end, limit: 250, offset: 0 }),
      getChannelSummary(clientId, "web-pages", month ?? new Date().toISOString().slice(0, 7)).catch(() => ""),
    ]);

    let prevWebSummary: typeof webSummary | undefined;
    if (compare && dateRange) {
      try {
        const prev = month
          ? (() => { const pm = getPreviousMonth(month); return pm ? getMonthDateRange(pm) : undefined; })()
          : getPreviousPeriod(dateRange.start, dateRange.end);
        if (prev) prevWebSummary = await getWebSummary(clientId, prev);
      } catch { /* no prev data */ }
    }

    if (!webSummary.totalViews && !pages.data.length) {
      return <EmptyState title="No Page Data" description="No page analytics data available." />;
    }

    const topPagesData = topPages.slice(0, 10).map((p) => ({
      name: p.page_title?.slice(0, 30) || p.page_path?.slice(0, 30) || "Untitled",
      value: p.views,
    }));

    const sourceBreakdown = pages.data.reduce((acc, page) => {
      const source = page.source || "Direct";
      acc[source] = (acc[source] || 0) + page.views;
      return acc;
    }, {} as Record<string, number>);

    const sourceData = Object.entries(sourceBreakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    return (
      <div className="space-y-6">
        {execSummaryText && (
          <ExecutiveSummaryEditor initialContent={execSummaryText} channel="web-pages" month={month ?? new Date().toISOString().slice(0, 7)} canEdit={false} />
        )}
        <KPICardGroup columns={4}>
          <KPICard title="Total Views" value={formatNumber(webSummary.totalViews)} icon={Eye} description="All page views" trend={prevWebSummary ? computeChange(webSummary.totalViews, prevWebSummary.totalViews) : undefined} />
          <KPICard title="Unique Users" value={formatNumber(webSummary.totalUsers)} icon={Users} description="Unique visitors" trend={prevWebSummary ? computeChange(webSummary.totalUsers, prevWebSummary.totalUsers) : undefined} />
          <KPICard title="Avg. Engagement" value={`${Math.round(webSummary.avgEngagementTime)}s`} icon={Clock} description="Average time on page" trend={prevWebSummary ? computeChange(webSummary.avgEngagementTime, prevWebSummary.avgEngagementTime) : undefined} />
          <KPICard title="Views per User" value={webSummary.totalUsers > 0 ? (webSummary.totalViews / webSummary.totalUsers).toFixed(1) : "—"} icon={MousePointerClick} description="Average pages per visitor" />
        </KPICardGroup>
        <PagesClient topPages={topPages} pages={pages} topPagesData={topPagesData} sourceData={sourceData} />
      </div>
    );
  } catch {
    return <EmptyState title="Web pages unavailable" description="Could not load page analytics data." />;
  }
}

// ─── Insights section ────────────────────────────────────────────────────────

async function InsightsSection({ clientId, month }: { clientId: string; month?: string }) {
  try {
    let insights = await getInsights(clientId);
    if (month) {
      // Build a target label like "February 2026" from "2026-02"
      const [y, m] = month.split("-");
      const targetLabel = new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

      insights = insights.filter((i) => {
        const pc = i.prompt_context as Record<string, unknown>;
        // 1. Prefer targetMonth (exact YYYY-MM match)
        const tm = pc?.targetMonth;
        if (typeof tm === "string" && tm.trim()) {
          return tm === month;
        }
        // 2. Fall back to monthLabel (case-insensitive)
        const label = pc?.monthLabel;
        if (typeof label === "string" && label.trim()) {
          return label.toLowerCase() === targetLabel.toLowerCase();
        }
        // 3. Fall back to created_at for legacy insights
        const d = new Date(i.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return key === month;
      });
    }
    return <InsightsReport insights={insights} />;
  } catch {
    return <EmptyState title="Insights unavailable" description="Could not load insights." />;
  }
}

// ─── Report page ─────────────────────────────────────────────────────────────

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { dateRange, compare, month } = parseRollupDateParams(params);

  const clientId = MOCK_CLIENT_ID;

  const availableMonths = await getDistinctUploadMonths(clientId);


  // Default to the most recent available month when none is selected
  const effectiveMonth = month ?? availableMonths[0] ?? new Date().toISOString().slice(0, 7);
  const dateLabel = dateRange
    ? `${dateRange.start.toLocaleDateString()} – ${dateRange.end.toLocaleDateString()}`
    : effectiveMonth;

  const sectionProps = { clientId, dateRange, compare, month: effectiveMonth };

  // Build comparison label when compare is enabled
  const prevMonth = compare ? getPreviousMonth(effectiveMonth) : undefined;
  const compareLabel = prevMonth
    ? `Compared to ${new Date(Number(prevMonth.split("-")[0]), Number(prevMonth.split("-")[1]) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
    : undefined;

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-12">
      {/* Report header */}
      <div className="flex items-start justify-between no-print">
        <div>
          <h1 className="text-3xl font-bold">Sente Marketing Report</h1>
          <p className="text-muted-foreground mt-1">{dateLabel}</p>
          {compareLabel && <p className="text-sm text-muted-foreground">{compareLabel}</p>}
        </div>
        <ReportControls availableMonths={availableMonths} currentMonth={effectiveMonth} />
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-8">
        <h1 className="text-3xl font-bold">Sente Marketing Report</h1>
        <p className="text-muted-foreground">{dateLabel}</p>
        {compareLabel && <p className="text-sm text-muted-foreground">{compareLabel}</p>}
      </div>

      {/* Overview */}
      <section>
        <SectionHeader title="Overview" subtitle="Cross-channel marketing performance summary" />
        <Suspense fallback={<DashboardSkeleton />}>
          <OverviewSection {...sectionProps} />
        </Suspense>
      </section>

      {/* Email Campaigns */}
      <section className="print-break-before">
        <SectionHeader title="Email Campaigns" subtitle="Performance metrics for email marketing campaigns" />
        <Suspense fallback={<DashboardSkeleton />}>
          <EmailCampaignsSection {...sectionProps} />
        </Suspense>
      </section>

      {/* Email Flows */}
      <section className="print-break-before">
        <SectionHeader title="Email Flows" subtitle="Performance metrics for automated email flows and programs" />
        <Suspense fallback={<DashboardSkeleton />}>
          <EmailFlowsSection {...sectionProps} />
        </Suspense>
      </section>

      {/* Web Traffic */}
      <section className="print-break-before">
        <SectionHeader title="Web Traffic" subtitle="Website traffic analytics and acquisition insights" />
        <Suspense fallback={<DashboardSkeleton />}>
          <WebTrafficSection {...sectionProps} />
        </Suspense>
      </section>

      {/* Web Pages */}
      <section className="print-break-before">
        <SectionHeader title="Page Performance" subtitle="Analytics for individual page performance" />
        <Suspense fallback={<DashboardSkeleton />}>
          <WebPagesSection {...sectionProps} />
        </Suspense>
      </section>

      {/* Insights */}
      <section className="print-break-before">
        <SectionHeader
          title="Insights"
          subtitle="Analysis and recommendations across all marketing channels"
        />
        <Suspense fallback={<DashboardSkeleton />}>
          <InsightsSection clientId={clientId} month={month} />
        </Suspense>
      </section>
    </div>
  );
}
