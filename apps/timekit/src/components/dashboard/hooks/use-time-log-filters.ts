'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';

import { fetchTimeLogs, type TimeLogsResponse } from '@/lib/api-client';
import { formatDateISO } from '@/lib/utils';
import { useCompanyFilter } from '@/lib/hooks/use-company-filter';

export type ViewMode = 'none' | 'day' | 'user' | 'project';

export interface FilterUser {
  id: string;
  name: string;
}

export interface FilterProject {
  id: string;
  name: string;
}

export interface FilterCompany {
  id: string;
  name: string;
}

export interface InitialFilters {
  users: FilterUser[];
  projects: FilterProject[];
  companies: FilterCompany[];
}

export interface UseTimeLogFiltersReturn {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  dateError: string | null;
  handleDateRangeChange: (range: DateRange | undefined) => void;

  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  page: number;
  setPage: (page: number) => void;
  pageSize: number;

  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
  selectedApprovalStatus: string;
  setSelectedApprovalStatus: (status: string) => void;
  selectedBillableStatus: string;
  setSelectedBillableStatus: (status: string) => void;

  filterUsers: FilterUser[];
  filterProjects: FilterProject[];
  filterCompanies: FilterCompany[];

  timeLogsData: TimeLogsResponse | undefined;
  isLoadingLogs: boolean;
  logsError: Error | null;
}

export function useTimeLogFilters(initialFilters: InitialFilters): UseTimeLogFiltersReturn {
  const queryClient = useQueryClient();
  const { showAllCompanies, defaultCompanyId } = useCompanyFilter();

  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [dateError, setDateError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>('day');
  const [page, setPage] = React.useState(1);
  const pageSize = 50;

  const handleDateRangeChange = React.useCallback((range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      if (range.from > range.to) {
        setDateError('Start date must be before end date');
        return;
      }
      const daysDiff = Math.ceil(
        (range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff > 365) {
        setDateError('Date range cannot exceed 1 year');
        return;
      }
    }
    setDateError(null);
    setDateRange(range);
    setPage(1); // Reset to first page when date range changes
  }, []);

  const [selectedUserId, setSelectedUserIdInternal] = React.useState<string>('all');
  const [selectedProjectId, setSelectedProjectIdInternal] = React.useState<string>('all');
  const [selectedCompanyId, setSelectedCompanyIdInternal] = React.useState<string>('all');
  const [selectedApprovalStatus, setSelectedApprovalStatusInternal] = React.useState<string>('all');
  const [selectedBillableStatus, setSelectedBillableStatusInternal] = React.useState<string>('all');

  // Wrap filter setters to reset page to 1 when filters change
  const setSelectedUserId = React.useCallback((id: string) => {
    setSelectedUserIdInternal(id);
    setPage(1);
  }, []);

  const setSelectedProjectId = React.useCallback((id: string) => {
    setSelectedProjectIdInternal(id);
    setPage(1);
  }, []);

  const setSelectedCompanyId = React.useCallback((id: string) => {
    setSelectedCompanyIdInternal(id);
    setPage(1);
  }, []);

  const setSelectedApprovalStatus = React.useCallback((status: string) => {
    setSelectedApprovalStatusInternal(status);
    setPage(1);
  }, []);

  const setSelectedBillableStatus = React.useCallback((status: string) => {
    setSelectedBillableStatusInternal(status);
    setPage(1);
  }, []);

  const filterUsers = initialFilters.users;
  const filterProjects = initialFilters.projects;
  const filterCompanies = initialFilters.companies;

  const startDateMs = dateRange?.from?.getTime();
  const endDateMs = dateRange?.to?.getTime();

  // Apply company restriction when showAllCompanies is false
  const effectiveCompanyId = showAllCompanies
    ? selectedCompanyId
    : defaultCompanyId;

  const {
    data: timeLogsData,
    isLoading: isLoadingLogs,
    error: logsError,
  } = useQuery({
    queryKey: [
      'timeLogs',
      dateRange,
      selectedUserId,
      selectedProjectId,
      effectiveCompanyId,
      selectedApprovalStatus,
      selectedBillableStatus,
      page,
    ],
    queryFn: () =>
      fetchTimeLogs({
        startDate: dateRange?.from ? formatDateISO(dateRange.from) : undefined,
        endDate: dateRange?.to ? formatDateISO(dateRange.to) : undefined,
        userId: selectedUserId === 'all' ? undefined : selectedUserId,
        projectId: selectedProjectId === 'all' ? undefined : selectedProjectId,
        companyId: effectiveCompanyId === 'all' ? undefined : effectiveCompanyId,
        approvalStatus: selectedApprovalStatus === 'all' ? undefined : selectedApprovalStatus,
        billableStatus: selectedBillableStatus === 'all' ? undefined : selectedBillableStatus,
        page,
        pageSize,
      }),
    enabled: !!(dateRange?.from && dateRange?.to),
    placeholderData: (previousData): TimeLogsResponse | undefined => previousData,
  });

  React.useEffect(() => {
    if (!startDateMs || !endDateMs) return;
    if (!timeLogsData?.pagination?.totalPages || page >= timeLogsData.pagination.totalPages) return;

    queryClient.prefetchQuery({
      queryKey: [
        'timeLogs',
        dateRange,
        selectedUserId,
        selectedProjectId,
        effectiveCompanyId,
        selectedApprovalStatus,
        selectedBillableStatus,
        page + 1,
      ],
      queryFn: () =>
        fetchTimeLogs({
          startDate: dateRange?.from ? formatDateISO(dateRange.from) : undefined,
          endDate: dateRange?.to ? formatDateISO(dateRange.to) : undefined,
          userId: selectedUserId === 'all' ? undefined : selectedUserId,
          projectId: selectedProjectId === 'all' ? undefined : selectedProjectId,
          approvalStatus: selectedApprovalStatus === 'all' ? undefined : selectedApprovalStatus,
          billableStatus: selectedBillableStatus === 'all' ? undefined : selectedBillableStatus,
          companyId: effectiveCompanyId === 'all' ? undefined : effectiveCompanyId,
          page: page + 1,
          pageSize,
        }),
    });
  }, [
    startDateMs,
    endDateMs,
    dateRange,
    selectedUserId,
    selectedProjectId,
    effectiveCompanyId,
    selectedApprovalStatus,
    selectedBillableStatus,
    page,
    pageSize,
    queryClient,
    timeLogsData?.pagination?.totalPages,
  ]);

  return {
    dateRange,
    setDateRange,
    dateError,
    handleDateRangeChange,
    viewMode,
    setViewMode,
    page,
    setPage,
    pageSize,
    selectedUserId,
    setSelectedUserId,
    selectedProjectId,
    setSelectedProjectId,
    selectedCompanyId,
    setSelectedCompanyId,
    selectedApprovalStatus,
    setSelectedApprovalStatus,
    selectedBillableStatus,
    setSelectedBillableStatus,
    filterUsers,
    filterProjects,
    filterCompanies,
    timeLogsData,
    isLoadingLogs,
    logsError: logsError as Error | null,
  };
}
