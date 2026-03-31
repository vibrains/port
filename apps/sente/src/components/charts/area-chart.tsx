/**
 * Area Chart Component
 * A reusable stacked area chart component using Chart.js
 * @module components/charts/area-chart
 */

"use client";

import "@/lib/chartjs-setup";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { formatDate } from "@/lib/utils/dates";

interface AreaChartDataPoint {
  date: string;
  [key: string]: number | string;
}

interface AreaConfig {
  key: string;
  name: string;
  color: string;
  stackId?: string;
  useGradient?: boolean;
}

interface AreaChartProps {
  data: AreaChartDataPoint[];
  areas: AreaConfig[];
  xAxisKey?: string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  xAxisFormatter?: (value: string) => string;
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;
  className?: string;
  defaultStackId?: string;
  ariaLabel?: string;
}

/**
 * Converts a hex color to rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AreaChart({
  data,
  areas,
  xAxisKey = "date",
  yAxisFormatter,
  tooltipFormatter,
  xAxisFormatter,
  showGrid = true,
  showLegend = true,
  height = 300,
  className,
  defaultStackId = "total",
  ariaLabel: ariaLabelProp,
}: AreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={className} style={{ width: "100%", height }}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  const formatXLabel = (value: string) => {
    if (xAxisFormatter) return xAxisFormatter(value);
    try {
      return formatDate(value, "short");
    } catch {
      return value;
    }
  };

  const labels = data.map((d) => String(d[xAxisKey] ?? ""));

  // Determine if stacked — all areas share the same stackId
  const stackIds = new Set(areas.map((a) => a.stackId ?? defaultStackId));
  const isStacked = stackIds.size === 1;

  const chartData = {
    labels,
    datasets: areas.map((area) => ({
      label: area.name,
      data: data.map((d) => Number(d[area.key] ?? 0)),
      borderColor: area.color,
      backgroundColor: hexToRgba(area.color, 0.15),
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 4,
      stack: area.stackId ?? defaultStackId,
    })),
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: "bottom" as const,
        labels: { font: { size: 12 }, padding: 16, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: "hsl(0 0% 100%)",
        titleColor: "hsl(0 0% 9%)",
        bodyColor: "hsl(0 0% 9%)",
        borderColor: "hsl(0 0% 90%)",
        borderWidth: 1,
        padding: 8,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          title: (items) => {
            const raw = items[0]?.label ?? "";
            try {
              return formatDate(raw, "medium");
            } catch {
              return raw;
            }
          },
          label: (ctx) => {
            const val = ctx.parsed.y ?? 0;
            const formatted = tooltipFormatter
              ? tooltipFormatter(val)
              : String(val);
            return ` ${ctx.dataset.label}: ${formatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: showGrid, color: "hsl(0 0% 90% / 0.5)" },
        border: { color: "hsl(0 0% 90%)" },
        ticks: {
          font: { size: 12 },
          color: "hsl(0 0% 45%)",
          callback: (_, index) => formatXLabel(labels[index]),
        },
      },
      y: {
        stacked: isStacked,
        grid: { display: showGrid, color: "hsl(0 0% 90% / 0.5)" },
        border: { color: "hsl(0 0% 90%)" },
        ticks: {
          font: { size: 12 },
          color: "hsl(0 0% 45%)",
          callback: (value) =>
            yAxisFormatter ? yAxisFormatter(value as number) : String(value),
        },
      },
    },
  };

  return (
    <div className={className} style={{ width: "100%", height }}>
      <Line data={chartData} options={options} aria-label={ariaLabelProp ?? `Area chart: ${areas.map(a => a.name).join(", ")}`} />
    </div>
  );
}
