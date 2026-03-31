import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function JobsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-10">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="mb-6">
        <Skeleton className="h-11 w-full max-w-md" />
      </div>

      <Card className="border-border rounded-2xl">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
