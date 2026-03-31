/**
 * Pie Chart Component
 * A reusable donut/pie chart component using Chart.js
 * @module components/charts/pie-chart
 */

"use client";

import * as React from "react";
import "@/lib/chartjs-setup";
import { Doughnut } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { CHART_COLORS } from "@/lib/utils/colors";

interface PieChartDataPoint {
  name: string;
  value: number;
}

interface PieChartProps {
  data: PieChartDataPoint[];
  colors?: readonly string[];
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  paddingAngle?: number;
  cornerRadius?: number;
  showLabels?: boolean;
  tooltipFormatter?: (value: number, name: string) => string;
  legendFormatter?: (value: string) => string;
  height?: number;
  className?: string;
  legendPosition?: "bottom" | "right" | "left";
  ariaLabel?: string;
}

export function PieChart({
  data,
  colors = CHART_COLORS,
  showLegend = true,
  innerRadius = 0.6,
  paddingAngle = 2,
  cornerRadius = 4,
  tooltipFormatter,
  legendFormatter,
  height = 300,
  className,
  legendPosition = "bottom",
  ariaLabel,
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={className} style={{ width: "100%", height }}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  const total = React.useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  );

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((_, i) => colors[i % colors.length]),
        borderColor: "hsl(0 0% 100%)",
        borderWidth: 2,
        spacing: paddingAngle,
        borderRadius: cornerRadius,
      },
    ],
  };

  const cutoutPercent = `${Math.round(innerRadius * 100 * (1 / 0.8))}%`;

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: innerRadius > 0 ? cutoutPercent : "0%",
    plugins: {
      legend: {
        display: showLegend,
        position: legendPosition,
        align: legendPosition === "bottom" ? "center" : "start",
        labels: {
          font: { size: 12 },
          padding: 16,
          usePointStyle: true,
          generateLabels: (chart) => {
            const dataset = chart.data.datasets[0];
            return (chart.data.labels || []).map((label, i) => ({
              text: legendFormatter
                ? legendFormatter(label as string)
                : (label as string),
              fillStyle: (dataset.backgroundColor as string[])[i],
              strokeStyle: "transparent",
              index: i,
              hidden: false,
              pointStyle: "circle" as const,
            }));
          },
        },
      },
      tooltip: {
        backgroundColor: "hsl(0 0% 100%)",
        titleColor: "hsl(0 0% 9%)",
        bodyColor: "hsl(0 0% 9%)",
        borderColor: "hsl(0 0% 90%)",
        borderWidth: 1,
        padding: 8,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed;
            const name = ctx.label ?? "";
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
            const formatted = tooltipFormatter
              ? tooltipFormatter(val, name)
              : String(val);
            return ` ${name}: ${formatted} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className={className} style={{ width: "100%", height }}>
      <Doughnut data={chartData} options={options} aria-label={ariaLabel ?? `Pie chart showing ${data.map(d => d.name).join(", ")}`} />
    </div>
  );
}
