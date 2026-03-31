/**
 * Chart-related type definitions for the Sente Dashboard
 * @module types/charts
 */

/**
 * Base data point for time series charts
 */
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}

/**
 * Multi-series time series data point
 */
export interface MultiSeriesDataPoint {
  date: string;
  [key: string]: string | number;
}

/**
 * Data point for bar charts
 */
export interface BarChartDataPoint {
  name: string;
  value: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Data point for pie/donut charts
 */
export interface PieChartDataPoint {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

/**
 * Data point for scatter plots
 */
export interface ScatterDataPoint {
  x: number;
  y: number;
  name?: string;
  size?: number;
  color?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Chart series configuration
 */
export interface ChartSeries {
  key: string;
  name: string;
  color: string;
  type?: "line" | "bar" | "area";
  yAxisId?: string;
  hidden?: boolean;
}

/**
 * Chart axis configuration
 */
export interface ChartAxis {
  id?: string;
  label?: string;
  type?: "number" | "category" | "time";
  domain?: [number | "auto", number | "auto"];
  tickFormatter?: (value: number) => string;
  orientation?: "left" | "right" | "top" | "bottom";
}

/**
 * Chart tooltip data
 */
export interface ChartTooltipData {
  label: string;
  value: number | string;
  color?: string;
  formattedValue?: string;
}

/**
 * Chart legend item
 */
export interface ChartLegendItem {
  name: string;
  color: string;
  value?: number;
  hidden?: boolean;
}

/**
 * Common chart props
 */
export interface BaseChartProps {
  data: unknown[];
  height?: number;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  className?: string;
}

/**
 * Line chart specific props
 */
export interface LineChartProps extends BaseChartProps {
  data: MultiSeriesDataPoint[];
  series: ChartSeries[];
  xAxis?: ChartAxis;
  yAxis?: ChartAxis;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  curveType?: "linear" | "monotone" | "step";
}

/**
 * Bar chart specific props
 */
export interface BarChartProps extends BaseChartProps {
  data: BarChartDataPoint[];
  layout?: "horizontal" | "vertical";
  showValues?: boolean;
  showLegend?: boolean;
  barSize?: number;
  stackId?: string;
}

/**
 * Area chart specific props
 */
export interface AreaChartProps extends BaseChartProps {
  data: MultiSeriesDataPoint[];
  series: ChartSeries[];
  stacked?: boolean;
  gradient?: boolean;
  showGrid?: boolean;
}

/**
 * Pie chart specific props
 */
export interface PieChartProps extends BaseChartProps {
  data: PieChartDataPoint[];
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  showPercentages?: boolean;
}

/**
 * KPI card data
 */
export interface KPIData {
  label: string;
  value: number;
  formattedValue: string;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  trendIsPositive?: boolean;
  icon?: string;
  color?: string;
}

/**
 * KPI comparison data
 */
export interface KPIComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

/**
 * Chart data loading state
 */
export interface ChartDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Email performance chart data
 */
export interface EmailPerformanceData {
  date: string;
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  revenue?: number;
}

/**
 * Social engagement chart data
 */
export interface SocialEngagementData {
  date: string;
  impressions: number;
  reach: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
}

/**
 * Web traffic chart data
 */
export interface WebTrafficData {
  date: string;
  sessions: number;
  users: number;
  newUsers: number;
  pageviews: number;
  bounceRate?: number;
}

/**
 * Top performers data (for tables/lists)
 */
export interface TopPerformerData {
  id: string;
  name: string;
  value: number;
  formattedValue: string;
  secondaryValue?: number;
  secondaryFormattedValue?: string;
  change?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Chart color scheme
 */
export type ChartColorScheme =
  | "default"
  | "categorical"
  | "sequential"
  | "diverging";

/**
 * Chart animation configuration
 */
export interface ChartAnimation {
  enabled: boolean;
  duration?: number;
  easing?: "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear";
}

/**
 * Responsive breakpoint configuration for charts
 */
export interface ChartResponsiveConfig {
  breakpoint: number;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  aspectRatio?: number;
}
