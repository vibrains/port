"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
} from "@ndos/ui";
import {
  AlertTriangle,
  Flame,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useInsightsQuery } from "@/hooks/use-insights-query";

interface InsightsContentProps {
  defaultDateStart: string;
  defaultDateEnd: string;
}

export function InsightsContent({
  defaultDateStart,
  defaultDateEnd,
}: InsightsContentProps) {
  const { overview, clients, people, isLoading, isFetching, error } =
    useInsightsQuery(defaultDateStart, defaultDateEnd);

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

  if (isLoading) {
    return (
      <main className="flex-1 p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading insights...</p>
            <p className="text-sm text-muted-foreground mt-2">
              This may take a moment for large datasets
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-muted-foreground font-medium">
              Failed to load insights
            </p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!overview || overview.totalHours === 0) {
    return (
      <main className="flex-1 p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No data available for the selected date range
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Calculate insights
  const highGapClients = clients
    .filter((c) => !c.isInternal && c.gapHours > 0)
    .sort((a, b) => b.gapHours / b.totalHours - a.gapHours / a.totalHours)
    .slice(0, 5);

  const highGapUsers = people
    .filter((p) => p.gapHours > 0)
    .sort((a, b) => b.gapHours / b.totalHours - a.gapHours / a.totalHours)
    .slice(0, 5);

  const topPerformers = people
    .filter((p) => p.totalHours > 0)
    .sort((a, b) => b.billablePercent - a.billablePercent)
    .slice(0, 5);

  const profitableClients = clients
    .filter((c) => !c.isInternal)
    .sort((a, b) => b.billableDollars - a.billableDollars)
    .slice(0, 5);

  return (
    <main className="flex-1 p-6 space-y-6">
      {/* Background refetch indicator */}
      {isFetching && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Updating...
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="justify-start">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Overall Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${overview.billablePercent >= 60 ? "text-green-600" : "text-amber-600"}`}
            >
              {overview.billablePercent.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(overview.billableHours)} billable of{" "}
              {formatNumber(overview.totalHours)} total hours
            </p>
            <p className="text-xs text-muted-foreground">
              {overview.timeLogCount.toLocaleString()} time logs
            </p>
          </CardContent>
        </Card>

        <Card className="justify-start">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Non-Billable Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {overview.totalHours > 0
                ? ((overview.gapHours / overview.totalHours) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(overview.gapHours)} hours written off
            </p>
          </CardContent>
        </Card>

        <Card className="justify-start">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Non-Billable Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(overview.gapDollars)}
              {overview.hasEstimatedRates && (
                <span
                  className="text-amber-500 text-lg ml-1"
                  title="Includes hours valued at estimated $150/hr rate"
                >
                  *
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Potential revenue loss
              {overview.hasEstimatedRates && " (includes estimated rates)"}
            </p>
          </CardContent>
        </Card>

        <Card className="justify-start">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Avg Billable Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview.billableHours > 0
                ? formatCurrency(
                    overview.billableDollars / overview.billableHours,
                  )
                : "$0"}
              {overview.hasEstimatedRates && (
                <span
                  className="text-amber-500 text-lg ml-1"
                  title="Includes hours valued at estimated $150/hr rate"
                >
                  *
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per billable hour
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Top Burners */}
        <Card className="justify-start">
          <CardHeader className="flex flex-row items-start gap-2">
            <Flame className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <CardTitle className="text-base">Top Burners</CardTitle>
              <CardDescription>Highest billable percentage</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pl-[calc(1.5rem+1.25rem+0.5rem)]">
            {topPerformers.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                      <span className="text-sm truncate">{person.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatNumber(person.billableHours)} billable hours
                      </span>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">
                      {person.billablePercent.toFixed(0)}% billable
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No team members with logged hours
              </p>
            )}
          </CardContent>
        </Card>

        {/* Problem Areas */}
        <Card className="justify-start">
          <CardHeader className="flex flex-row items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <CardTitle className="text-base">
                High Non-Billable Clients
              </CardTitle>
              <CardDescription>
                External clients with highest non-billable ratio
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pl-[calc(1.5rem+1.25rem+0.5rem)]">
            {highGapClients.length > 0 ? (
              <div className="space-y-3">
                {highGapClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm truncate flex-1 pr-2">
                      {client.name}
                    </span>
                    <Badge variant="destructive" className="text-xs">
                      {((client.gapHours / client.totalHours) * 100).toFixed(0)}
                      % non-billable
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                No clients with excessive non-billable time
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="justify-start">
          <CardHeader className="flex flex-row items-start gap-2">
            <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <CardTitle className="text-base">Recommendations</CardTitle>
              <CardDescription>Actions to improve utilization</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pl-[calc(1.5rem+1.25rem+0.5rem)]">
            <div className="space-y-3 text-sm">
              {overview.billablePercent < 60 && (
                <div className="flex gap-2">
                  <span className="text-amber-600">•</span>
                  <span>
                    Utilization is below 60%. Review scoping and estimation
                    processes.
                  </span>
                </div>
              )}
              {highGapClients.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-amber-600">•</span>
                  <span>
                    Review contracts for {highGapClients.length} high
                    non-billable client(s).
                  </span>
                </div>
              )}
              {highGapUsers.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-amber-600">•</span>
                  <span>
                    Investigate non-billable patterns for {highGapUsers.length}{" "}
                    team member(s).
                  </span>
                </div>
              )}
              {overview.billablePercent >= 70 &&
                highGapClients.length === 0 && (
                  <div className="flex gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Excellent utilization! Keep up the good work.</span>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Profitable Clients */}
      <Card>
        <CardHeader>
          <CardTitle>Most Profitable Projects</CardTitle>
          <CardDescription>Projects ranked by billable revenue</CardDescription>
        </CardHeader>
        <CardContent>
          {profitableClients.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-5">
              {profitableClients.map((client, i) => (
                <div key={client.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{i + 1}
                    </span>
                  </div>
                  <div
                    className="font-medium truncate mb-1"
                    title={client.name}
                  >
                    {client.name}
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(client.billableDollars)}
                    {client.hasEstimatedRates && (
                      <span
                        className="text-amber-500 text-sm ml-0.5"
                        title="Includes hours valued at estimated $150/hr rate"
                      >
                        *
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatNumber(client.billableHours)}h billable (
                    {client.billablePercent.toFixed(0)}%)
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No external client data available
            </p>
          )}
        </CardContent>
      </Card>
      {/* Estimated rates footnote */}
      {(overview.hasEstimatedRates ||
        clients.some((c) => c.hasEstimatedRates)) && (
        <p className="text-xs text-amber-500">
          * Dollar values include hours valued at estimated $150/hr for users
          without a set rate.
        </p>
      )}
    </main>
  );
}
