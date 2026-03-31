/**
 * Bar Chart Component
 * A reusable bar chart component using Chart.js
 * @module components/charts/bar-chart
 */

"use client";

import "@/lib/chartjs-setup";
import { Bar } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";

interface BarChartDataPoint {
  name: string;
  value: number;
  [key: string]: unknown;
}

interface BarConfig {
  key: string;
  name: string;
  color: string;
  radius?: [number, number, number, number];
}

interface BarChartProps {
  data: BarChartDataPoint[];
  bars: BarConfig[];
  layout?: "vertical" | "horizontal";
  xAxisFormatter?: (value: string | number) => string;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;
  className?: string;
  itemColors?: string[];
  ariaLabel?: string;
}

export function BarChart({
  data,
  bars,
  layout = "horizontal",
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  showGrid = true,
  showLegend,
  height = 300,
  className,
  itemColors,
  ariaLabel,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={className} style={{ width: "100%", height }}>
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      </div>
    );
  }

  const shouldShowLegend = showLegend ?? bars.length > 1;
  const isHorizontal = layout === "horizontal";

  const labels = data.map((d) => d.name);

  const chartData = {
    labels,
    datasets: bars.map((bar) => {
      const values = data.map((d) => Number(d[bar.key] ?? 0));
      const bgColors = itemColors
        ? data.map((_, i) => itemColors[i % itemColors.length])
        : bar.color;

      return {
        label: bar.name,
        data: values,
        backgroundColor: bgColors,
        borderRadius: bar.radius
          ? { topLeft: bar.radius[0], topRight: bar.radius[1], bottomRight: bar.radius[2], bottomLeft: bar.radius[3] }
          : 4,
        borderSkipped: false as const,
      };
    }),
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: isHorizontal ? ("x" as const) : ("y" as const),
    plugins: {
      legend: {
        display: shouldShowLegend,
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
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed[isHorizontal ? "y" : "x"] ?? 0;
            const formatted = tooltipFormatter ? tooltipFormatter(val) : String(val);
            return ` ${ctx.dataset.label}: ${formatted}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: showGrid && !isHorizontal, color: "hsl(0 0% 90% / 0.5)" },
        border: { color: "hsl(0 0% 90%)" },
        ticks: {
          font: { size: 12 },
          color: "hsl(0 0% 45%)",
          callback: (value, index) => {
            if (isHorizontal) {
              return xAxisFormatter ? xAxisFormatter(labels[index]) : labels[index];
            }
            return yAxisFormatter ? yAxisFormatter(value as number) : String(value);
          },
        },
      },
      y: {
        grid: { display: showGrid && isHorizontal, color: "hsl(0 0% 90% / 0.5)" },
        border: { color: "hsl(0 0% 90%)" },
        ticks: {
          font: { size: 12 },
          color: "hsl(0 0% 45%)",
          callback: (value, index) => {
            if (!isHorizontal) {
              return xAxisFormatter ? xAxisFormatter(labels[index]) : labels[index];
            }
            return yAxisFormatter ? yAxisFormatter(value as number) : String(value);
          },
        },
      },
    },
  };

  return (
    <div className={className} style={{ width: "100%", height }}>
      <Bar data={chartData} options={options} aria-label={ariaLabel ?? `Bar chart showing ${bars.map(b => b.name).join(", ")}`} />
    </div>
  );
}
