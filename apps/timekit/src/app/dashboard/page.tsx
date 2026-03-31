import { Suspense } from 'react';
import { MOCK_FILTERS } from '@/lib/mock-data';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { Header } from '@/components/dashboard/header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-muted h-16 animate-pulse rounded-xl" />
      <div className="bg-muted h-24 animate-pulse rounded-2xl" />
      <Card>
        <CardContent className="p-8">
          <div className="space-y-6">
            <Skeleton className="bg-muted h-10 w-64" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="bg-muted h-11 w-full" />
              <Skeleton className="bg-muted h-11 w-full" />
              <Skeleton className="bg-muted h-11 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Skeleton className="bg-muted h-12 w-96" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <Skeleton className="bg-muted h-14 w-full rounded-lg" />
              <Skeleton className="bg-muted h-14 w-full rounded-lg" />
              <Skeleton className="bg-muted h-14 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const filters = MOCK_FILTERS;

  return (
    <div className="px-6 py-6">
      <div className="space-y-6">
        <Header title="Dashboard" description="View and filter time logs synced from Teamwork" />
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent initialFilters={filters} />
        </Suspense>
      </div>
    </div>
  );
}
