/**
 * Engagement Bubble Chart wrapper
 * Transforms social + email engagement-by-day-hour data into bubble chart datasets
 * Bubble size = engagement rate (not volume)
 * @module components/charts/engagement-bubble-chart
 */

"use client";

import { useState } from "react";
import { ChartContainer } from "@/components/charts/chart-container";
import { BubbleChart, type BubbleDataPoint } from "@/components/charts/bubble-chart";
import { formatNumber, formatPercent } from "@/lib/utils/format";

interface SocialDayHour {
  day_of_week: number;
  hour_of_day: number;
  post_count: number;
  total_engagements: number;
  avg_engagement_rate: number;
  posts: { network: string; post_text: string; engagements: number; published_at: string }[];
}

interface EmailDayHour {
  day_of_week: number;
  hour_of_day: number;
  campaign_count: number;
  total_recipients: number;
  avg_open_rate: number;
  avg_click_rate?: number;
  campaigns: { campaign_name: string; total_recipients: number; open_rate: number; click_rate?: number; send_date: string }[];
}

type EmailMetric = "open_rate" | "click_rate";

interface EngagementBubbleChartProps {
  socialData: SocialDayHour[];
  emailData: EmailDayHour[];
}

export function EngagementBubbleChart({ socialData, emailData }: EngagementBubbleChartProps) {
  const [emailMetric, setEmailMetric] = useState<EmailMetric>("open_rate");

  const socialBubbles: BubbleDataPoint[] = socialData.map((d) => ({
    day_of_week: d.day_of_week,
    hour_of_day: d.hour_of_day,
    value: d.avg_engagement_rate,
    tooltipItems: [
      { label: "Engagement rate", detail: formatPercent(d.avg_engagement_rate) },
      { label: "Posts", detail: `${d.post_count} (${formatNumber(d.total_engagements)} engagements)` },
      ...d.posts.slice(0, 2).map((p) => ({
        label: p.network,
        detail: `${p.post_text?.slice(0, 40) || "Post"}...`,
      })),
    ],
  }));

  const metricLabel = emailMetric === "open_rate" ? "Open rate" : "Click rate";

  const emailBubbles: BubbleDataPoint[] = emailData.map((d) => {
    const value = emailMetric === "open_rate" ? d.avg_open_rate : (d.avg_click_rate ?? 0);
    return {
      day_of_week: d.day_of_week,
      hour_of_day: d.hour_of_day,
      value,
      tooltipItems: [
        { label: metricLabel, detail: formatPercent(value) },
        { label: "Campaigns", detail: `${d.campaign_count} (${formatNumber(d.total_recipients)} recipients)` },
        ...d.campaigns.slice(0, 2).map((c) => ({
          label: c.campaign_name.slice(0, 30),
          detail: formatPercent(emailMetric === "open_rate" ? c.open_rate : (c.click_rate ?? 0)),
        })),
      ],
    };
  });

  const hasData = socialBubbles.length > 0 || emailBubbles.length > 0;

  const description = emailMetric === "open_rate"
    ? "When your content drives the most engagement (bubble size = open rate)"
    : "When your content drives the most clicks (bubble size = click rate)";

  return (
    <ChartContainer
      title="Engagement Timing"
      description={description}
      isEmpty={!hasData}
      action={
        <div className="flex items-center gap-1 rounded-lg border bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setEmailMetric("open_rate")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              emailMetric === "open_rate"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Open Rate
          </button>
          <button
            type="button"
            onClick={() => setEmailMetric("click_rate")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              emailMetric === "click_rate"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Click Rate
          </button>
        </div>
      }
    >
      <BubbleChart
        datasets={[
          { label: "Social", color: "#8b5cf6", data: socialBubbles },
          { label: `Email (${metricLabel.toLowerCase()})`, color: "#3b82f6", data: emailBubbles },
        ]}
      />
    </ChartContainer>
  );
}
