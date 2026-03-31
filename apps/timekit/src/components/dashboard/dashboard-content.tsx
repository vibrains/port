'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';

import { getSyncStatus, type TimeLogsSummary } from '@/lib/api-client';
import { useCompanyFilter } from '@/lib/hooks/use-company-filter';

import { ManualSyncButton } from '@/components/sync/manual-sync-button';
import { Pagination } from '@/components/ui/pagination';
import { DashboardSummary } from '@/components/dashboard/dashboard-summary';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorBoundary } from '@/components/error-boundary';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  useTimeLogFilters,
  type InitialFilters,
  type ViewMode,
} from '@/components/dashboard/hooks/use-time-log-filters';

const DateRangePicker = dynamic(
  () =>
    import('@/components/date-picker/date-range-picker').then((mod) => ({
      default: mod.DateRangePicker,
    })),
  {
    loading: () => <div className="bg-muted h-10 w-full animate-pulse rounded-lg" />,
    ssr: false,
  }
);

const TimeLogTable = dynamic(
  () =>
    import('@/components/time-logs/time-log-table').then((mod) => ({ default: mod.TimeLogTable })),
  {
    loading: () => (
      <div className="border-border bg-card rounded-2xl border p-6">
        <div className="space-y-3">
          <div className="bg-muted h-14 w-full animate-pulse rounded-lg" />
          <div className="bg-muted h-14 w-full animate-pulse rounded-lg" />
          <div className="bg-muted h-14 w-full animate-pulse rounded-lg" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

const ExportCenter = dynamic(
  () => import('@/components/export/export-center').then((mod) => ({ default: mod.ExportCenter })),
  {
    loading: () => (
      <div className="border-border bg-card rounded-2xl border p-6">
        <div className="space-y-4">
          <div className="bg-muted h-8 w-48 animate-pulse rounded-lg" />
          <div className="bg-muted h-32 w-full animate-pulse rounded-lg" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

const ExportViewButton = dynamic(
  () =>
    import('@/components/export/export-view-button').then((mod) => ({
      default: mod.ExportViewButton,
    })),
  {
    loading: () => <div className="bg-muted h-9 w-24 animate-pulse rounded-lg" />,
    ssr: false,
  }
);

interface DashboardContentProps {
  initialFilters: InitialFilters;
}

export function DashboardContent({ initialFilters }: DashboardContentProps) {
  const filters = useTimeLogFilters(initialFilters);

  const { data: syncStatus } = useQuery({
    queryKey: ['syncStatus'],
    queryFn: getSyncStatus,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60,
  });

  return (
    <div className="space-y-6">
      <SyncStatusBanner syncStatus={syncStatus} />

      <ErrorBoundary>
        <ExportCenter companies={filters.filterCompanies} />
      </ErrorBoundary>

      <ErrorBoundary>
        <DashboardFilters filters={filters} DateRangePicker={DateRangePicker} />
      </ErrorBoundary>

      <ErrorBoundary>
        <DashboardSummary
          summary={filters.timeLogsData?.summary}
          total={filters.timeLogsData?.pagination?.totalCount}
          isLoading={filters.isLoadingLogs}
        />
      </ErrorBoundary>

      <ErrorBoundary>
        <TimeLogViewer
          filters={filters}
          TimeLogTable={TimeLogTable}
          ExportViewButton={ExportViewButton}
        />
      </ErrorBoundary>
    </div>
  );
}

interface SyncStatusBannerProps {
  syncStatus?: {
    health?: {
      teamworkConnected: boolean;
      databaseConnected: boolean;
      lastSyncDate: string | null;
    };
  };
}

function SyncStatusBanner({ syncStatus }: SyncStatusBannerProps) {
  if (!syncStatus?.health) return null;

  const isHealthy = syncStatus.health.teamworkConnected && syncStatus.health.databaseConnected;

  return (
    <div className="bg-muted/50 rounded-xl border px-6 py-4">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <div
            className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}
          />
          <span className="font-medium">{isHealthy ? 'System Healthy' : 'System Degraded'}</span>
        </div>
        {syncStatus.health.lastSyncDate && (
          <span className="text-muted-foreground">
            Last sync:{' '}
            {new Date(syncStatus.health.lastSyncDate).toLocaleString('en-US', {
              timeZone: 'America/Los_Angeles',
              dateStyle: 'short',
              timeStyle: 'short',
            })}{' '}
            PT
          </span>
        )}
      </div>
    </div>
  );
}

interface DashboardFiltersProps {
  filters: ReturnType<typeof useTimeLogFilters>;
  DateRangePicker: React.ComponentType<{
    dateRange: ReturnType<typeof useTimeLogFilters>['dateRange'];
    onDateRangeChange: ReturnType<typeof useTimeLogFilters>['handleDateRangeChange'];
  }>;
}

function DashboardFilters({ filters, DateRangePicker }: DashboardFiltersProps) {
  const { showAllCompanies } = useCompanyFilter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
        <CardDescription>
          Refine your time log view with date range and filter options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-3 block">Date Range</Label>
          <div className="max-w-md">
            <DateRangePicker
              dateRange={filters.dateRange}
              onDateRangeChange={filters.handleDateRangeChange}
            />
            {filters.dateError && (
              <p className="text-destructive mt-2 text-sm" role="alert">
                {filters.dateError}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label className="mb-3 block">Filter By</Label>
          <div className={`grid gap-4 sm:grid-cols-2 ${showAllCompanies ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
            {showAllCompanies && (
              <FilterSelect
                id="companyFilter"
                label="Company"
                value={filters.selectedCompanyId}
                onChange={filters.setSelectedCompanyId}
                options={filters.filterCompanies}
                placeholder="All Companies"
              />
            )}
            <FilterSelect
              id="userFilter"
              label="User"
              value={filters.selectedUserId}
              onChange={filters.setSelectedUserId}
              options={filters.filterUsers}
              placeholder="All Users"
            />
            <FilterSelect
              id="projectFilter"
              label="Project"
              value={filters.selectedProjectId}
              onChange={filters.setSelectedProjectId}
              options={filters.filterProjects}
              placeholder="All Projects"
            />
            <div className="space-y-2">
              <Label
                htmlFor="approvalStatusFilter"
                className="text-xs font-semibold tracking-wide uppercase"
              >
                Approval Status
              </Label>
              <Select
                value={filters.selectedApprovalStatus}
                onValueChange={filters.setSelectedApprovalStatus}
              >
                <SelectTrigger id="approvalStatusFilter">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="inreview">In Review</SelectItem>
                  <SelectItem value="needschanges">Needs Changes</SelectItem>
                  <SelectItem value="null">Not in Workflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="billableStatusFilter"
                className="text-xs font-semibold tracking-wide uppercase"
              >
                Billable Status
              </Label>
              <Select
                value={filters.selectedBillableStatus}
                onValueChange={filters.setSelectedBillableStatus}
              >
                <SelectTrigger id="billableStatusFilter">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="billable">Billable</SelectItem>
                  <SelectItem value="non-billable">Non-Billable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  placeholder: string;
}

function FilterSelect({ id, label, value, onChange, options, placeholder }: FilterSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-semibold tracking-wide uppercase">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface TimeLogViewerProps {
  filters: ReturnType<typeof useTimeLogFilters>;
  TimeLogTable: React.ComponentType<{
    timeLogs: NonNullable<ReturnType<typeof useTimeLogFilters>['timeLogsData']>['data'];
    groupBy?: ViewMode;
  }>;
  ExportViewButton: React.ComponentType<{
    dateRange?: ReturnType<typeof useTimeLogFilters>['dateRange'];
    filters?: {
      userId?: string;
      projectId?: string;
      companyId?: string;
    };
    summary?: TimeLogsSummary;
    totalLogs?: number;
  }>;
}

function TimeLogViewer({ filters, TimeLogTable, ExportViewButton }: TimeLogViewerProps) {
  return (
    <Tabs value={filters.viewMode} onValueChange={(v) => filters.setViewMode(v as ViewMode)}>
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="day">By Day</TabsTrigger>
          <TabsTrigger value="user">By User</TabsTrigger>
          <TabsTrigger value="project">By Project</TabsTrigger>
          <TabsTrigger value="none">All Logs</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4">
          {filters.timeLogsData?.pagination?.totalCount !== undefined && (
            <p className="text-sm font-semibold">
              {filters.timeLogsData.pagination.totalCount.toLocaleString()}{' '}
              {filters.timeLogsData.pagination.totalCount === 1 ? 'log' : 'logs'}
            </p>
          )}
          <ExportViewButton
            dateRange={filters.dateRange}
            filters={{
              userId: filters.selectedUserId === 'all' ? undefined : filters.selectedUserId,
              projectId:
                filters.selectedProjectId === 'all' ? undefined : filters.selectedProjectId,
              companyId:
                filters.selectedCompanyId === 'all' ? undefined : filters.selectedCompanyId,
            }}
            totalLogs={filters.timeLogsData?.pagination?.totalCount}
          />
          <ManualSyncButton />
        </div>
      </div>

      <TabsContent value={filters.viewMode} className="mt-6">
        <ErrorBoundary>
          {filters.isLoadingLogs && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                  <Skeleton className="h-14 w-full rounded-lg" />
                </div>
              </CardContent>
            </Card>
          )}

          {filters.logsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertTitle>Error Loading Data</AlertTitle>
              <AlertDescription>
                {filters.logsError.message || 'Failed to load time logs. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {!filters.isLoadingLogs && !filters.logsError && filters.timeLogsData && (
            <>
              <TimeLogTable timeLogs={filters.timeLogsData.data} groupBy={filters.viewMode} />

              {filters.timeLogsData.pagination?.totalPages &&
                filters.timeLogsData.pagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <Pagination
                      currentPage={filters.page}
                      totalPages={filters.timeLogsData.pagination.totalPages}
                      onPageChange={filters.setPage}
                    />
                  </div>
                )}
            </>
          )}

          {!filters.dateRange?.from && !filters.dateRange?.to && !filters.isLoadingLogs && (
            <Card className="bg-muted/50">
              <CardContent className="p-16 text-center">
                <p className="text-base font-medium">Select a date range above to view time logs</p>
              </CardContent>
            </Card>
          )}
        </ErrorBoundary>
      </TabsContent>
    </Tabs>
  );
}
