/**
 * Time Log Table Component
 * Frontend Lead Agent - Phase 4
 *
 * Displays time logs in a responsive data grid with sorting functionality
 */

'use client';

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format, parseISO } from 'date-fns';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { formatMinutes, cn } from '@/lib/utils';
import { replaceEmojiShortcodes } from '@/lib/emoji-map';
import type { TimeLogWithRelations } from '@/lib/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApprovalBadgeCompact } from '@/components/time-logs/approval-badge';
import { JobComponentBadge } from '@/components/time-logs/billable-badge';

function formatTaskName(description: string | null): string {
  if (!description) return '-';

  const formatted = replaceEmojiShortcodes(description.replace(/^Event:\s*/i, ''));

  return formatted.trim() || '-';
}

/**
 * Parse date to Date object for display
 * Extracts YYYY-MM-DD and creates local midnight to avoid timezone shifts
 */
function parseDateSafe(dateInput: Date | string): Date {
  let dateStr: string;

  if (dateInput instanceof Date) {
    // Extract date portion from Date object using UTC to get stored date
    dateStr = dateInput.toISOString().split('T')[0];
  } else if (typeof dateInput === 'string') {
    // Extract YYYY-MM-DD from string (handles both "2025-12-15" and "2025-12-15T00:00:00.000Z")
    dateStr = dateInput.split('T')[0];
  } else {
    return new Date();
  }

  // Parse as local date (not UTC) to display correctly
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format job code for display
 * Shows "None" if no job code assigned
 */
function formatJobCode(jobNumber: string | null): string {
  return jobNumber || 'None';
}

// Sort configuration types
type SortField = 'date' | 'user' | 'job' | 'project' | 'task' | 'time' | 'comp' | 'status';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

interface TimeLogTableProps {
  timeLogs: TimeLogWithRelations[];
  groupBy?: 'none' | 'day' | 'user' | 'project';
}

type TimeLogWithParsedDate = TimeLogWithRelations & { parsedDate: Date };

/**
 * Sortable column header component
 */
interface SortableHeaderProps {
  field: SortField;
  label: string;
  align?: 'left' | 'right' | 'center';
  currentSort: SortConfig;
  onSort: (field: SortField) => void;
  className?: string;
  srOnly?: boolean;
  ariaLabel?: string;
}

function SortableHeader({
  field,
  label,
  align = 'left',
  currentSort,
  onSort,
  className,
  srOnly = false,
  ariaLabel,
}: SortableHeaderProps) {
  const isActive = currentSort.field === field;

  const alignClasses = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  };

  const sortIcon = isActive ? (
    currentSort.direction === 'asc' ? (
      <ArrowUp className="text-primary ml-1.5 h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="text-primary ml-1.5 h-3.5 w-3.5" />
    )
  ) : (
    <ArrowUpDown className="text-muted-foreground/50 ml-1.5 h-3.5 w-3.5" />
  );

  return (
    <th
      scope="col"
      className={cn(
        'text-muted-foreground p-2 text-xs font-semibold tracking-wide uppercase',
        alignClasses[align],
        className
      )}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          'group hover:text-foreground focus-visible:ring-ring inline-flex items-center transition-colors focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-offset-2',
          isActive && 'text-foreground'
        )}
        aria-label={ariaLabel || `Sort by ${label}`}
        aria-pressed={isActive}
      >
        <span className={srOnly ? 'sr-only' : undefined}>{label}</span>
        {srOnly && <span aria-hidden="true">{label}</span>}
        {sortIcon}
      </button>
    </th>
  );
}

/**
 * Sort time logs based on current sort configuration
 */
function sortTimeLogs(
  logs: TimeLogWithParsedDate[],
  sortConfig: SortConfig
): TimeLogWithParsedDate[] {
  const { field, direction } = sortConfig;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...logs].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'date':
        comparison = a.parsedDate.getTime() - b.parsedDate.getTime();
        break;
      case 'user':
        comparison = a.user.name.localeCompare(b.user.name);
        break;
      case 'job':
        comparison = (a.jobNumber || '').localeCompare(b.jobNumber || '');
        break;
      case 'project':
        comparison = a.project.name.localeCompare(b.project.name);
        break;
      case 'task':
        comparison = (a.description || '').localeCompare(b.description || '');
        break;
      case 'time':
        comparison = a.minutes - b.minutes;
        break;
      case 'comp':
        comparison = Number(a.billable) - Number(b.billable);
        break;
      case 'status':
        comparison = (a.approvalStatus || '').localeCompare(b.approvalStatus || '');
        break;
      default:
        comparison = 0;
    }

    return comparison * multiplier;
  });
}

export const TimeLogTable = React.memo(function TimeLogTable({
  timeLogs,
  groupBy = 'none',
}: TimeLogTableProps) {
  if (!timeLogs || timeLogs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            No time logs found for the selected date range.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (groupBy === 'none') {
    return <TimeLogFlatTable timeLogs={timeLogs} />;
  }

  if (groupBy === 'day') {
    return <TimeLogGroupedByDay timeLogs={timeLogs} />;
  }

  if (groupBy === 'user') {
    return <TimeLogGroupedByUser timeLogs={timeLogs} />;
  }

  if (groupBy === 'project') {
    return <TimeLogGroupedByProject timeLogs={timeLogs} />;
  }

  return null;
});

/**
 * Flat table view (no grouping) with sorting
 */
const TimeLogFlatTable = React.memo(function TimeLogFlatTable({
  timeLogs,
}: {
  timeLogs: TimeLogWithRelations[];
}) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [showTopShadow, setShowTopShadow] = React.useState(false);
  const [showBottomShadow, setShowBottomShadow] = React.useState(false);
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    field: 'date',
    direction: 'desc',
  });

  const handleSort = React.useCallback((field: SortField) => {
    setSortConfig((current) => ({
      field,
      direction: current.field === field && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  }, []);

  const logsWithParsedDates = React.useMemo<TimeLogWithParsedDate[]>(
    () => timeLogs.map((log) => ({ ...log, parsedDate: parseDateSafe(log.date) })),
    [timeLogs]
  );

  const sortedLogs = React.useMemo(
    () => sortTimeLogs(logsWithParsedDates, sortConfig),
    [logsWithParsedDates, sortConfig]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: sortedLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowTopShadow(scrollTop > 10);
    setShowBottomShadow(scrollTop < scrollHeight - clientHeight - 10);
  }, []);

  React.useEffect(() => {
    const el = parentRef.current;
    if (el) {
      setShowBottomShadow(el.scrollHeight > el.clientHeight);
    }
  }, [sortedLogs.length]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="relative">
            {showTopShadow && (
              <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-4 bg-gradient-to-b from-black/50 to-transparent" />
            )}
            {showBottomShadow && (
              <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-4 bg-gradient-to-t from-black/50 to-transparent" />
            )}
            <div ref={parentRef} onScroll={handleScroll} className="max-h-[600px] overflow-auto">
              <table
                className="w-full border-separate border-spacing-0"
                role="table"
                aria-label="Time logs table"
              >
                <caption className="sr-only">
                  Time logs showing date, user, job code, project, task, time, component type, and
                  approval status. Click column headers to sort.
                </caption>
                <colgroup>
                  <col className="w-[110px]" />
                  <col className="w-[160px]" />
                  <col className="w-[80px]" />
                  <col className="w-[180px]" />
                  <col className="min-w-[200px]" />
                  <col className="w-[80px]" />
                  <col className="w-[70px]" />
                  <col className="w-[90px]" />
                </colgroup>
                <thead className="bg-muted/95 supports-[backdrop-filter]:bg-muted/80 sticky top-0 z-10 backdrop-blur">
                  <tr className="border-border border-b">
                    <SortableHeader
                      field="date"
                      label="Date"
                      align="left"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      field="user"
                      label="User"
                      align="left"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      field="job"
                      label="Job"
                      align="left"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      field="project"
                      label="Project"
                      align="left"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      field="task"
                      label="Task"
                      align="left"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      field="time"
                      label="Time"
                      align="right"
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      field="comp"
                      label="Comp"
                      align="center"
                      currentSort={sortConfig}
                      onSort={handleSort}
                      srOnly
                      ariaLabel="Sort by component type"
                    />
                    <SortableHeader
                      field="status"
                      label="Status"
                      align="center"
                      currentSort={sortConfig}
                      onSort={handleSort}
                      ariaLabel="Sort by approval status"
                    />
                  </tr>
                </thead>
                <tbody
                  className="divide-border divide-y"
                  style={{
                    height: rowVirtualizer.getTotalSize(),
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const log = sortedLogs[virtualRow.index];
                    return (
                      <tr
                        key={log.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        className="group hover:bg-muted/50 transition-colors"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <td className="text-foreground p-2 text-sm font-light whitespace-nowrap">
                          <span className="tabular-nums">
                            {format(log.parsedDate, 'MMM dd, yyyy')}
                          </span>
                        </td>
                        <td className="text-foreground max-w-[160px] truncate p-2 text-sm font-light">
                          <span className="block truncate" title={log.user.name}>
                            {log.user.name}
                          </span>
                        </td>
                        <td
                          className={cn(
                            'p-2 text-sm font-light whitespace-nowrap',
                            log.jobNumber
                              ? 'font-mono text-green-600'
                              : 'text-muted-foreground italic'
                          )}
                        >
                          <span className="tabular-nums">{formatJobCode(log.jobNumber)}</span>
                        </td>
                        <td
                          className="text-foreground max-w-[180px] truncate p-2 text-sm font-light"
                          title={log.project.name}
                        >
                          <span className="block truncate">{log.project.name}</span>
                        </td>
                        <td
                          className="text-muted-foreground max-w-[200px] truncate p-2 text-sm font-light"
                          title={formatTaskName(log.description)}
                        >
                          <span className="block truncate">{formatTaskName(log.description)}</span>
                        </td>
                        <td className="text-foreground p-2 text-right text-sm font-light whitespace-nowrap">
                          <span className="tabular-nums">{formatMinutes(log.minutes)}</span>
                        </td>
                        <td className="p-2 text-center">
                          <JobComponentBadge billable={log.billable} />
                        </td>
                        <td className="p-2 text-center">
                          <ApprovalBadgeCompact status={log.approvalStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

const TimeLogGroupedByDay = React.memo(function TimeLogGroupedByDay({
  timeLogs,
}: {
  timeLogs: TimeLogWithRelations[];
}) {
  const groupedLogs = React.useMemo(() => {
    const groups = new Map<string, { logs: TimeLogWithRelations[]; parsedDate: Date }>();

    timeLogs.forEach((log) => {
      const parsedDate = parseDateSafe(log.date);
      const dateKey = format(parsedDate, 'yyyy-MM-dd');
      if (!groups.has(dateKey)) {
        groups.set(dateKey, { logs: [], parsedDate });
      }
      groups.get(dateKey)!.logs.push(log);
    });

    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [timeLogs]);

  return (
    <div className="space-y-4">
      {groupedLogs.map(([date, { logs, parsedDate }]) => {
        const totalMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);

        return (
          <Card key={date} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-green-600">
                  {format(parsedDate, 'EEEE, MMMM dd, yyyy')}
                </h3>
                <CardDescription className="text-base font-medium">
                  Total:{' '}
                  <span className="text-foreground tabular-nums">
                    {formatMinutes(totalMinutes)}
                  </span>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <colgroup>
                    <col className="w-[140px]" />
                    <col className="w-[80px]" />
                    <col className="w-[200px]" />
                    <col className="min-w-[200px]" />
                    <col className="w-[80px]" />
                    <col className="w-[70px]" />
                    <col className="w-[90px]" />
                  </colgroup>
                  <thead className="bg-muted/50">
                    <tr className="border-border border-b">
                      <th className="text-muted-foreground p-2 text-left text-xs font-semibold tracking-wide uppercase">
                        User
                      </th>
                      <th className="text-muted-foreground p-2 text-left text-xs font-semibold tracking-wide uppercase">
                        Job
                      </th>
                      <th className="text-muted-foreground p-2 text-left text-xs font-semibold tracking-wide uppercase">
                        Project
                      </th>
                      <th className="text-muted-foreground p-2 text-left text-xs font-semibold tracking-wide uppercase">
                        Task
                      </th>
                      <th className="text-muted-foreground p-2 text-right text-xs font-semibold tracking-wide uppercase">
                        Time
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-semibold tracking-wide uppercase">
                        <span className="sr-only">Component Type</span>
                        <span aria-hidden="true">Comp</span>
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-semibold tracking-wide uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                        <td className="text-foreground max-w-[140px] truncate p-2 text-sm font-light">
                          <span className="block truncate" title={log.user.name}>
                            {log.user.name}
                          </span>
                        </td>
                        <td
                          className={cn(
                            'p-2 text-sm font-light whitespace-nowrap',
                            log.jobNumber
                              ? 'font-mono text-green-600'
                              : 'text-muted-foreground italic'
                          )}
                        >
                          <span className="tabular-nums">{formatJobCode(log.jobNumber)}</span>
                        </td>
                        <td
                          className="text-foreground max-w-[200px] truncate p-2 text-sm font-light"
                          title={log.project.name}
                        >
                          <span className="block truncate">{log.project.name}</span>
                        </td>
                        <td
                          className="text-muted-foreground max-w-[200px] truncate p-2 text-sm font-light"
                          title={formatTaskName(log.description)}
                        >
                          <span className="block truncate">{formatTaskName(log.description)}</span>
                        </td>
                        <td className="text-foreground p-2 text-right text-sm font-light whitespace-nowrap">
                          <span className="tabular-nums">{formatMinutes(log.minutes)}</span>
                        </td>
                        <td className="p-2 text-center">
                          <JobComponentBadge billable={log.billable} />
                        </td>
                        <td className="p-2 text-center">
                          <ApprovalBadgeCompact status={log.approvalStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

/**
 * Grouped by user view
 */
const TimeLogGroupedByUser = React.memo(function TimeLogGroupedByUser({
  timeLogs,
}: {
  timeLogs: TimeLogWithRelations[];
}) {
  const groupedLogs = React.useMemo(() => {
    const groups = new Map<string, TimeLogWithParsedDate[]>();

    timeLogs.forEach((log) => {
      const userKey = log.userId;
      if (!groups.has(userKey)) {
        groups.set(userKey, []);
      }
      groups.get(userKey)!.push({ ...log, parsedDate: parseDateSafe(log.date) });
    });

    return Array.from(groups.entries()).map(([, logs]) => ({
      user: logs[0].user,
      logs: logs.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime()),
    }));
  }, [timeLogs]);

  return (
    <div className="space-y-4">
      {groupedLogs.map(({ user, logs }) => {
        const totalMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);

        return (
          <Card key={user.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-600">{user.name}</h3>
                  <CardDescription className="text-sm">{user.email}</CardDescription>
                </div>
                <CardDescription className="text-base font-medium">
                  Total:{' '}
                  <span className="text-foreground tabular-nums">
                    {formatMinutes(totalMinutes)}
                  </span>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <colgroup>
                    <col className="w-[110px]" />
                    <col className="w-[80px]" />
                    <col className="w-[200px]" />
                    <col className="min-w-[200px]" />
                    <col className="w-[80px]" />
                    <col className="w-[70px]" />
                    <col className="w-[90px]" />
                  </colgroup>
                  <thead className="bg-muted/50">
                    <tr className="border-border border-b">
                      <th className="text-muted-foreground p-2 text-left text-xs font-semibold tracking-wide uppercase">
                        Date
                      </th>
                      <th className="text-muted-foreground p-2 text-left text-xs font-semibold tracking-wide uppercase">
                        Job
                      </th>
                      <th className="text-muted-foreground p-2 text-left text-xs font-semibold tracking-wide uppercase">
                        Project
                      </th>
                      <th className="text-muted-foreground p-2 text-left text-xs font-semibold tracking-wide uppercase">
                        Task
                      </th>
                      <th className="text-muted-foreground p-2 text-right text-xs font-semibold tracking-wide uppercase">
                        Time
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-semibold tracking-wide uppercase">
                        <span className="sr-only">Component Type</span>
                        <span aria-hidden="true">Comp</span>
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-semibold tracking-wide uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                        <td className="text-foreground p-2 text-sm font-light whitespace-nowrap">
                          <span className="tabular-nums">
                            {format(log.parsedDate, 'MMM dd, yyyy')}
                          </span>
                        </td>
                        <td
                          className={cn(
                            'p-2 text-sm font-light whitespace-nowrap',
                            log.jobNumber
                              ? 'font-mono text-green-600'
                              : 'text-muted-foreground italic'
                          )}
                        >
                          <span className="tabular-nums">{formatJobCode(log.jobNumber)}</span>
                        </td>
                        <td
                          className="text-foreground max-w-[200px] truncate p-2 text-sm font-light"
                          title={log.project.name}
                        >
                          <span className="block truncate">{log.project.name}</span>
                        </td>
                        <td
                          className="text-muted-foreground max-w-[200px] truncate p-2 text-sm font-light"
                          title={formatTaskName(log.description)}
                        >
                          <span className="block truncate">{formatTaskName(log.description)}</span>
                        </td>
                        <td className="text-foreground p-2 text-right text-sm font-light whitespace-nowrap">
                          <span className="tabular-nums">{formatMinutes(log.minutes)}</span>
                        </td>
                        <td className="p-2 text-center">
                          <JobComponentBadge billable={log.billable} />
                        </td>
                        <td className="p-2 text-center">
                          <ApprovalBadgeCompact status={log.approvalStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

const TimeLogGroupedByProject = React.memo(function TimeLogGroupedByProject({
  timeLogs,
}: {
  timeLogs: TimeLogWithRelations[];
}) {
  const groupedLogs = React.useMemo(() => {
    const groups = new Map<string, TimeLogWithParsedDate[]>();

    timeLogs.forEach((log) => {
      const projectKey = log.projectId;
      if (!groups.has(projectKey)) {
        groups.set(projectKey, []);
      }
      groups.get(projectKey)!.push({ ...log, parsedDate: parseDateSafe(log.date) });
    });

    return Array.from(groups.entries()).map(([, logs]) => ({
      project: logs[0].project,
      logs: logs.sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime()),
    }));
  }, [timeLogs]);

  return (
    <div className="space-y-4">
      {groupedLogs.map(({ project, logs }) => {
        const totalMinutes = logs.reduce((sum, log) => sum + log.minutes, 0);

        return (
          <Card key={project.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-600">{project.name}</h3>
                  <CardDescription
                    className={cn(
                      'text-sm',
                      logs[0].jobNumber
                        ? 'text-foreground font-mono'
                        : 'text-muted-foreground italic'
                    )}
                  >
                    Job: <span className="tabular-nums">{formatJobCode(logs[0].jobNumber)}</span>
                  </CardDescription>
                </div>
                <CardDescription className="text-base font-medium">
                  Total:{' '}
                  <span className="text-foreground tabular-nums">
                    {formatMinutes(totalMinutes)}
                  </span>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <colgroup>
                    <col className="w-[110px]" />
                    <col className="w-[140px]" />
                    <col className="min-w-[200px]" />
                    <col className="w-[80px]" />
                    <col className="w-[70px]" />
                    <col className="w-[90px]" />
                  </colgroup>
                  <thead className="bg-muted/50">
                    <tr className="border-border border-b">
                      <th className="text-muted-foreground p-2 text-left text-xs font-semibold tracking-wide uppercase">
                        Date
                      </th>
                      <th className="text-muted-foreground p-2 text-left text-xs font-semibold tracking-wide uppercase">
                        User
                      </th>
                      <th className="text-muted-foreground p-2 text-left text-xs font-semibold tracking-wide uppercase">
                        Task
                      </th>
                      <th className="text-muted-foreground p-2 text-right text-xs font-semibold tracking-wide uppercase">
                        Time
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-semibold tracking-wide uppercase">
                        <span className="sr-only">Component Type</span>
                        <span aria-hidden="true">Comp</span>
                      </th>
                      <th className="text-muted-foreground p-2 text-center text-xs font-semibold tracking-wide uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                        <td className="text-foreground p-2 text-sm font-light whitespace-nowrap">
                          <span className="tabular-nums">
                            {format(log.parsedDate, 'MMM dd, yyyy')}
                          </span>
                        </td>
                        <td
                          className="text-foreground max-w-[140px] truncate p-2 text-sm font-light"
                          title={log.user.name}
                        >
                          <span className="block truncate">{log.user.name}</span>
                        </td>
                        <td
                          className="text-muted-foreground max-w-[200px] truncate p-2 text-sm font-light"
                          title={formatTaskName(log.description)}
                        >
                          <span className="block truncate">{formatTaskName(log.description)}</span>
                        </td>
                        <td className="text-foreground p-2 text-right text-sm font-light whitespace-nowrap">
                          <span className="tabular-nums">{formatMinutes(log.minutes)}</span>
                        </td>
                        <td className="p-2 text-center">
                          <JobComponentBadge billable={log.billable} />
                        </td>
                        <td className="p-2 text-center">
                          <ApprovalBadgeCompact status={log.approvalStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});
