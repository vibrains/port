import { cn } from '@/lib/utils';

interface BillableBadgeProps {
  billable: boolean;
  className?: string;
}

const billableConfig = {
  true: {
    label: 'Billable',
    shortLabel: '7',
    className:
      'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  },
  false: {
    label: 'Non-Billable',
    shortLabel: '5',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export function BillableBadge({ billable, className }: BillableBadgeProps) {
  const config = billableConfig[String(billable) as 'true' | 'false'];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function BillableBadgeCompact({ billable, className }: BillableBadgeProps) {
  const config = billableConfig[String(billable) as 'true' | 'false'];

  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
        billable
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
          : 'bg-muted text-muted-foreground',
        className
      )}
      title={config.label}
      aria-label={config.label}
    >
      {config.shortLabel}
    </span>
  );
}

export function JobComponentBadge({ billable, className }: BillableBadgeProps) {
  const config = billableConfig[String(billable) as 'true' | 'false'];

  return (
    <span
      className={cn(
        'inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-1 text-xs font-medium',
        billable
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
          : 'bg-muted text-muted-foreground',
        className
      )}
      title={`Job Component ${config.shortLabel} - ${config.label}`}
      aria-label={`Job Component ${config.shortLabel} - ${config.label}`}
    >
      {config.shortLabel}
    </span>
  );
}
