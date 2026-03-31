import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SummaryCardVariant = 'default' | 'success' | 'warning' | 'info';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: SummaryCardVariant;
  isLoading?: boolean;
}

const variantStyles: Record<SummaryCardVariant, { iconColor: string }> = {
  default: {
    iconColor: 'text-muted-foreground',
  },
  success: {
    iconColor: 'text-emerald-500 dark:text-emerald-400',
  },
  warning: {
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  info: {
    iconColor: 'text-sky-500 dark:text-sky-400',
  },
};

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  isLoading = false,
}: SummaryCardProps) {
  const styles = variantStyles[variant];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
              {subtitle && <Skeleton className="h-3 w-16" />}
            </div>
            <Skeleton className="h-12 w-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            {subtitle && <p className="text-muted-foreground text-xs font-light">{subtitle}</p>}
          </div>
          <div
            className={cn(
              'bg-muted/50 flex h-12 w-12 items-center justify-center rounded-lg border',
              styles.iconColor
            )}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
