/**
 * Empty State component for when there's no data to display
 * @module components/dashboard/empty-state
 */

"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Action configuration for empty state
 * Supports either href for navigation or actionType for predefined actions
 */
interface EmptyStateAction {
  label: string;
  /** URL to navigate to (for link-based actions) */
  href?: string;
  /** Predefined action type */
  actionType?: "reload" | "back";
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
}

/**
 * Empty State props interface
 */
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: EmptyStateAction;
  className?: string;
}

/**
 * Empty State component
 * Displays a friendly message when there's no data to show
 */
export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  /**
   * Handle predefined action types
   */
  const handleAction = () => {
    if (action?.actionType === "reload") {
      window.location.reload();
    } else if (action?.actionType === "back") {
      window.history.back();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <>
          {action.href ? (
            <Button
              variant={action.variant || "default"}
              className="mt-4"
              asChild
            >
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button
              onClick={handleAction}
              variant={action.variant || "default"}
              className="mt-4"
            >
              {action.label}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
