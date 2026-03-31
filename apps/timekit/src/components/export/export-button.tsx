/**
 * Export Button Component
 *
 * Button to trigger time log export with date range
 * Improved UX with toast notifications and persistent download state
 */

'use client';

import * as React from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import { triggerExport } from '@/lib/api-client';
import { formatDateISO } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExportButtonProps {
  dateRange: DateRange | undefined;
  userId?: string;
  projectId?: string;
  companyId?: string;
  approvalStatus?: string;
  className?: string;
}

export function ExportButton({
  dateRange,
  userId,
  projectId,
  companyId,
  approvalStatus,
  className,
}: ExportButtonProps) {
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);

  const exportMutation = useMutation({
    mutationFn: triggerExport,
    onSuccess: (data) => {
      if (data.success && data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);

        // Show success toast with download action
        toast.success('Export ready!', {
          description: `${data.fileName || 'Export file'} has been generated successfully.`,
          action: {
            label: 'Download',
            onClick: () => {
              window.open(data.downloadUrl, '_blank');
            },
          },
          duration: 10000, // 10 seconds
        });
      } else {
        toast.error('Export failed', {
          description: 'Unable to generate export file. Please try again.',
          action: {
            label: 'Retry',
            onClick: () => handleExport(),
          },
        });
      }
    },
    onError: (error) => {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        action: {
          label: 'Retry',
          onClick: () => handleExport(),
        },
      });
    },
  });

  const handleExport = () => {
    if (!dateRange?.from || !dateRange?.to) {
      return;
    }

    exportMutation.mutate({
      startDate: formatDateISO(dateRange.from),
      endDate: formatDateISO(dateRange.to),
      userId: userId && userId !== 'all' ? userId : undefined,
      projectId: projectId && projectId !== 'all' ? projectId : undefined,
      companyId: companyId && companyId !== 'all' ? companyId : undefined,
      approvalStatus: approvalStatus && approvalStatus !== 'all' ? approvalStatus : undefined,
    });
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // Open in new tab - Content-Disposition header will force download
      window.open(downloadUrl, '_blank');
    }
  };

  const isDisabled = !dateRange?.from || !dateRange?.to || exportMutation.isPending;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button onClick={handleExport} disabled={isDisabled} className="min-w-[140px]">
        {exportMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" />
            Export to File
          </>
        )}
      </Button>

      {downloadUrl && !exportMutation.isPending && (
        <Button onClick={handleDownload} variant="outline" size="default" className="min-w-[120px]">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      )}
    </div>
  );
}
