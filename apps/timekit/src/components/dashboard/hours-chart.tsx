/**
 * Hours Chart Component
 * Frontend Lead Agent - Phase 4
 *
 * Recharts pie chart for hours breakdown visualization
 */

'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

import { cn } from '@/lib/utils';

interface ChartDataItem {
  name: string;
  value: number;
  fill?: string;
}

interface HoursChartProps {
  data: ChartDataItem[];
  total: number;
  className?: string;
}

const DEFAULT_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const tooltipFormatter = (value: unknown) => {
  if (typeof value !== 'number') return ['', ''];
  return [`${value}h`, ''];
};

const legendFormatter = (value: unknown, entry: unknown) => {
  const itemValue = (entry as { payload?: { value?: number } })?.payload?.value || 0;
  return `${value}: ${itemValue}h`;
};

const labelRenderer = (props: { name?: string; value?: number }) => {
  const { name, value } = props;
  return `${name}: ${value}`;
};

export function HoursChart({ data, total, className }: HoursChartProps) {
  // Filter out zero values and apply default colors
  const chartData = useMemo(() => {
    return data
      .filter((item) => item.value > 0)
      .map((item, index) => ({
        ...item,
        fill: item.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      }));
  }, [data]);

  // Empty state
  if (chartData.length === 0 || total === 0) {
    return (
      <div
        className={cn(
          'bg-muted/30 flex h-[300px] items-center justify-center rounded-lg border',
          className
        )}
      >
        <p className="text-muted-foreground text-sm">No hours data available</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={labelRenderer}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
          />
          <Legend verticalAlign="bottom" height={36} formatter={legendFormatter} />
        </PieChart>
      </ResponsiveContainer>

      {/* Total Hours Display */}
      <div className="mt-4 text-center">
        <p className="text-muted-foreground text-sm">Total Hours</p>
        <p className="text-3xl font-bold">{total}h</p>
      </div>
    </div>
  );
}
