/**
 * Quick Run Export Component
 * One-click export for the previous month's time logs
 */

'use client';

import * as React from 'react';
import { Zap, Download, Loader2, CheckCircle2, Calendar, Building2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { triggerExport } from '@/lib/api-client';
import { formatDateISO } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterCompany {
  id: string;
  name: string;
}

interface QuickRunExportProps {
  companies?: FilterCompany[];
}

/**
 * Get the date range for the previous month
 */
function getPreviousMonthRange(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Previous month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  // First day of previous month
  const start = new Date(prevYear, prevMonth, 1);

  // Last day of previous month
  const end = new Date(year, month, 0); // Day 0 of current month = last day of previous month

  // Format label: "November 2025"
  const label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return { start, end, label };
}

const DEFAULT_COMPANY_ID = '1399573';
const DEFAULT_COMPANY_NAME = 'Near&Dear';

export function QuickRunExport({ companies = [] }: QuickRunExportProps) {
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>(DEFAULT_COMPANY_ID);

  const { start, end, label } = getPreviousMonthRange();

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const exportMutation = useMutation({
    mutationFn: triggerExport,
    onSuccess: (data) => {
      if (data.success && data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
        setFileName(data.fileName || 'export.txt');

        toast.success('Quick Run Complete!', {
          description: `${label} export is ready for download.`,
          action: {
            label: 'Download Now',
            onClick: () => {
              window.open(data.downloadUrl, '_blank');
            },
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

  const handleQuickRun = () => {
    setDownloadUrl(null);
    setFileName(null);

    exportMutation.mutate({
      startDate: formatDateISO(start),
      endDate: formatDateISO(end),
      companyId: selectedCompanyId,
      isQuickRun: true,
    });
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Description */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-200">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-black">
                Quick Run
                <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-normal">
                  One-click export
                </span>
              </h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Export all approved time logs from{' '}
                <span className="inline-flex items-center gap-1 font-medium text-black">
                  <Calendar className="h-3.5 w-3.5" />
                  {label}
                </span>
              </p>
              {companies.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <Building2 className="text-muted-foreground h-3.5 w-3.5" />
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {companies.length === 0 && (
                <p className="text-muted-foreground mt-1 text-xs">
                  Company:{' '}
                  <span className="font-medium">
                    {selectedCompany?.name || DEFAULT_COMPANY_NAME}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {downloadUrl && !exportMutation.isPending && (
              <Button
                onClick={handleDownload}
                variant="outline"
                className="border-green-300 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100"
              >
                <Download className="mr-2 h-4 w-4" />
                {fileName}
              </Button>
            )}

            <Button
              onClick={handleQuickRun}
              disabled={exportMutation.isPending}
              className="min-w-[160px]"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : downloadUrl ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Run Again
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Export
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
