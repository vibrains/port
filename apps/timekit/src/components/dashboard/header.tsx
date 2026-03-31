'use client';

import { Suspense } from 'react';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { FilterBar } from './filter-bar';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  showFilters?: boolean;
  departments?: string[];
  dateRange?: { start?: Date; end?: Date };
}

export function DashboardHeader({
  title,
  description,
  children,
  showFilters = false,
  departments = [],
  dateRange,
}: DashboardHeaderProps) {
  return (
    <div className="border-b">
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {description && <p className="text-muted-foreground text-sm">{description}</p>}
          </div>
          {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
      </header>
      {showFilters && (
        <div className="px-4 pb-4">
          <Suspense fallback={<div className="bg-muted/30 h-16 animate-pulse rounded-lg" />}>
            <FilterBar departments={departments} dateRange={dateRange} />
          </Suspense>
        </div>
      )}
    </div>
  );
}

// Keep backward compatibility alias
export const Header = DashboardHeader;
