/**
 * KPI Card Group component for laying out multiple KPI cards
 * @module components/dashboard/kpi-card-group
 */

import { cn } from "@/lib/utils";

/**
 * KPI Card Group props interface
 */
interface KPICardGroupProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

/**
 * KPI Card Group component
 * Provides a responsive grid layout for KPI cards
 */
export function KPICardGroup({
  children,
  columns = 4,
  className,
}: KPICardGroupProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "grid-cols-1 sm:grid-cols-2",
        columns === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        columns === 5 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
        className
      )}
    >
      {children}
    </div>
  );
}
