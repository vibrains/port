/**
 * Admin Dashboard Page
 * Sync management, monitoring, and documentation
 */

import { format } from 'date-fns';
import { getMockAdminStats } from '@/lib/mock-data';
import { Header } from '@/components/dashboard/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ManualSyncButton } from '@/components/sync/manual-sync-button';
import { FullSyncButton } from '@/components/sync/full-sync-button';
import { RefreshCacheButton } from '@/components/cache/refresh-cache-button';
import { CompanyFilterSettings } from '@/components/admin/company-filter-settings';
import {
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database,
  Users,
  FolderOpen,
  Zap,
  FileText,
  Settings,
  Download,
  Timer,
  Calendar,
  ClipboardCheck,
  DollarSign,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// Helper function to format relative time
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

async function getAdminStats() {
  return getMockAdminStats();
}

export default async function AdminPage() {
  const stats = await getAdminStats();

  return (
    <div className="flex flex-col gap-6 p-6">
      <Header title="Admin Dashboard" description="Monitor and manage system sync">
        <div className="flex gap-3">
          <RefreshCacheButton />
          <ManualSyncButton />
          <FullSyncButton />
        </div>
      </Header>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Logs</CardTitle>
            <Database className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTimeLogs.toLocaleString()}</div>
            <p className="text-muted-foreground text-xs">Total synced entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
            <p className="text-muted-foreground text-xs">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProjects}</div>
            <p className="text-muted-foreground text-xs">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.lastSync ? formatRelativeTime(stats.lastSync) : 'Never'}
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.lastSync
                ? format(new Date(stats.lastSync), 'MMM d, yyyy h:mm a')
                : 'No syncs yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Logs</CardTitle>
            <ClipboardCheck className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.approvalStats.approved.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">Ready for export</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable Logs</CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.billableStats.billable.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">Billable time entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Approval Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-amber-500" />
            Approval Status Breakdown
          </CardTitle>
          <CardDescription>
            Current state of all time logs in the system (updated on sync)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Approved</p>
                  <p className="mt-1 text-3xl font-bold text-green-700">
                    {stats.approvalStats.approved.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-green-700">Included in exports & Quick Run</p>
            </div>

            <div className="rounded-lg border bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-900">In Review</p>
                  <p className="mt-1 text-3xl font-bold text-amber-700">
                    {stats.approvalStats.inReview.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-700">Awaiting approval in Teamwork</p>
            </div>

            <div className="rounded-lg border bg-orange-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-900">Needs Changes</p>
                  <p className="mt-1 text-3xl font-bold text-orange-700">
                    {stats.approvalStats.needsChanges.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-orange-700">Requires revision in Teamwork</p>
            </div>

            <div className="bg-muted rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground text-sm font-medium">Not in Workflow</p>
                  <p className="text-muted-foreground mt-1 text-3xl font-bold">
                    {stats.approvalStats.notInWorkflow.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mt-2 text-xs">No approval status set</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Filter Settings */}
      <CompanyFilterSettings />

      {/* Billable Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            Billable Status Breakdown
          </CardTitle>
          <CardDescription>
            Job Component mapping for Advantage export (updated on sync)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Billable (Component 7)</p>
                  <p className="mt-1 text-3xl font-bold text-blue-700">
                    {stats.billableStats.billable.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-blue-700">Exported with Job Component = 7</p>
            </div>

            <div className="rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Non-Billable (Component 5)</p>
                  <p className="mt-1 text-3xl font-bold text-slate-700">
                    {stats.billableStats.nonBillable.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-700">Exported with Job Component = 5</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Activity</CardTitle>
          <CardDescription>Last 10 sync operations</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentSyncs.length > 0 ? (
            <div className="space-y-2">
              {stats.recentSyncs.map((syncDate, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Sync completed</p>
                      <p className="text-muted-foreground text-sm">
                        {format(new Date(syncDate), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {formatRelativeTime(syncDate)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground py-8 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8" />
              <p>No sync history available</p>
              <p className="text-sm">
                Click {'"'}Sync Now{'"'} to start
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Status Information for Finance & PM */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-amber-500" />
            Approval Status Workflow
          </CardTitle>
          <CardDescription>For Finance & Project Management Teams</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-blue-50 p-4">
            <h4 className="mb-2 flex items-center gap-2 font-medium text-blue-900">
              <CheckCircle2 className="h-4 w-4" />
              How Approval Status Works
            </h4>
            <p className="text-sm text-blue-800">
              Time Machine now tracks the approval status of every time log synced from Teamwork.
              This ensures that only properly approved time entries are used for payroll exports,
              preventing premature or unapproved time from being processed.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <h4 className="mb-1 text-sm font-medium">Approved</h4>
              <p className="text-muted-foreground text-xs">
                Time logs that have been reviewed and approved in Teamwork. These entries are
                included in all export files and Quick Run exports for payroll processing.
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <h4 className="mb-1 text-sm font-medium">In Review</h4>
              <p className="text-muted-foreground text-xs">
                Time logs awaiting approval from project managers in Teamwork. These are synced to
                the system but excluded from payroll exports until approved.
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <h4 className="mb-1 text-sm font-medium">Needs Changes</h4>
              <p className="text-muted-foreground text-xs">
                Time logs that were reviewed but require corrections. Team members must update these
                entries in Teamwork before they can be approved and exported.
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <h4 className="mb-1 text-sm font-medium">Not in Workflow</h4>
              <p className="text-muted-foreground text-xs">
                Time logs that are not part of any approval workflow in Teamwork. These may be from
                older projects or projects without approval requirements.
              </p>
            </div>
          </div>

          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-3">
            <h4 className="mb-1 flex items-center gap-2 text-sm font-medium text-amber-900">
              <AlertCircle className="h-4 w-4" />
              Dashboard Filtering Available
            </h4>
            <p className="text-xs text-amber-800">
              Finance and PM teams can now filter the dashboard by approval status to view:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-amber-800">
              <li>• All time logs (default view)</li>
              <li>• Only approved logs ready for export</li>
              <li>• Logs awaiting approval to track review progress</li>
              <li>• Logs needing changes to identify action items</li>
            </ul>
            <p className="mt-2 text-xs text-amber-800">
              Use the{' '}
              <strong>
                {'"'}Approval Status{'"'}
              </strong>{' '}
              filter dropdown in the main dashboard to access these views.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* How It Works Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* What This App Does */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              What Time Machine Does
            </CardTitle>
            <CardDescription>Bridging Teamwork and Advantage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Time Machine syncs time logs from Teamwork and tracks their approval status in
              real-time. Only logs marked as{' '}
              <strong>
                {'"'}Approved{'"'}
              </strong>{' '}
              in Teamwork are included in exports for payroll processing.
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-sm">
                  Syncs time logs and approval status from Teamwork API
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-sm">
                  Tracks approval workflow (approved, in review, needs changes)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-sm">Associates job codes from project custom fields</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-sm">
                  Generates fixed-width text files for Advantage import
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-sm">
                  Stores exports in secure cloud storage with download links
                </span>
              </div>
            </div>
            <div className="mt-4 rounded-lg border-l-4 border-green-500 bg-green-50 p-3">
              <p className="text-sm font-medium text-green-900">
                Payroll Safety: Only approved logs are exported
              </p>
              <p className="mt-1 text-xs text-green-700">
                Quick Run and manual exports automatically filter for approved status, ensuring only
                finalized time entries reach Advantage payroll.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sync Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-500" />
              Sync Schedule
            </CardTitle>
            <CardDescription>Automatic and manual options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 rounded-lg border p-3">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4" />
                Automatic Sync
              </h4>
              <p className="text-muted-foreground mt-1 text-sm">
                GitHub Actions runs every hour during business hours (9 AM – 6 PM EST,
                Monday–Friday). Incremental sync fetches only logs updated since the last sync.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg border p-3">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <RefreshCw className="h-4 w-4" />
                Manual Sync
              </h4>
              <p className="text-muted-foreground mt-1 text-sm">
                Click the {'"'}Sync Now{'"'} button in the header to trigger a full sync
                immediately. This fetches all approved time logs regardless of last sync time.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Export Format */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-700" />
              Export Format
            </CardTitle>
            <CardDescription>Advantage-compatible fixed-width text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Exports generate a <code className="bg-muted rounded px-1 py-0.5 text-xs">.txt</code>{' '}
              file with fixed-width columns formatted for Advantage&apos;s import requirements.
            </p>
            <div className="rounded-lg border bg-black/5 p-3">
              <h4 className="mb-2 text-sm font-medium">Fields Included:</h4>
              <div className="text-muted-foreground grid grid-cols-2 gap-1 font-mono text-xs">
                <span>• Date (MM/DD/YYYY)</span>
                <span>• Employee Code (6 chars)</span>
                <span>• Department Code (4 chars)</span>
                <span>• Hours (decimal)</span>
                <span>• Job Code (from project)</span>
                <span>• Job Component (2 chars)</span>
                <span>• Function Code (10 chars)</span>
                <span>• Comment (300 chars)</span>
              </div>
            </div>
            <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-3">
              <h4 className="mb-1 flex items-center gap-2 text-sm font-medium text-blue-900">
                <DollarSign className="h-4 w-4" />
                Job Component Mapping
              </h4>
              <p className="text-xs text-blue-800">
                The Job Component field is automatically set based on each time log&apos;s billable
                status from Teamwork:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-blue-800">
                <li>
                  • <strong>Component 7</strong> = Billable time
                </li>
                <li>
                  • <strong>Component 5</strong> = Non-billable time
                </li>
              </ul>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Download className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <span className="text-muted-foreground">
                Download links expire after 7 days. Visit the Exports page to regenerate links.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* User Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-500" />
              User Code Configuration
            </CardTitle>
            <CardDescription>Required for export generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Each user needs three codes configured on the Users page for exports to work
              correctly:
            </p>
            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <h4 className="text-sm font-medium">Employee Code</h4>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  6-character code identifying the employee in Advantage (e.g., {'"'}cintra{'"'},
                  {'"'}jsmith{'"'})
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <h4 className="text-sm font-medium">Department Code</h4>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  4-character department identifier (e.g., {'"'}pm{'"'}, {'"'}dev{'"'},{'"'}dsn{'"'}
                  )
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <h4 className="text-sm font-medium">Function Code</h4>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  10-character function/cost center code for payroll routing (e.g.,
                  {'"'}07cs0326{'"'})
                </p>
              </div>
            </div>
            <p className="text-muted-foreground text-xs italic">
              Users without codes configured will be skipped during export generation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
