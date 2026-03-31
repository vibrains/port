/**
 * Full Sync Button Component
 *
 * Destructive-style button to trigger a full (non-incremental) database sync.
 * Includes a two-step confirmation modal to prevent accidental triggers.
 */

'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { triggerFullSync } from '@/lib/api-client';
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

export function FullSyncButton() {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const syncMutation = useMutation({
    mutationFn: triggerFullSync,
    onSuccess: (data) => {
      if (data.success) {
        setStatus('success');
        queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
        queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
        toast.success('Full sync completed', {
          description: `Successfully synced ${data.syncedLogs ?? 0} time logs from Teamwork.`,
        });
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        toast.error('Full sync failed', {
          description: data.error || 'Unable to complete full sync. Please try again.',
        });
        setTimeout(() => setStatus('idle'), 3000);
      }
    },
    onError: (error) => {
      setStatus('error');
      toast.error('Full sync failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
      setTimeout(() => setStatus('idle'), 3000);
    },
  });

  const handleSync = () => {
    setDialogOpen(false);
    syncMutation.mutate();
  };

  const buttonContent = syncMutation.isPending ? (
    <>
      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
      Syncing...
    </>
  ) : status === 'success' ? (
    <>
      <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
      Synced
    </>
  ) : status === 'error' ? (
    <>
      <XCircle className="mr-2 h-4 w-4" />
      Failed
    </>
  ) : (
    <>
      <AlertTriangle className="mr-2 h-4 w-4" />
      Full DB Sync
    </>
  );

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          disabled={syncMutation.isPending}
          aria-label={
            syncMutation.isPending
              ? 'Full synchronization in progress'
              : status === 'success'
                ? 'Full sync completed successfully'
                : status === 'error'
                  ? 'Full sync failed'
                  : 'Trigger a full database sync from Teamwork'
          }
          aria-busy={syncMutation.isPending}
          variant={
            status === 'success' ? 'outline' : status === 'error' ? 'destructive' : 'destructive'
          }
          className={cn('min-w-[160px]', status === 'idle' && 'bg-amber-600 hover:bg-amber-700')}
        >
          {buttonContent}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Full Database Sync
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <span className="block">
              This will re-sync the entire database from Teamwork, overwriting all existing time log
              data. This operation may take several minutes.
            </span>
            <span className="block rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Only use this if data appears out of sync or after a major configuration change. For
              routine updates, use the regular Sync Now button instead.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSync}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Yes, run full sync
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
