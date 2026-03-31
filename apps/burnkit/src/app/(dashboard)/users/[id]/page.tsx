// DashboardHeader removed - sidebar already provided by layout
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@ndos/ui";
import Link from "next/link";
import { DatePicker } from "./date-picker";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Building2,
  ArrowLeft,
  Calendar as CalendarIcon,
} from "lucide-react";
import { prisma } from "@/lib/db";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    dateStart?: string;
    dateEnd?: string;
  }>;
}

export default async function UserDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { dateStart, dateEnd } = await searchParams;

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      department_code: true,
      user_rate: true,
    },
  });

  if (!user) {
    return (
      <main className="flex-1 p-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-600">User not found</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  // Default date range - last 30 days
  // Add T00:00:00 to treat dates as local time (avoid UTC offset issues)
  const endDate = dateEnd ? new Date(dateEnd + "T00:00:00") : new Date();
  const startDate = dateStart
    ? new Date(dateStart + "T00:00:00")
    : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch time logs for this user
  const timeLogs = await prisma.time_logs.findMany({
    where: {
      user_id: id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      id: true,
      date: true,
      minutes: true,
      description: true,
      is_billable: true,
      approval_status: true,
      projects: {
        select: {
          id: true,
          name: true,
          companies: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { date: "desc" },
    take: 1000,
  });

  // Calculate statistics
  const totalHours = timeLogs.reduce((sum, log) => sum + log.minutes / 60, 0);
  const billableHours = timeLogs
    .filter((log) => log.is_billable)
    .reduce((sum, log) => sum + log.minutes / 60, 0);
  const nonBillableHours = totalHours - billableHours;
  const billableRate = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

  const uniqueProjects = new Set(
    timeLogs.map((log) => log.projects?.id).filter(Boolean)
  ).size;
  const uniqueClients = new Set(
    timeLogs.map((log) => log.projects?.companies?.id).filter(Boolean)
  ).size;

  // Calculate revenue at risk
  const hourlyRate = user.user_rate ? user.user_rate / 100 : 244;
  const revenueAtRisk = nonBillableHours * hourlyRate;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
    }).format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {user.name}{" "}
              <Badge variant="secondary">{user.department_code}</Badge>
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Back button and user info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalHours)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {timeLogs.length} time entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Billable Hours
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(billableHours)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {billableRate.toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Non-Billable Hours
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatNumber(nonBillableHours)}h
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(revenueAtRisk)} at risk
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Projects & Clients
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueProjects}</div>
            <p className="text-xs text-muted-foreground">
              {uniqueClients} unique clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DatePicker startDate={startDate} endDate={endDate} />
        </CardContent>
      </Card>

      {/* Time Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Time Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {timeLogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No time logs found for the selected date range
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left p-3 text-sm font-medium">Date</th>
                    <th className="text-left p-3 text-sm font-medium">
                      Project
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Client
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Description
                    </th>
                    <th className="text-right p-3 text-sm font-medium">
                      Hours
                    </th>
                    <th className="text-center p-3 text-sm font-medium">
                      Billable
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                {timeLogs.length > 0 && (
                  <tbody>
                    {timeLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-sm whitespace-nowrap">
                          {formatDate(log.date)}
                        </td>
                        <td className="p-3 text-sm">
                          {log.projects?.name || "-"}
                        </td>
                        <td className="p-3 text-sm">
                          {log.projects?.companies?.name || "-"}
                        </td>
                        <td className="p-3 text-sm max-w-xs truncate">
                          {log.description || "-"}
                        </td>
                        <td className="p-3 text-sm text-right font-medium">
                          {formatNumber(log.minutes / 60)}h
                        </td>
                        <td className="p-3 text-center">
                          {log.is_billable ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </td>
                        <td className="p-3 text-sm">
                          {log.approval_status ? (
                            <Badge
                              variant={
                                log.approval_status === "approved"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {log.approval_status}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
