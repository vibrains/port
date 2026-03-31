'use client';

import * as React from 'react';
import { Zap, Download, Loader2, CheckCircle2, FileText } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  startOfWeek,
  subWeeks,
  subDays,
} from 'date-fns';
import { triggerExport } from '@/lib/api-client';
import { formatDateISO } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyFilter } from '@/lib/hooks/use-company-filter';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface FilterCompany {
  id: string;
  name: string;
}

interface ExportCenterProps {
  companies?: FilterCompany[];
}

type QuickPreset = 'previous-month' | 'current-month' | 'last-2-weeks' | 'last-30-days';

const quickPresets: { id: QuickPreset; label: string; getRange: () => DateRange }[] = [
  {
    id: 'previous-month',
    label: 'Previous Month',
    getRange: () => {
      const prevMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(prevMonth), to: endOfMonth(prevMonth) };
    },
  },
  {
    id: 'current-month',
    label: 'Current Month',
    getRange: () => {
      const now = new Date();
      return { from: startOfMonth(now), to: now };
    },
  },
  {
    id: 'last-2-weeks',
    label: 'Last 2 Weeks',
    getRange: () => {
      const now = new Date();
      const twoWeeksAgo = subWeeks(now, 2);
      return { from: startOfWeek(twoWeeksAgo, { weekStartsOn: 1 }), to: now };
    },
  },
  {
    id: 'last-30-days',
    label: 'Last 30 Days',
    getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
];

const DEFAULT_COMPANY_ID = '1399573';

// Fetch companies from API if not provided via props
async function fetchCompanies(): Promise<FilterCompany[]> {
  const response = await fetch(`${BASE_PATH}/api/filters`);
  if (!response.ok) {
    throw new Error('Failed to fetch companies');
  }
  const data = await response.json();
  return data.data?.companies || [];
}

export function ExportCenter({ companies: propCompanies }: ExportCenterProps) {
  const { showAllCompanies, defaultCompanyId } = useCompanyFilter();

  // Use provided companies or fetch them if empty
  const { data: fetchedCompanies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['exportCompanies'],
    queryFn: fetchCompanies,
    enabled: !propCompanies || propCompanies.length === 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const companies = React.useMemo(() => {
    return propCompanies && propCompanies.length > 0 ? propCompanies : fetchedCompanies || [];
  }, [propCompanies, fetchedCompanies]);

  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [selectedPreset, setSelectedPreset] = React.useState<QuickPreset>('previous-month');
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>(DEFAULT_COMPANY_ID);
  const [approvedOnly, setApprovedOnly] = React.useState(false);
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);

  // Update selected company when companies load
  React.useEffect(() => {
    if (companies.length > 0 && !companies.find((c) => c.id === selectedCompanyId)) {
      // If current selection is not in the list, select the first one
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  const exportMutation = useMutation({
    mutationFn: triggerExport,
    onSuccess: (data) => {
      if (data.success && data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
        setFileName(data.fileName || 'export.txt');
        setIsPreviewOpen(false);

        toast.success('Allons-y! Export Complete!', {
          description: `Your export is ready for download.`,
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

  const getExportDateRange = (): DateRange | undefined => {
    const preset = quickPresets.find((p) => p.id === selectedPreset);
    return preset?.getRange();
  };

  const getExportLabel = (): string => {
    const preset = quickPresets.find((p) => p.id === selectedPreset);
    const range = preset?.getRange();
    if (range?.from) {
      return format(range.from, 'MMMM yyyy');
    }
    return 'Selected Period';
  };

  const getCompanyName = (): string => {
    const company = companies.find((c) => c.id === selectedCompanyId);
    return company?.name || 'Near&Dear';
  };

  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
  };

  const handleExport = () => {
    const dateRange = getExportDateRange();
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select a date range');
      return;
    }

    // Use defaultCompanyId if showAllCompanies is false
    const effectiveCompanyId = showAllCompanies ? selectedCompanyId : defaultCompanyId;

    exportMutation.mutate({
      startDate: formatDateISO(dateRange.from),
      endDate: formatDateISO(dateRange.to),
      companyId: effectiveCompanyId,
      approvalStatus: approvedOnly ? 'approved' : 'all',
      isQuickRun: true,
    });
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="border-border border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-black">
            <Zap className="h-5 w-5 text-cyan-600" />
            Quick Export
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1.5">
                <Label className="text-foreground text-xs font-semibold">Period</Label>
                <Select
                  value={selectedPreset}
                  onValueChange={(v) => setSelectedPreset(v as QuickPreset)}
                >
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {quickPresets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {isLoadingCompanies ? (
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs font-semibold">Company</Label>
                  <Skeleton className="h-9 w-[180px]" />
                </div>
              ) : companies.length > 0 && showAllCompanies ? (
                <div className="space-y-1.5">
                  <Label className="text-foreground text-xs font-semibold">Company</Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger className="h-9 w-[180px]">
                      <SelectValue />
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
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {downloadUrl && !exportMutation.isPending && (
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  className="border-green-300 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100"
                  aria-label={`Download quick export file: ${fileName}`}
                >
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  {fileName}
                </Button>
              )}

              <Button
                onClick={handleOpenPreview}
                disabled={exportMutation.isPending}
                className="min-w-[140px]"
                aria-label={
                  exportMutation.isPending
                    ? 'Generating export'
                    : downloadUrl
                      ? 'Generate quick export again'
                      : 'Preview and generate quick export'
                }
                aria-busy={exportMutation.isPending}
              >
                {exportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : downloadUrl ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Export Again
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Preview & Export
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Export Preview
            </DialogTitle>
            <DialogDescription>Review what will be included in your export</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Date Range</p>
                <p className="mt-1 font-medium">{getExportLabel()}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground text-xs">Company</p>
                <p className="mt-1 font-medium">{getCompanyName()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <Label htmlFor="approved-only" className="cursor-pointer">
                  Export approved logs only
                </Label>
              </div>
              <Switch id="approved-only" checked={approvedOnly} onCheckedChange={setApprovedOnly} />
            </div>
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
