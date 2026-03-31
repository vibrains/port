/**
 * Line Chart Component
 * A reusable line chart component using Chart.js
 * @module components/charts/line-chart
 */

"use client";

import "@/lib/chartjs-setup";
import { Line } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
import { formatDate } from "@/lib/utils/dates";

interface LineChartDataPoint {
  date: string;
  [key: string]: unknown;
}

interface LineConfig {
  key: string;
  name: string;
  color: string;
}

interface LineChartProps {
  data: LineChartDataPoint[];
  lines: LineConfig[];
  xAxisKey?: string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  xAxisFormatter?: (value: string) => string;
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;
  className?: string;
  ariaLabel?: string;
}

export function LineChart({
  data,
  lines,
  xAxisKey = "date",
  yAxisFormatter,
  tooltipFormatter,
  xAxisFormatter,
  showGrid = true,
  showLegend,
  height = 300,
  className,
  ariaLabel,
}: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={className} style={{ width: "100%", height }}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  const shouldShowLegend = showLegend ?? lines.length > 1;

  const formatXLabel = (value: string) => {
    if (xAxisFormatter) return xAxisFormatter(value);
    try {
      return formatDate(value, "short");
    } catch {
      return value;
    }
  };

  const labels = data.map((d) => String(d[xAxisKey] ?? ""));

  const chartData = {
    labels,
    datasets: lines.map((line) => ({
      label: line.name,
      data: data.map((d) => Number(d[line.key] ?? 0)),
      borderColor: line.color,
      backgroundColor: line.color,
      borderWidth: 2,
      pointRadius: 3,
      pointBackgroundColor: line.color,
      pointBorderWidth: 0,
      pointHoverRadius: 5,
      pointHoverBorderWidth: 2,
      pointHoverBorderColor: line.color,
      tension: 0.4,
    })),
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: shouldShowLegend,
        position: "bottom" as const,
        labels: {
          font: { size: 12 },
          padding: 16,
          usePointStyle: true,
        },
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
            const formatted = tooltipFormatter ? tooltipFormatter(val) : String(val);
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
      <Line data={chartData} options={options} aria-label={ariaLabel ?? `Line chart showing ${lines.map(l => l.name).join(", ")}`} />
    </div>
  );
}
