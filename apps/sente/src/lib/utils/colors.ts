/**
 * Chart color palette and color utilities for the Sente Dashboard
 * @module lib/utils/colors
 */

/**
 * Primary chart color palette
 * A carefully selected palette that works well for data visualization
 * and maintains accessibility standards
 */
export const CHART_COLORS = [
  "#2563eb", // Blue 600
  "#16a34a", // Green 600
  "#dc2626", // Red 600
  "#ca8a04", // Yellow 600
  "#9333ea", // Purple 600
  "#0891b2", // Cyan 600
  "#ea580c", // Orange 600
  "#db2777", // Pink 600
  "#4f46e5", // Indigo 600
  "#65a30d", // Lime 600
] as const;

/**
 * Extended color palette for when more colors are needed
 */
export const CHART_COLORS_EXTENDED = [
  ...CHART_COLORS,
  "#0d9488", // Teal 600
  "#7c3aed", // Violet 600
  "#be185d", // Rose 600
  "#0284c7", // Sky 600
  "#059669", // Emerald 600
  "#d97706", // Amber 600
  "#7c2d12", // Orange 900
  "#1e40af", // Blue 800
  "#166534", // Green 800
  "#991b1b", // Red 800
] as const;

/**
 * Named colors for specific metrics
 * Use these for consistent color coding across the dashboard
 */
export const COLORS = {
  // Revenue and financial metrics
  revenue: "#16a34a", // Green 600
  revenueLight: "#86efac", // Green 300
  revenueDark: "#166534", // Green 800

  // Engagement metrics
  engagement: "#2563eb", // Blue 600
  engagementLight: "#93c5fd", // Blue 300
  engagementDark: "#1e40af", // Blue 800

  // Email metrics
  opens: "#0891b2", // Cyan 600
  clicks: "#2563eb", // Blue 600
  unsubscribes: "#dc2626", // Red 600
  bounces: "#ca8a04", // Yellow 600
  spam: "#7c2d12", // Orange 900

  // Social metrics
  impressions: "#9333ea", // Purple 600
  reach: "#4f46e5", // Indigo 600
  likes: "#db2777", // Pink 600
  comments: "#0891b2", // Cyan 600
  shares: "#16a34a", // Green 600
  saves: "#ca8a04", // Yellow 600

  // Web analytics
  sessions: "#2563eb", // Blue 600
  users: "#9333ea", // Purple 600
  pageviews: "#0891b2", // Cyan 600
  newUsers: "#16a34a", // Green 600
  returningUsers: "#4f46e5", // Indigo 600

  // Trend indicators
  positive: "#16a34a", // Green 600
  negative: "#dc2626", // Red 600
  neutral: "#6b7280", // Gray 500

  // Platform colors
  klaviyo: "#000000", // Klaviyo brand
  pardot: "#00a1e0", // Salesforce/Pardot brand
  ga4: "#f9ab00", // Google Analytics brand
  facebook: "#1877f2", // Facebook brand
  instagram: "#e4405f", // Instagram brand
  linkedin: "#0a66c2", // LinkedIn brand
  twitter: "#1da1f2", // Twitter/X brand
  tiktok: "#000000", // TikTok brand
} as const;

/**
 * Social network colors
 */
export const NETWORK_COLORS: Record<string, string> = {
  facebook: "#1877f2",
  instagram: "#e4405f",
  linkedin: "#0a66c2",
  twitter: "#1da1f2",
  tiktok: "#000000",
  youtube: "#ff0000",
  pinterest: "#e60023",
};

/**
 * Gets a color from the chart palette by index
 * Wraps around if index exceeds palette length
 *
 * @param index - The index of the color to get
 * @param extended - Whether to use the extended palette
 * @returns Hex color string
 *
 * @example
 * getChartColor(0) // "#2563eb"
 * getChartColor(15, true) // "#d97706"
 */
export function getChartColor(index: number, extended: boolean = false): string {
  const palette = extended ? CHART_COLORS_EXTENDED : CHART_COLORS;
  return palette[index % palette.length];
}

/**
 * Gets multiple colors from the chart palette
 *
 * @param count - Number of colors to get
 * @param extended - Whether to use the extended palette
 * @returns Array of hex color strings
 *
 * @example
 * getChartColors(3) // ["#2563eb", "#16a34a", "#dc2626"]
 */
export function getChartColors(
  count: number,
  extended: boolean = false
): string[] {
  return Array.from({ length: count }, (_, i) => getChartColor(i, extended));
}

/**
 * Gets the color for a specific social network
 *
 * @param network - The network name (case-insensitive)
 * @returns Hex color string or default gray
 *
 * @example
 * getNetworkColor('facebook') // "#1877f2"
 * getNetworkColor('Instagram') // "#e4405f"
 */
export function getNetworkColor(network: string): string {
  const normalized = network.toLowerCase().trim();
  return NETWORK_COLORS[normalized] || "#6b7280";
}

/**
 * Gets the trend color based on value direction
 *
 * @param value - The value to check
 * @param invertColors - Whether to invert colors (e.g., for metrics where down is good)
 * @returns Hex color string
 *
 * @example
 * getTrendColor(0.15) // "#16a34a" (positive/green)
 * getTrendColor(-0.08) // "#dc2626" (negative/red)
 * getTrendColor(-0.08, true) // "#16a34a" (inverted - down is good)
 */
export function getTrendColor(
  value: number,
  invertColors: boolean = false
): string {
  if (value === 0) {
    return COLORS.neutral;
  }

  const isPositive = value > 0;
  const showGreen = invertColors ? !isPositive : isPositive;

  return showGreen ? COLORS.positive : COLORS.negative;
}

/**
 * Generates a gradient array for charts
 *
 * @param baseColor - The base hex color
 * @param steps - Number of gradient steps
 * @returns Array of hex colors from light to dark
 */
export function generateGradient(baseColor: string, steps: number): string[] {
  // Simple implementation - in production, use a proper color manipulation library
  const colors: string[] = [];

  for (let i = 0; i < steps; i++) {
    const opacity = 0.3 + (0.7 * i) / (steps - 1);
    colors.push(`${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`);
  }

  return colors;
}

/**
 * Type for metric color keys
 */
export type MetricColorKey = keyof typeof COLORS;

/**
 * Gets a metric color by key with type safety
 *
 * @param key - The metric color key
 * @returns Hex color string
 */
export function getMetricColor(key: MetricColorKey): string {
  return COLORS[key];
}
