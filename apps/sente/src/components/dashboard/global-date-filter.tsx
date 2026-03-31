"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/month-picker";
import { X } from "lucide-react";

/**
 * Global date filter that persists date range and comparison toggle in URL search params.
 * Placed in the dashboard header to control filtering across all pages.
 */
export function GlobalDateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const compareParam = searchParams.get("compare") === "true";
  const activeMonth = searchParams.get("month");

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams]
  );

  const handleCompareChange = useCallback(
    (checked: boolean) => {
      updateParams({ compare: checked ? "true" : null });
    },
    [updateParams]
  );

  return (
    <div className="flex items-center gap-3">
      <MonthPicker
        value={activeMonth ?? undefined}
        onChange={(month) => updateParams({ month, from: null, to: null })}
      />
      <div className="flex items-center gap-1.5">
        <Checkbox
          id="compare-toggle"
          checked={compareParam}
          onCheckedChange={(checked) =>
            handleCompareChange(checked === true)
          }
        />
        <Label
          htmlFor="compare-toggle"
          className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
        >
          Compare
        </Label>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => updateParams({ month: null, compare: null, from: null, to: null })}
        title="Reset month filter"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
