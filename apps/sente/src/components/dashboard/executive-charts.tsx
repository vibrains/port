/**
 * Executive Charts Client Component
 * Renders trend charts with formatter functions on the client side
 * @module components/dashboard/executive-charts
 */

"use client";

import { ChartContainer } from "@/components/charts/chart-container";
import { LineChart } from "@/components/charts/line-chart";
import { formatPercent } from "@/lib/utils/format";
import { NETWORK_COLORS } from "@/lib/utils/colors";

interface EngagementDataPoint {
  date: string;
  [network: string]: number | string;
}

interface ClickRateDataPoint {
  date: string;
  b2c: number;
  b2b: number;
  [key: string]: unknown;
}

interface ExecutiveChartsProps {
  engagementsTrend: EngagementDataPoint[];
  clickRateTrend: ClickRateDataPoint[];
}

/**
 * Client component that renders executive summary trend charts.
 * Keeps formatter functions (yAxisFormatter, tooltipFormatter) on the client side
 * to avoid passing non-serializable props from Server Components.
 */
export function ExecutiveCharts({
  engagementsTrend,
  clickRateTrend,
}: ExecutiveChartsProps) {
  // Derive the set of networks present in the data
  const networks = Array.from(
    new Set(
      engagementsTrend.flatMap((d) =>
        Object.keys(d).filter((k) => k !== "date")
      )
    )
  );

  const engagementLines = networks.map((network) => ({
    key: network,
    name: network.charAt(0).toUpperCase() + network.slice(1),
    color: NETWORK_COLORS[network] ?? "#6b7280",
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ChartContainer
        title="Social Engagement Trend"
        description="Engagements over time by network"
      >
        <LineChart
          data={engagementsTrend}
          lines={engagementLines}
          xAxisKey="date"
        />
      </ChartContainer>

      <ChartContainer
        title="Email Click Rate Trend"
        description="Average click rate over time"
      >
        <LineChart
          data={clickRateTrend}
          lines={[
            { key: "b2c", name: "B2C", color: "#3b82f6" },
            { key: "b2b", name: "B2B", color: "#f59e0b" },
          ]}
          xAxisKey="date"
          yAxisFormatter={(value: number) => formatPercent(value)}
          tooltipFormatter={(value: number) => formatPercent(value)}
        />
      </ChartContainer>
    </div>
  );
}
