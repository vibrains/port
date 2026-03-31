'use client';

import * as React from 'react';
import { RefreshCcw, CheckCircle, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

interface RefreshCacheResponse {
  success: boolean;
  message?: string;
  updated?: number;
  stillNull?: number;
  total?: number;
  error?: string;
}

async function triggerCacheRefresh(): Promise<RefreshCacheResponse> {
  const response = await fetch(`${BASE_PATH}/api/cache/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to refresh cache');
  }

  return response.json();
}

export function RefreshCacheButton() {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const refreshMutation = useMutation({
    mutationFn: triggerCacheRefresh,
    onSuccess: (data) => {
      if (data.success) {
        setStatus('success');
        queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });

        if (data.updated && data.updated > 0) {
          toast.success('Cache refreshed', {
            description: `Updated ${data.updated} project(s) with job codes from Teamwork.`,
          });
        } else {
          toast.success('Cache refreshed', {
            description: 'All projects already have job codes.',
          });
        }

        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        toast.error('Refresh failed', {
          description: data.error || 'Unable to refresh cache. Please try again.',
          action: {
            label: 'Retry',
            onClick: () => handleRefresh(),
          },
        });
        setTimeout(() => setStatus('idle'), 3000);
      }
    },
    onError: (error) => {
      setStatus('error');
      toast.error('Refresh failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        action: {
          label: 'Retry',
          onClick: () => handleRefresh(),
        },
      });
      setTimeout(() => setStatus('idle'), 3000);
    },
  });

  const handleRefresh = () => {
    setDialogOpen(false);
    refreshMutation.mutate();
  };

  const buttonContent = refreshMutation.isPending ? (
    <>
      <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
      Refreshing
    </>
  ) : status === 'success' ? (
    <>
      <CheckCircle className="mr-2 h-4 w-4" />
      Refreshed
    </>
  ) : status === 'error' ? (
    <>
      <XCircle className="mr-2 h-4 w-4" />
      Failed
    </>
  ) : (
    <>
      <RefreshCcw className="mr-2 h-4 w-4" />
      Refresh API Cache
    </>
  );

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          disabled={refreshMutation.isPending}
          aria-label={
            refreshMutation.isPending
              ? 'Cache refresh in progress'
              : status === 'success'
                ? 'Cache refreshed successfully'
                : status === 'error'
                  ? 'Cache refresh failed, click to retry'
                  : 'Refresh project job code cache'
          }
          aria-busy={refreshMutation.isPending}
          className="min-w-[160px]"
        >
          {buttonContent}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Refresh API Cache?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear the job code cache and fetch fresh data from Teamwork for all projects
            without job codes. This may take a minute depending on how many projects need updating.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRefresh}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
