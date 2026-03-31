/**
 * Export History Page
 * Displays export history with download links
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, FileText, Clock, Calendar, Zap, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Header } from '@/components/dashboard/header';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface Export {
  id: string;
  fileName: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  createdAt: string;
  expiresAt: string;
  s3Key: string;
  downloadUrl: string | null;
  isExpired: boolean;
  isQuickRun: boolean;
}

interface ExportsResponse {
  success: boolean;
  data: Export[];
  error?: string;
}

export default function ExportsPage() {
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Fetch exports
  const { data, isLoading, error, refetch } = useQuery<ExportsResponse>({
    queryKey: ['exports'],
    queryFn: async () => {
      const response = await fetch(`${BASE_PATH}/api/exports`);
      if (!response.ok) {
        throw new Error('Failed to fetch exports');
      }
      return response.json();
    },
  });

  // Regenerate URL for expired export
  const handleRegenerateUrl = async (exportId: string) => {
    try {
      setRegeneratingId(exportId);
      const response = await fetch(`${BASE_PATH}/api/exports/${exportId}/regenerate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate URL');
      }

      const result = await response.json();
      if (result.success && result.downloadUrl) {
        // Store the new URL
        setDownloadUrls((prev) => ({
          ...prev,
          [exportId]: result.downloadUrl,
        }));
        // Refetch to update the expiration status
        refetch();
      }
    } catch (error) {
      console.error('Error regenerating URL:', error);
      alert('Failed to regenerate download URL. The export may have expired permanently.');
    } finally {
      setRegeneratingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Header title="Export History" description="View and download your recent time log exports" />
        {data?.success && data.data.length > 0 && (
          <div className="flex items-center gap-2">
            {confirmClear ? (
              <>
                <span className="text-sm text-muted-foreground">Clear all exports?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={clearing}
                  onClick={async () => {
                    setClearing(true);
                    try {
                      await fetch(`${BASE_PATH}/api/exports`, { method: 'DELETE' });
                      refetch();
                    } finally {
                      setClearing(false);
                      setConfirmClear(false);
                    }
                  }}
                >
                  {clearing ? 'Clearing...' : 'Yes, clear all'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmClear(true)}
                className="text-muted-foreground"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Export History
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>Failed to load export history. Please try again.</AlertDescription>
            </Alert>
          )}

          {/* Empty State */}
          {data?.success && data.data.length === 0 && (
            <div className="bg-muted rounded-lg border border-dashed p-12 text-center">
              <FileText className="text-muted-foreground mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No exports yet</h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Create your first export from the dashboard to see it here.
              </p>
            </div>
          )}

          {/* Exports Table */}
          {data?.success && data.data.length > 0 && (
            <div className="overflow-hidden rounded-xl border">
              <table className="divide-border min-w-full divide-y">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-[0.05em] uppercase">
                      File Name
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-[0.05em] uppercase">
                      Date Range
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-[0.05em] uppercase">
                      Created
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-left text-xs font-semibold tracking-[0.05em] uppercase">
                      Status
                    </th>
                    <th className="text-muted-foreground px-4 py-3 text-right text-xs font-semibold tracking-[0.05em] uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-border divide-y">
                  {data.data.map((exportItem) => {
                    // Use regenerated URL if available, otherwise use the one from API
                    const downloadUrl = downloadUrls[exportItem.id] || exportItem.downloadUrl;

                    return (
                      <tr key={exportItem.id} className="hover:bg-muted">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FileText className="text-muted-foreground h-5 w-5" />
                            <span className="text-sm font-medium">{exportItem.fileName}</span>
                            {exportItem.isQuickRun && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                <Zap className="h-3 w-3" />
                                Quick Run
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-muted-foreground flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(exportItem.dateRangeStart), 'MMM d, yyyy')}
                              {' - '}
                              {format(new Date(exportItem.dateRangeEnd), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </td>
                        <td className="text-muted-foreground px-4 py-3 text-sm whitespace-nowrap">
                          {format(new Date(exportItem.createdAt), 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {exportItem.isExpired ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                              <Clock className="h-3 w-3" />
                              Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {exportItem.isExpired && !downloadUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerateUrl(exportItem.id)}
                              disabled={regeneratingId === exportItem.id}
                            >
                              {regeneratingId === exportItem.id ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  Generating...
                                </>
                              ) : (
                                'Regenerate Link'
                              )}
                            </Button>
                          ) : downloadUrl ? (
                            <Button variant="default" size="sm" asChild>
                              <a href={downloadUrl} download={exportItem.fileName}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </a>
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">URL unavailable</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Clock className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900">About Export Links</h4>
            <p className="mt-1 text-sm text-blue-800">
              Download links expire after 24 hours for security. You can regenerate expired links to
              download the file again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
