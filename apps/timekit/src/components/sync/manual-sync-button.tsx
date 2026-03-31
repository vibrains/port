/**
 * Manual Sync Button Component
 *
 * Button to trigger manual synchronization with Teamwork API
 */

'use client';

import * as React from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { triggerSync } from '@/lib/api-client';
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

export function ManualSyncButton() {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const syncMutation = useMutation({
    mutationFn: triggerSync,
    onSuccess: (data) => {
      if (data.success) {
        setStatus('success');
        queryClient.invalidateQueries({ queryKey: ['timeLogs'] });
        queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
        toast.success('Sync completed', {
          description: `Successfully synced ${data.syncedLogs ?? 0} time logs from Teamwork.`,
        });
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        toast.error('Sync failed', {
          description: data.error || 'Unable to sync time logs. Please try again.',
          action: {
            label: 'Retry',
            onClick: () => handleSync(),
          },
        });
        setTimeout(() => setStatus('idle'), 3000);
      }
    },
    onError: (error) => {
      setStatus('error');
      toast.error('Sync failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        action: {
          label: 'Retry',
          onClick: () => handleSync(),
        },
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
      <XCircle className="mr-2 h-4 w-4 text-red-500" />
      Failed
    </>
  ) : (
    <>
      <RefreshCw className="mr-2 h-4 w-4" />
      Sync Now
    </>
  );

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button
          disabled={syncMutation.isPending}
          aria-label={
            syncMutation.isPending
              ? 'Synchronization in progress'
              : status === 'success'
                ? 'Sync completed successfully'
                : status === 'error'
                  ? 'Sync failed, click to retry'
                  : 'Sync time logs from Teamwork'
          }
          aria-busy={syncMutation.isPending}
          variant={
            status === 'success' ? 'outline' : status === 'error' ? 'destructive' : 'default'
          }
          className={cn('min-w-[140px]')}
        >
          {buttonContent}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sync Time Logs?</AlertDialogTitle>
          <AlertDialogDescription>
            This will fetch the latest approved time logs from Teamwork. The sync may take a few
            minutes depending on the amount of data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSync}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
