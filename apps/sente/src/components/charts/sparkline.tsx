/**
 * Sparkline Component
 * A tiny inline Chart.js line chart for use in KPI cards
 * @module components/charts/sparkline
 */

"use client";

import { useRef, useEffect } from "react";
import "@/lib/chartjs-setup";
import { Chart as ChartJS } from "chart.js";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}

export function Sparkline({
  data,
  color = "hsl(221, 83%, 53%)",
  height = 60,
  width = 120,
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, `${color}33`);
    gradient.addColorStop(1, `${color}00`);

    chartRef.current = new ChartJS(ctx, {
      type: "line",
      data: {
        labels: data.map((_, i) => String(i)),
        datasets: [
          {
            data,
            borderColor: color,
            backgroundColor: gradient,
            borderWidth: 1.5,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        animation: false,
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, color, height]);

  if (data.length === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      aria-hidden="true"
    />
  );
}
