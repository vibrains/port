import { MarketingFunnel, type FunnelStage } from "@/components/charts/marketing-funnel";
import { Skeleton } from "@/components/ui/skeleton";
import { getEmailCampaignsSummary, getKlaviyoFlowsSummary } from "@/lib/db/queries/email";
import { getSocialSummary } from "@/lib/db/queries/social";
import { getAcquisitionSummary } from "@/lib/db/queries/web";
import { computeChange } from "@/lib/utils/comparison";
import { getPreviousPeriod, getPreviousMonth, getMonthDateRange } from "@/lib/utils/dates";

interface ExecutiveFunnelProps {
  clientId: string;
  dateRange?: { start: Date; end: Date };
  compare?: boolean;
  month?: string;
}

function divideOrNull(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous <= 0) return null;
  return current / previous;
}

export async function ExecutiveFunnel({ clientId, dateRange, compare = false, month }: ExecutiveFunnelProps) {
  const [emailSummary, flowSummary, acquisitionSummary, socialSummary] = await Promise.all([
    getEmailCampaignsSummary(clientId, dateRange),
    getKlaviyoFlowsSummary(clientId, dateRange),
    getAcquisitionSummary(clientId, dateRange),
    getSocialSummary(clientId, dateRange),
  ]);

  const emailRecipients = emailSummary.totalRecipients + flowSummary.totalRecipients;
  const emailOpenRate =
    emailRecipients > 0
      ? (
          emailSummary.avgOpenRate * emailSummary.totalRecipients +
          flowSummary.avgOpenRate * flowSummary.totalRecipients
        ) / emailRecipients
      : 0;
  const emailClickRate =
    emailRecipients > 0
      ? (
          emailSummary.avgClickRate * emailSummary.totalRecipients +
          flowSummary.avgClickRate * flowSummary.totalRecipients
        ) / emailRecipients
      : 0;

  const emailOpens = Math.round(emailOpenRate * emailRecipients);
  const emailClicks = Math.round(emailClickRate * emailRecipients);
  const engagedSessions = Math.round(acquisitionSummary.avgEngagementRate * acquisitionSummary.totalSessions);

  const awarenessValue = socialSummary.totalImpressions + emailSummary.totalRecipients + flowSummary.totalRecipients;
  const trafficValue = acquisitionSummary.totalSessions;
  const engagementValue = emailOpens + emailClicks + socialSummary.totalEngagements + engagedSessions;

  const stages: FunnelStage[] = [
    {
      name: "Awareness",
      value: awarenessValue,
      valueType: "number",
      breakdown: [
        { label: "Social Impressions", value: socialSummary.totalImpressions, color: "#8b5cf6" },
        { label: "Email Recipients", value: emailSummary.totalRecipients, color: "#3b82f6" },
        { label: "Flow Recipients", value: flowSummary.totalRecipients, color: "#06b6d4" },
      ],
      enabled: true,
    },
    {
      name: "Traffic",
      value: trafficValue,
      valueType: "number",
      conversionRate: divideOrNull(trafficValue, awarenessValue),
      breakdown: [
        { label: "Web Sessions", value: acquisitionSummary.totalSessions, color: "#22c55e" },
        { label: "New Users", value: acquisitionSummary.totalNewUsers, color: "#16a34a" },
      ],
      enabled: true,
    },
    {
      name: "Engagement",
      value: engagementValue,
      valueType: "number",
      conversionRate: divideOrNull(engagementValue, trafficValue),
      breakdown: [
        { label: "Email Opens", value: emailOpens, color: "#3b82f6" },
        { label: "Email Clicks", value: emailClicks, color: "#2563eb" },
        { label: "Social Engagements", value: socialSummary.totalEngagements, color: "#8b5cf6" },
        { label: "Engaged Sessions", value: engagedSessions, color: "#22c55e" },
      ],
      enabled: true,
    },
    {
      name: "Conversion",
      value: null,
      breakdown: [{ label: "Key Events", value: null, color: "#9ca3af" }],
      placeholder: "Configure GA4 goal tracking to populate this stage.",
      enabled: false,
    },
  ];

  if (compare && dateRange) {
    const prev =
      month
        ? (() => {
            const previousMonth = getPreviousMonth(month);
            return previousMonth ? getMonthDateRange(previousMonth) : undefined;
          })()
        : getPreviousPeriod(dateRange.start, dateRange.end);

    if (!prev) {
      return (
        <MarketingFunnel
          stages={stages}
          title="Cross-Channel Marketing Funnel"
          description="Touchpoints to traffic and engagement, with conversion visibility"
        />
      );
    }

    const [prevEmailSummary, prevFlowSummary, prevAcquisitionSummary, prevSocialSummary] =
      await Promise.all([
        getEmailCampaignsSummary(clientId, prev),
        getKlaviyoFlowsSummary(clientId, prev),
        getAcquisitionSummary(clientId, prev),
        getSocialSummary(clientId, prev),
      ]);

    const prevRecipients = prevEmailSummary.totalRecipients + prevFlowSummary.totalRecipients;
    const prevOpenRate =
      prevRecipients > 0
        ? (
            prevEmailSummary.avgOpenRate * prevEmailSummary.totalRecipients +
            prevFlowSummary.avgOpenRate * prevFlowSummary.totalRecipients
          ) / prevRecipients
        : 0;
    const prevClickRate =
      prevRecipients > 0
        ? (
            prevEmailSummary.avgClickRate * prevEmailSummary.totalRecipients +
            prevFlowSummary.avgClickRate * prevFlowSummary.totalRecipients
          ) / prevRecipients
        : 0;

    const prevAwareness =
      prevSocialSummary.totalImpressions + prevEmailSummary.totalRecipients + prevFlowSummary.totalRecipients;
    const prevTraffic = prevAcquisitionSummary.totalSessions;
    const prevEngagement =
      Math.round(prevOpenRate * prevRecipients) +
      Math.round(prevClickRate * prevRecipients) +
      prevSocialSummary.totalEngagements +
      Math.round(prevAcquisitionSummary.avgEngagementRate * prevAcquisitionSummary.totalSessions);
    const previousValues = [prevAwareness, prevTraffic, prevEngagement, 0];

    stages.forEach((stage, index) => {
      if (stage.enabled) {
        stage.trend = computeChange(stage.value ?? 0, previousValues[index] ?? 0);
      }
    });
  }

  return (
    <MarketingFunnel
      stages={stages}
      title="Cross-Channel Marketing Funnel"
      description="Touchpoints to traffic and engagement, with conversion visibility"
    />
  );
}

export function ExecutiveFunnelSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow">
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="mt-6 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-[85%] mx-auto" />
        <Skeleton className="h-24 w-[70%] mx-auto" />
        <Skeleton className="h-24 w-[55%] mx-auto" />
      </div>
    </div>
  );
}
