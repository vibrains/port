/**
 * Chart Container Component
 * A wrapper component for all charts providing consistent styling, loading and error states
 * @module components/charts/chart-container
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BarChart3 } from "lucide-react";

/**
 * Props for the ChartContainer component
 */
interface ChartContainerProps {
  /** The title displayed in the card header */
  title: string;
  /** Optional description displayed below the title */
  description?: string;
  /** The chart content to render */
  children: React.ReactNode;
  /** Whether the chart is in a loading state */
  loading?: boolean;
  /** Error message to display if chart fails to load */
  error?: string;
  /** Optional action element (e.g., dropdown, button) to display in the header */
  action?: React.ReactNode;
  /** Additional CSS classes to apply to the card */
  className?: string;
  /** Whether the chart data is empty */
  isEmpty?: boolean;
}

/**
 * Skeleton loader for chart content
 */
function ChartSkeleton() {
  return (
    <div className="flex flex-col space-y-4">
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
}

/**
 * Error display for chart content
 */
function ChartError({ message }: { message: string }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center space-y-2 text-muted-foreground">
      <AlertCircle className="h-8 w-8 text-destructive" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center space-y-2 text-muted-foreground">
      <BarChart3 className="h-8 w-8 opacity-40" />
      <p className="text-sm">No data available</p>
    </div>
  );
}

/**
 * ChartContainer wraps chart components with consistent card styling,
 * loading states, and error handling.
 *
 * @example
 * ```tsx
 * <ChartContainer
 *   title="Revenue Over Time"
 *   description="Monthly revenue for the current year"
 *   loading={isLoading}
 *   error={error?.message}
 * >
 *   <LineChart data={revenueData} lines={[{ key: "revenue", name: "Revenue", color: "#16a34a" }]} />
 * </ChartContainer>
 * ```
 */
export function ChartContainer({
  title,
  description,
  children,
  loading,
  error,
  action,
  className,
  isEmpty,
}: ChartContainerProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action && <div className="flex items-center">{action}</div>}
      </CardHeader>
      <CardContent>
        {loading ? (
          <ChartSkeleton />
        ) : error ? (
          <ChartError message={error} />
        ) : isEmpty ? (
          <ChartEmpty />
        ) : (
          <div role="img" aria-label={`${title}${description ? `: ${description}` : ""}`}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
