import { cn } from '@/lib/utils';

type ApprovalStatus = 'approved' | 'inreview' | 'needschanges' | null;

interface ApprovalBadgeProps {
  status: string | null;
  className?: string;
}

const statusConfig: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  approved: {
    label: 'Approved',
    className:
      'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  },
  inreview: {
    label: 'In Review',
    className:
      'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  },
  needschanges: {
    label: 'Needs Changes',
    className:
      'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  },
  null: {
    label: 'No Status',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export function ApprovalBadge({ status, className }: ApprovalBadgeProps) {
  const config = statusConfig[status || 'null'] || statusConfig['null'];

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

export function ApprovalBadgeCompact({ status, className }: ApprovalBadgeProps) {
  const config = statusConfig[status || 'null'] || statusConfig['null'];

  return (
    <span
      className={cn(
        'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
        status === 'approved' &&
          'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
        status === 'inreview' &&
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
        status === 'needschanges' && 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
        !status && 'bg-muted text-muted-foreground',
        className
      )}
      title={config.label}
      aria-label={config.label}
    >
      {status === 'approved'
        ? '✓'
        : status === 'inreview'
          ? '◐'
          : status === 'needschanges'
            ? '✗'
            : '—'}
    </span>
  );
}
