/**
 * Email Flows Page
 * Displays Klaviyo and Pardot flow performance
 * @module app/(dashboard)/email/flows/page
 */

import { Suspense } from "react";
import { Metadata } from "next";
import {
  Workflow,
  Users,
  Eye,
  MousePointerClick,
  DollarSign,
} from "lucide-react";

import { MOCK_CLIENT_ID } from "@/lib/mock-data";
import {
  getKlaviyoFlows,
  getKlaviyoFlowsSummary,
  getPardotFlows,
} from "@/lib/db/queries/email";
import { getExecutiveSummary } from "@/lib/db/queries/executive-summary";
import { ExecutiveSummaryEditor } from "@/components/dashboard/executive-summary-editor";
import { KPICard } from "@/components/dashboard/kpi-card";
import { KPICardGroup } from "@/components/dashboard/kpi-card-group";
import { FlowsClient } from "@/components/email/flows-client";
import { FlowTypeFilter } from "@/components/email/flow-type-filter";
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
  title: "Email Flows | Sente Dashboard",
  description: "Email automation flow performance analytics",
};

/**
 * Email flows content component
 */
async function EmailFlowsContent({
  dateRange,
  compare,
  month,
  flowType,
}: {
  dateRange?: { start: Date; end: Date };
  compare: boolean;
  month?: string;
  flowType: "all" | "b2c" | "b2b";
}) {
  const clientId = MOCK_CLIENT_ID;

  try {
    const showB2C = flowType !== "b2b";
    const showB2B = flowType !== "b2c";

    const [klaviyoSummary, klaviyoFlows, pardotFlows] = await Promise.all([
      showB2C
        ? getKlaviyoFlowsSummary(clientId, dateRange, month)
        : Promise.resolve({ totalRecipients: 0, avgOpenRate: 0, avgClickRate: 0, totalRevenue: 0 }),
      showB2C
        ? getKlaviyoFlows({
            clientId,
            startDate: dateRange?.start,
            endDate: dateRange?.end,
            monthKey: month,
          })
        : Promise.resolve([]),
      showB2B
        ? getPardotFlows({ clientId, monthKey: month })
        : Promise.resolve([]),
    ]);

    let prevSummary: typeof klaviyoSummary | undefined;
    if (compare && dateRange) {
      try {
        if (month) {
          const previousMonth = getPreviousMonth(month);
          const previousMonthRange = previousMonth ? getMonthDateRange(previousMonth) : undefined;
          if (previousMonthRange) {
            prevSummary = await getKlaviyoFlowsSummary(clientId, previousMonthRange, previousMonth);
          }
        } else {
          const prev = getPreviousPeriod(dateRange.start, dateRange.end);
          prevSummary = await getKlaviyoFlowsSummary(clientId, prev);
        }
      } catch {
        // Previous period data unavailable; trends will not show
      }
    }

    const hasData = klaviyoFlows.length > 0 || pardotFlows.length > 0;

    if (!hasData) {
      return (
        <EmptyState
          title="No Email Flows"
          description="Upload your email flow data to see automation performance."
        />
      );
    }

    const pardotDelivered = pardotFlows.reduce((sum, f) => sum + (f.delivered || 0), 0);

    // Channel breakdown for pie chart
    const channelData = [
      {
        name: "Email Flows",
        value: klaviyoFlows.filter((f) => f.channel === "email").length || klaviyoFlows.length,
      },
      {
        name: "SMS Flows",
        value: klaviyoFlows.filter((f) => f.channel === "sms").length || 0,
      },
      {
        name: "Pardot Programs",
        value: pardotFlows.length,
      },
    ].filter((d) => d.value > 0);

    return (
      <div className="space-y-6">
        {/* KPI Cards */}
        <KPICardGroup columns={5}>
          <KPICard
            title="Total Flows"
            value={formatNumber(klaviyoFlows.length + pardotFlows.length)}
            icon={Workflow}
            description="Active automation flows"
          />
          <KPICard
            title="Total Recipients"
            value={formatNumber(klaviyoSummary.totalRecipients + pardotDelivered)}
            icon={Users}
            description="Flow recipients"
            trend={prevSummary ? computeChange(klaviyoSummary.totalRecipients, prevSummary.totalRecipients) : undefined}
          />
          <KPICard
            title="Avg Open Rate"
            value={formatPercent(klaviyoSummary.avgOpenRate)}
            icon={Eye}
            description="Average flow open rate"
            trend={prevSummary ? computeChange(klaviyoSummary.avgOpenRate, prevSummary.avgOpenRate) : undefined}
          />
          <KPICard
            title="Avg Click Rate"
            value={formatPercent(klaviyoSummary.avgClickRate)}
            icon={MousePointerClick}
            description="Average click rate"
            trend={prevSummary ? computeChange(klaviyoSummary.avgClickRate, prevSummary.avgClickRate) : undefined}
          />
          <KPICard
            title="Revenue"
            value={formatCurrency(klaviyoSummary.totalRevenue)}
            icon={DollarSign}
            description="Total flow revenue"
            trend={prevSummary ? computeChange(klaviyoSummary.totalRevenue, prevSummary.totalRevenue) : undefined}
          />
        </KPICardGroup>

        {/* Charts + DataTables */}
        <FlowsClient
          klaviyoFlows={klaviyoFlows}
          pardotFlows={pardotFlows}
          channelData={channelData}
          klaviyoFlowCount={klaviyoFlows.length}
          pardotFlowCount={pardotFlows.length}
          avgOpenRate={klaviyoSummary.avgOpenRate}
        />
      </div>
    );
  } catch (error) {
    console.error("Error loading email flows:", error);
    return (
      <EmptyState
        title="Error Loading Data"
        description="There was a problem loading your email flow data."
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
 * Email Flows Page
 */
export default async function EmailFlowsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { dateRange, compare, month } = parseRollupDateParams(params);
  const activeMonth = month ?? new Date().toISOString().slice(0, 7);
  const flowTypeParam = typeof params.flowType === "string" ? params.flowType : "all";
  const flowType =
    flowTypeParam === "b2c" || flowTypeParam === "b2b" ? flowTypeParam : "all";

  const clientId = MOCK_CLIENT_ID;
  const executiveSummaryContent = await getExecutiveSummary(clientId, "email-flows", activeMonth).catch(() => "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Flows</h1>
          <p className="text-muted-foreground">
            Performance metrics for your automated email flows and programs
          </p>
        </div>
        <FlowTypeFilter />
      </div>

      {/* Executive Summary */}
      <ExecutiveSummaryEditor
        initialContent={executiveSummaryContent}
        channel="email-flows"
        month={activeMonth}
        canEdit={true}
      />

      {/* Content with Suspense */}
      <Suspense fallback={<DashboardSkeleton />}>
        <EmailFlowsContent dateRange={dateRange} compare={compare} month={month} flowType={flowType} />
      </Suspense>
    </div>
  );
}
