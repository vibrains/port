/**
 * KPI Card component for displaying key metrics
 * @module components/dashboard/kpi-card
 */

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/charts/sparkline";

/**
 * Trend configuration for KPI cards
 */
interface Trend {
  value: number;
  direction: "up" | "down" | "neutral";
  label?: string;
}

/**
 * KPI Card props interface
 */
interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: Trend;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  sparklineData?: number[];
}

/**
 * KPI Card component
 * Displays a key performance indicator with optional trend and icon
 */
export function KPICard({
  title,
  value,
  description,
  trend,
  icon: Icon,
  loading = false,
  className,
  sparklineData,
}: KPICardProps) {
  /**
   * Get trend icon based on direction
   */
  const TrendIcon = () => {
    switch (trend?.direction) {
      case "up":
        return <TrendingUp className="mr-1 h-3 w-3" />;
      case "down":
        return <TrendingDown className="mr-1 h-3 w-3" />;
      default:
        return <Minus className="mr-1 h-3 w-3" />;
    }
  };

  /**
   * Get trend color classes based on direction
   */
  const trendColorClass = () => {
    switch (trend?.direction) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {sparklineData && sparklineData.length > 1 && !loading && (
          <div className="mt-2">
            <Sparkline data={sparklineData} color="hsl(215, 20%, 65%)" height={40} />
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && !loading && (
          <div className={cn("flex items-center text-xs mt-2", trendColorClass())}>
            <TrendIcon />
            <span className="font-medium">{Math.abs(trend.value)}%</span>
            {trend.label && (
              <span className="ml-1 text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
