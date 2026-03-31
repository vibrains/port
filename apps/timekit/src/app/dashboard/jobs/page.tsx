/**
 * Jobs Reference Page
 * Read-only view of projects and their job codes
 * For PM and finance teams reference
 */

'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search } from 'lucide-react';

import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SortableHeader, type SortDirection } from '@/components/ui/sortable-header';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface Project {
  id: string;
  name: string;
  jobCode: string | null;
  teamworkProjectId: number;
}

async function fetchProjects() {
  const response = await fetch(`${BASE_PATH}/api/projects`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch projects');
  }
  const data = await response.json();
  return (data.data || []) as Project[];
}

type SortField = 'name' | 'jobCode' | 'teamworkProjectId';

export default function JobsPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortField, setSortField] = React.useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const parentRef = React.useRef<HTMLDivElement>(null);

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredProjects = React.useMemo(() => {
    let result = projects;

    // Filter by search term
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (project) =>
          project.name.toLowerCase().includes(lowerSearch) ||
          project.jobCode?.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort
    if (sortField && sortDirection) {
      result = [...result].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Handle null values (put them at the end)
        if (aVal === null && bVal === null) return 0;
        if (aVal === null) return 1;
        if (bVal === null) return -1;

        // String comparison (case-insensitive)
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
        }
        if (typeof bVal === 'string') {
          bVal = bVal.toLowerCase();
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [projects, searchTerm, sortField, sortDirection]);

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual is safe, compiler skips it
  const rowVirtualizer = useVirtualizer({
    count: filteredProjects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Header
          title="Job Code Reference"
          description="View project names and their associated job codes"
        />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Header
          title="Job Code Reference"
          description="View project names and their associated job codes"
        />
        <Alert variant="destructive">
          <AlertDescription>Failed to load projects. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Header
        title="Job Code Reference"
        description="View project names and their associated job codes. This is a read-only reference for PM and finance teams."
      />
      <Card>
        <CardHeader className="hidden">
          <CardTitle>Job Code Reference</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search by project name or job code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <div className="bg-muted grid grid-cols-[1fr_150px_120px] border-b">
              <SortableHeader
                label="Project Name"
                field="name"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Job Code"
                field="jobCode"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Teamwork ID"
                field="teamworkProjectId"
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            </div>
            {filteredProjects.length > 0 ? (
              <div
                ref={parentRef}
                className="overflow-auto"
                style={{ height: Math.min(filteredProjects.length * 48, 600) }}
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const project = filteredProjects[virtualRow.index];
                    return (
                      <div
                        key={project.id}
                        className="hover:bg-muted border-border grid grid-cols-[1fr_150px_120px] border-b transition-colors"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <div className="flex items-center px-4 py-3 text-sm font-medium">
                          {project.name}
                        </div>
                        <div className="flex items-center px-4 py-3 font-mono text-sm">
                          {project.jobCode || (
                            <span className="text-muted-foreground italic">No job code</span>
                          )}
                        </div>
                        <div className="text-muted-foreground flex items-center px-4 py-3 text-sm">
                          {project.teamworkProjectId}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground p-8 text-center">
                {searchTerm
                  ? 'No projects found matching your search.'
                  : 'No projects synced yet. Click "Sync Now" to import projects from Teamwork.'}
              </div>
            )}
          </div>

          {/* Summary */}
          {filteredProjects.length > 0 && (
            <div className="text-muted-foreground mt-4 flex items-center justify-between text-sm">
              <div>
                Showing {filteredProjects.length} of {projects.length} project
                {projects.length !== 1 ? 's' : ''}
              </div>
              <div>{filteredProjects.filter((p) => p.jobCode).length} with job codes</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
