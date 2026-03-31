/**
 * Error Boundary component for dashboard error handling
 * @module components/dashboard/error-boundary
 */

"use client";

import { Component, ReactNode, ErrorInfo } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Error Boundary props interface
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  className?: string;
}

/**
 * Error Boundary state interface
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Log error details when caught
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });
    
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    
    // Could also log to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  /**
   * Reset the error state
   */
  handleReset = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, className } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default fallback UI
      return (
        <div className={cn("p-4", className)} role="alert" aria-live="assertive">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="text-sm">
                {error?.message || "An unexpected error occurred."}
              </p>
              {process.env.NODE_ENV === "development" && error?.stack && (
                <pre className="mt-2 max-h-40 overflow-auto rounded bg-destructive/10 p-2 text-xs">
                  {error.stack}
                </pre>
              )}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={this.handleReset}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="default"
            >
              Reload page
            </Button>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC to wrap a component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
): React.ComponentType<P> {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
