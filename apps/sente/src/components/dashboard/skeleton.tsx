/**
 * Skeleton loading components for the dashboard
 * @module components/dashboard/skeleton
 */

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Dashboard skeleton for full page loading state
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>

      {/* Table skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * KPI Card skeleton for individual card loading
 */
export function KPICardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="mt-2 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

/**
 * KPI Card Group skeleton
 */
export function KPICardGroupSkeleton({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Chart skeleton
 */
export function ChartSkeleton({
  className,
  height = 300,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

/**
 * Table skeleton
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header row */}
          <div className="flex gap-4 pb-2">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={`header-${i}`} className="h-4 flex-1" />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="h-10 flex-1"
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Card skeleton for generic card loading
 */
export function CardSkeleton({
  className,
  header = true,
  content = true,
  footer = false,
}: {
  className?: string;
  header?: boolean;
  content?: boolean;
  footer?: boolean;
}) {
  return (
    <Card className={className}>
      {header && (
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
      )}
      {content && (
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      )}
      {footer && (
        <div className="p-6 pt-0">
          <Skeleton className="h-10 w-32" />
        </div>
      )}
    </Card>
  );
}

/**
 * Form skeleton for form loading states
 */
export function FormSkeleton({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  );
}
