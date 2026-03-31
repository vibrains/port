/**
 * Dashboard Error Page
 * Error boundary for dashboard sections
 * @module app/(dashboard)/error
 */

"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="mt-2 space-y-4">
          <p>
            {error.message || "An unexpected error occurred while loading the dashboard."}
          </p>
          <div className="flex gap-2">
            <Button onClick={reset} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button
              onClick={() => window.location.href = "/"}
              variant="ghost"
              size="sm"
            >
              Go home
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      {process.env.NODE_ENV === "development" && error.stack && (
        <div className="mt-8 max-w-2xl overflow-auto rounded-lg border bg-muted p-4">
          <p className="mb-2 text-sm font-semibold">Error Stack (Development Only):</p>
          <pre className="text-xs text-muted-foreground">
            {error.stack}
          </pre>
        </div>
      )}
    </div>
  );
}
