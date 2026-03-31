/**
 * Email Campaigns Page
 * Displays email campaign performance with filtering and sorting
 * @module app/(dashboard)/email/page
 */

import { Suspense } from "react";
import { Metadata } from "next";
import {
  Mail,
  Users,
  Eye,
  MousePointerClick,
  DollarSign,
} from "lucide-react";

import { MOCK_CLIENT_ID } from "@/lib/mock-data";
import { getEmailCampaigns, getEmailCampaignsSummary } from "@/lib/db/queries/email";
import { getExecutiveSummary } from "@/lib/db/queries/executive-summary";
import { ExecutiveSummaryEditor } from "@/components/dashboard/executive-summary-editor";
import { KPICard } from "@/components/dashboard/kpi-card";
import { KPICardGroup } from "@/components/dashboard/kpi-card-group";
import { CampaignsClient } from "@/components/email/campaigns-client";
import { CampaignTypeFilter } from "@/components/email/campaign-type-filter";
import { DashboardSkeleton } from "@/components/dashboard/skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatNumber, formatPercent, formatCurrency } from "@/lib/utils/format";
import {
  parseRollupDateParams,
  getPreviousPeriod,
  getPreviousMonth,
  getMonthDateRange,
} from "@/lib/utils/dates";
import { computeChange } from "@/lib/utils/comparison";

export const metadata: Metadata = {
  title: "Email Campaigns | Sente Dashboard",
  description: "Email campaign performance analytics",
};

/**
 * Email campaigns content component
 */
async function EmailCampaignsContent({
  dateRange,
  compare,
  month,
  campaignType,
}: {
  dateRange?: { start: Date; end: Date };
  compare: boolean;
  month?: string;
  campaignType: "all" | "b2c" | "b2b";
}) {
  const clientId = MOCK_CLIENT_ID;

  try {
    const sourceFilter =
      campaignType === "b2c"
        ? "klaviyo"
        : campaignType === "b2b"
          ? "pardot"
          : undefined;

    const [summary, campaigns] = await Promise.all([
      getEmailCampaignsSummary(clientId, dateRange, sourceFilter),
      getEmailCampaigns({
        clientId,
        startDate: dateRange?.start,
        endDate: dateRange?.end,
        source: sourceFilter,
        limit: 50,
        offset: 0,
      }),
    ]);

    let prevSummary: typeof summary | undefined;
    if (compare && dateRange) {
      try {
        if (month) {
          const previousMonth = getPreviousMonth(month);
          const previousMonthRange = previousMonth ? getMonthDateRange(previousMonth) : undefined;
          if (previousMonthRange) {
            prevSummary = await getEmailCampaignsSummary(clientId, previousMonthRange, sourceFilter);
          }
        } else {
          const prev = getPreviousPeriod(dateRange.start, dateRange.end);
          prevSummary = await getEmailCampaignsSummary(clientId, prev, sourceFilter);
        }
      } catch {
        // Previous period data unavailable; trends will not show
      }
    }

    const hasData = summary.totalCampaigns > 0;

    if (!hasData) {
      return (
        <EmptyState
          title="No Email Campaigns"
          description="Upload your email campaign data to see performance metrics."
        />
      );
    }

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <KPICardGroup columns={5}>
          <KPICard
            title="Total Campaigns"
            value={formatNumber(summary.totalCampaigns)}
            icon={Mail}
            description="Email campaigns sent"
            trend={prevSummary ? computeChange(summary.totalCampaigns, prevSummary.totalCampaigns) : undefined}
          />
          <KPICard
            title="Total Recipients"
            value={formatNumber(summary.totalRecipients)}
            icon={Users}
            description="Emails delivered"
            trend={prevSummary ? computeChange(summary.totalRecipients, prevSummary.totalRecipients) : undefined}
          />
          <KPICard
            title="Avg Open Rate"
            value={formatPercent(summary.avgOpenRate)}
            icon={Eye}
            description="Average open rate"
            trend={prevSummary ? computeChange(summary.avgOpenRate, prevSummary.avgOpenRate) : undefined}
          />
          <KPICard
            title="Avg Click Rate"
            value={formatPercent(summary.avgClickRate)}
            icon={MousePointerClick}
            description="Average click rate"
            trend={prevSummary ? computeChange(summary.avgClickRate, prevSummary.avgClickRate) : undefined}
          />
          <KPICard
            title="Revenue"
            value={formatCurrency(summary.totalRevenue)}
            icon={DollarSign}
            description="Total campaign revenue"
            trend={prevSummary ? computeChange(summary.totalRevenue, prevSummary.totalRevenue) : undefined}
          />
        </KPICardGroup>

        {/* Charts + DataTable */}
        <CampaignsClient
          campaigns={campaigns.data}
          channelData={[
            { name: "B2C (Klaviyo)", value: campaigns.data.filter((c) => c.source === "klaviyo").length },
            { name: "B2B (Pardot)", value: campaigns.data.filter((c) => c.source === "pardot").length },
          ].filter((d) => d.value > 0)}
          klaviyoCount={campaigns.data.filter((c) => c.source === "klaviyo").length}
          pardotCount={campaigns.data.filter((c) => c.source === "pardot").length}
          avgOpenRate={summary.avgOpenRate}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading email campaigns:", error);
    return (
      <EmptyState
        title="Error Loading Data"
        description="There was a problem loading your email campaign data."
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
 * Email Campaigns Page
 */
export default async function EmailCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { dateRange, compare, month } = parseRollupDateParams(params);
  const activeMonth = month ?? new Date().toISOString().slice(0, 7);
  const campaignTypeParam = typeof params.campaignType === "string" ? params.campaignType : "all";
  const campaignType =
    campaignTypeParam === "b2c" || campaignTypeParam === "b2b" ? campaignTypeParam : "all";

  const clientId = MOCK_CLIENT_ID;
  const executiveSummaryContent = await getExecutiveSummary(clientId, "email", activeMonth).catch(() => "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Performance metrics for your email marketing campaigns
          </p>
        </div>
        <CampaignTypeFilter />
      </div>

      {/* Executive Summary */}
      <ExecutiveSummaryEditor
        initialContent={executiveSummaryContent}
        channel="email"
        month={activeMonth}
        canEdit={true}
      />

      {/* Content with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <EmailCampaignsContent
          dateRange={dateRange}
          compare={compare}
          month={month}
          campaignType={campaignType}
        />
      </Suspense>
    </div>
  );
}
