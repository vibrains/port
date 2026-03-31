"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, ChevronDown, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatMonth(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function ReportControls({
  availableMonths = [],
  currentMonth,
}: {
  availableMonths?: string[];
  currentMonth?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Defer dropdown render to client to avoid Radix ID hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Default to the most recent available month when none is selected
  const effectiveMonth = currentMonth ?? availableMonths[0];
  const selectedLabel = effectiveMonth ? formatMonth(effectiveMonth) : "No Data";

  const handleFilter = (month: string) => {
    const params = new URLSearchParams();
    params.set("month", month);
    // Preserve the compare flag from the current URL
    if (searchParams.get("compare") === "true") {
      params.set("compare", "true");
    }
    router.push(`/report?${params.toString()}`);
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>
          <Filter className="mr-2 h-4 w-4" />
          {selectedLabel}
        </Button>
        <Button size="sm" disabled>
          <Printer className="mr-2 h-4 w-4" />
          Print {selectedLabel}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {availableMonths.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              {selectedLabel}
              <ChevronDown className="ml-2 h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableMonths.map((m) => (
              <DropdownMenuItem
                key={m}
                onClick={() => handleFilter(m)}
                className={m === effectiveMonth ? "font-semibold" : ""}
              >
                {formatMonth(m)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <Filter className="mr-2 h-4 w-4" />
          {selectedLabel}
        </Button>
      )}
      <Button size="sm" onClick={() => window.print()}>
        <Printer className="mr-2 h-4 w-4" />
        Print {selectedLabel}
      </Button>
    </div>
  );
}

/** @deprecated Use ReportControls instead */
export const PrintButton = ReportControls;
