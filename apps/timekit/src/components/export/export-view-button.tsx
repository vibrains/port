'use client';

import * as React from 'react';
import { Download, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { triggerExport, type TimeLogsSummary } from '@/lib/api-client';
import { formatDateISO, formatMinutes } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ExportViewButtonProps {
  dateRange?: DateRange;
  filters?: {
    userId?: string;
    projectId?: string;
    companyId?: string;
  };
  summary?: TimeLogsSummary;
  totalLogs?: number;
}

export function ExportViewButton({
  dateRange,
  filters,
  summary,
  totalLogs = 0,
}: ExportViewButtonProps) {
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [approvedOnly, setApprovedOnly] = React.useState(false);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  const exportMutation = useMutation({
    mutationFn: triggerExport,
    onSuccess: (data) => {
      if (data.success && data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
        setFileName(data.fileName || 'export.txt');
        setIsPreviewOpen(false);

        toast.success('Export Complete!', {
          description: 'Your export is ready for download.',
          action: {
            label: 'Download Now',
            onClick: () => window.open(data.downloadUrl, '_blank'),
          },
          duration: 15000,
        });
      } else {
        toast.error('Export failed', {
          description: data.error || 'Unable to generate export. Please try again.',
        });
      }
    },
    onError: (error) => {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    },
  });

  const getExportLabel = (): string => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    return 'Current View';
  };

  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
  };

  const handleExport = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select a date range');
      return;
    }

    exportMutation.mutate({
      startDate: formatDateISO(dateRange.from),
      endDate: formatDateISO(dateRange.to),
      companyId: filters?.companyId,
      userId: filters?.userId,
      projectId: filters?.projectId,
      approvalStatus: approvedOnly ? 'approved' : 'all',
      isQuickRun: false,
    });
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  const showNonApprovedWarning = !approvedOnly && summary && summary.approvedCount < totalLogs;
  const isDisabled = !dateRange?.from || !dateRange?.to;

  return (
    <>
      <div className="flex items-center gap-2">
        {downloadUrl && !exportMutation.isPending && (
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="border-green-300 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100"
            aria-label={`Download export file: ${fileName}`}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            {fileName}
          </Button>
        )}

        <Button
          onClick={handleOpenPreview}
          disabled={exportMutation.isPending || isDisabled}
          className="min-w-[130px]"
          aria-label={
            exportMutation.isPending
              ? 'Export in progress'
              : downloadUrl
                ? 'Export current view again'
                : 'Export current view to file'
          }
          aria-busy={exportMutation.isPending}
        >
          {exportMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : downloadUrl ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              Export Again
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export this View
            </>
          )}
        </Button>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Current View
            </DialogTitle>
            <DialogDescription>
              Export time logs matching your current filters: {getExportLabel()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {summary && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-green-50 p-3 text-center">
                  <p className="text-3xl font-bold text-green-700">{summary.approvedCount}</p>
                  <p className="text-xs text-green-600">Approved</p>
                </div>
                <div className="rounded-lg border bg-amber-50 p-3 text-center">
                  <p className="text-3xl font-bold text-amber-700">{summary.inReviewCount}</p>
                  <p className="text-xs text-amber-600">In Review</p>
                </div>
                <div className="bg-muted rounded-lg border p-3 text-center">
                  <p className="text-muted-foreground text-3xl font-bold">
                    {formatMinutes(summary.totalMinutes)}
                  </p>
                  <p className="text-muted-foreground text-xs">Total Hours</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <Label htmlFor="approved-only-view" className="cursor-pointer">
                  Export approved logs only
                </Label>
              </div>
              <Switch
                id="approved-only-view"
                checked={approvedOnly}
                onCheckedChange={setApprovedOnly}
              />
            </div>

            {showNonApprovedWarning && (
              <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Warning: You are about to export {totalLogs - (summary?.approvedCount || 0)}{' '}
                  unapproved time logs. This may include entries that haven&apos;t been reviewed.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exportMutation.isPending}>
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
