/**
 * Engagement Bubble Chart Component
 * Shows engagement timing as bubbles on a day-of-week x hour-of-day grid
 * with alternating row/column bands for readability
 * @module components/charts/bubble-chart
 */

"use client";

import "@/lib/chartjs-setup";
import { Bubble } from "react-chartjs-2";
import type { Chart, ChartOptions, Plugin, TooltipItem } from "chart.js";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return "12am";
  if (i === 12) return "12pm";
  return i < 12 ? `${i}am` : `${i - 12}pm`;
});

export interface BubbleDataPoint {
  day_of_week: number;
  hour_of_day: number;
  value: number;
  tooltipItems: { label: string; detail: string }[];
}

interface BubbleChartProps {
  datasets: {
    label: string;
    color: string;
    data: BubbleDataPoint[];
  }[];
  height?: number;
  maxRadius?: number;
}

function scaleRadius(value: number, maxValue: number, maxRadius: number): number {
  if (maxValue === 0) return 3;
  return Math.max(3, Math.sqrt(value / maxValue) * maxRadius);
}

/**
 * Chart.js plugin that draws alternating colored bands behind the grid.
 * Vertical bands for days (x-axis), horizontal bands for hour blocks (y-axis).
 */
const alternatingBandsPlugin: Plugin<"bubble"> = {
  id: "alternatingBands",
  beforeDatasetsDraw(chart: Chart<"bubble">) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales.x || !scales.y) return;

    const { top, bottom, left, right } = chartArea;
    ctx.save();

    // Vertical bands for each day column
    for (let day = 0; day < 7; day++) {
      if (day % 2 === 0) continue;
      const x1 = scales.x.getPixelForValue(day - 0.5);
      const x2 = scales.x.getPixelForValue(day + 0.5);
      ctx.fillStyle = "hsl(0 0% 0% / 0.03)";
      ctx.fillRect(
        Math.max(x1, left),
        top,
        Math.min(x2, right) - Math.max(x1, left),
        bottom - top,
      );
    }

    // Horizontal bands for alternating 3-hour blocks
    for (let hour = 0; hour < 24; hour += 3) {
      if ((hour / 3) % 2 === 0) continue;
      const y1 = scales.y.getPixelForValue(hour - 0.5);
      const y2 = scales.y.getPixelForValue(hour + 2.5);
      const yTop = Math.min(y1, y2);
      const yBot = Math.max(y1, y2);
      ctx.fillStyle = "hsl(0 0% 0% / 0.02)";
      ctx.fillRect(
        left,
        Math.max(yTop, top),
        right - left,
        Math.min(yBot, bottom) - Math.max(yTop, top),
      );
    }

    ctx.restore();
  },
};

/**
 * Plugin that draws horizontal marker lines for key time-of-day boundaries
 * (morning start, business hours, evening) with subtle labels.
 */
const timeMarkersPlugin: Plugin<"bubble"> = {
  id: "timeMarkers",
  afterDatasetsDraw(chart: Chart<"bubble">) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales.x || !scales.y) return;

    const { left, right, top, bottom } = chartArea;

    ctx.save();

    // Horizontal time markers
    const timeMarkers = [
      { hour: 6, label: "6am" },
      { hour: 9, label: "9am" },
      { hour: 12, label: "Noon" },
      { hour: 17, label: "5pm" },
      { hour: 21, label: "9pm" },
    ];

    for (const marker of timeMarkers) {
      const y = scales.y.getPixelForValue(marker.hour);
      if (y < top || y > bottom) continue;

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "hsl(0 0% 60% / 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();

      // Label at the left edge
      ctx.setLineDash([]);
      ctx.fillStyle = "hsl(0 0% 50%)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(marker.label, left + 4, y - 2);
    }

    // Vertical day markers
    for (let day = 0; day < 7; day++) {
      const x = scales.x.getPixelForValue(day);
      if (x < left || x > right) continue;

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "hsl(0 0% 60% / 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();

      // Label at the top edge
      ctx.setLineDash([]);
      ctx.fillStyle = "hsl(0 0% 50%)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(DAY_LABELS[day], x, top - 2);
    }

    ctx.restore();
  },
};

export function BubbleChart({
  datasets,
  height = 400,
  maxRadius = 20,
}: BubbleChartProps) {
  const allValues = datasets.flatMap((ds) => ds.data.map((d) => d.value));
  const maxValue = Math.max(...allValues, 1);

  const chartData = {
    datasets: datasets.map((ds) => ({
      label: ds.label,
      data: ds.data.map((d) => ({
        x: d.day_of_week,
        y: d.hour_of_day,
        r: scaleRadius(d.value, maxValue, maxRadius),
        _tooltipItems: d.tooltipItems,
      })),
      backgroundColor: ds.color + "80",
      borderColor: ds.color,
      borderWidth: 1,
    })),
  };

  const options: ChartOptions<"bubble"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: datasets.length > 1,
        position: "bottom",
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
          title: (items: TooltipItem<"bubble">[]) => {
            if (!items.length) return "";
            const raw = items[0].raw as { x: number; y: number };
            return `${DAY_LABELS[raw.x]} at ${HOUR_LABELS[raw.y]}`;
          },
          label: (item: TooltipItem<"bubble">) => {
            const raw = item.raw as { _tooltipItems: { label: string; detail: string }[] };
            const lines: string[] = [`${item.dataset.label}`];
            for (const ti of raw._tooltipItems ?? []) {
              lines.push(`  ${ti.label}: ${ti.detail}`);
            }
            return lines;
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        min: -0.5,
        max: 6.5,
        ticks: {
          stepSize: 1,
          font: { size: 12, weight: "bold" as const },
          color: "hsl(0 0% 30%)",
          callback: (value) => DAY_LABELS[value as number] ?? "",
        },
        grid: { display: true, color: "hsl(0 0% 85% / 0.5)" },
        border: { color: "hsl(0 0% 80%)" },
        title: { display: true, text: "Day of Week", font: { size: 12, weight: "bold" as const }, color: "hsl(0 0% 30%)" },
      },
      y: {
        type: "linear",
        min: -0.5,
        max: 23.5,
        reverse: true,
        ticks: {
          stepSize: 3,
          font: { size: 11, weight: "bold" as const },
          color: "hsl(0 0% 30%)",
          callback: (value) => HOUR_LABELS[value as number] ?? "",
        },
        grid: {
          display: true,
          color: (ctx) => {
            const hour = ctx.tick.value;
            // Stronger lines every 3 hours, subtle lines otherwise
            return hour % 3 === 0 ? "hsl(0 0% 80% / 0.5)" : "hsl(0 0% 90% / 0.15)";
          },
        },
        border: { color: "hsl(0 0% 80%)" },
        title: { display: true, text: "Time of Day", font: { size: 12, weight: "bold" as const }, color: "hsl(0 0% 30%)" },
      },
    },
  };

  const hasData = datasets.some((ds) => ds.data.length > 0);
  if (!hasData) {
    return (
      <div style={{ width: "100%", height }} className="flex items-center justify-center text-sm text-muted-foreground">
        No engagement timing data available
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <Bubble data={chartData} options={options} plugins={[alternatingBandsPlugin, timeMarkersPlugin]} />
    </div>
  );
}
