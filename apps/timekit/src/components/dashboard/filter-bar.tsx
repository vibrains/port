/**
 * Filter Bar Component
 * Frontend Lead Agent - Phase 4
 *
 * URL-based filtering component for dashboard pages
 */

'use client';

import { useTransition, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterBarProps {
  departments?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export function FilterBar({ departments }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get current filter values from URL
  const dateStart = searchParams.get('dateStart') || '';
  const dateEnd = searchParams.get('dateEnd') || '';
  const department = searchParams.get('department') || '';
  const clientType = searchParams.get('clientType') || 'all';

  // Helper to create query string
  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === '') {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, value);
        }
      });

      return newSearchParams.toString();
    },
    [searchParams]
  );

  // Update URL with new filters
  const updateFilters = useCallback(
    (params: Record<string, string | null>) => {
      startTransition(() => {
        const queryString = createQueryString(params);
        router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
      });
    },
    [createQueryString, pathname, router]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [pathname, router]);

  // Check if any filters are active
  const hasActiveFilters = dateStart || dateEnd || department || clientType !== 'all';

  return (
    <div
      className={cn(
        'bg-muted/30 flex flex-wrap items-center gap-3 rounded-lg border p-3',
        isPending && 'opacity-70'
      )}
    >
      {/* Date Range Filters */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">From:</span>
        <Input
          type="date"
          value={dateStart}
          onChange={(e) => updateFilters({ dateStart: e.target.value })}
          className="h-8 w-auto"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">To:</span>
        <Input
          type="date"
          value={dateEnd}
          onChange={(e) => updateFilters({ dateEnd: e.target.value })}
          className="h-8 w-auto"
        />
      </div>

      {/* Department Filter */}
      {departments && departments.length > 0 && (
        <Select value={department} onValueChange={(value) => updateFilters({ department: value })}>
          <SelectTrigger className="h-8 w-[180px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Client Type Filter */}
      <Select value={clientType} onValueChange={(value) => updateFilters({ clientType: value })}>
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue placeholder="Client Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Clients</SelectItem>
          <SelectItem value="internal">Internal</SelectItem>
          <SelectItem value="external">External</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground hover:text-foreground h-8 gap-1"
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
