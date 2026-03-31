'use client';

import * as React from 'react';
import { Clock, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { formatMinutes } from '@/lib/utils';
import { SummaryCard } from './summary-card';

export interface TimeLogsSummary {
  totalMinutes: number;
  approvedCount: number;
  inReviewCount: number;
  needsChangesCount: number;
  notInWorkflowCount: number;
}

interface DashboardSummaryProps {
  summary?: TimeLogsSummary;
  total?: number;
  isLoading?: boolean;
}

export function DashboardSummary({ summary, total = 0, isLoading = false }: DashboardSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Hours"
        value={formatMinutes(summary?.totalMinutes || 0)}
        subtitle="Selected period"
        icon={Clock}
        variant="info"
        isLoading={isLoading}
      />
      <SummaryCard
        title="Ready for Export"
        value={summary?.approvedCount?.toLocaleString() || '0'}
        subtitle="Approved logs"
        icon={CheckCircle2}
        variant="success"
        isLoading={isLoading}
      />
      <SummaryCard
        title="Pending Review"
        value={summary?.inReviewCount?.toLocaleString() || '0'}
        subtitle="Awaiting approval"
        icon={AlertCircle}
        variant="warning"
        isLoading={isLoading}
      />
      <SummaryCard
        title="Total Logs"
        value={total?.toLocaleString() || '0'}
        subtitle="Matching filters"
        icon={FileText}
        variant="default"
        isLoading={isLoading}
      />
    </div>
  );
}
