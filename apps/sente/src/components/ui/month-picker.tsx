"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface MonthPickerProps {
  /** Selected value as "YYYY-MM" string, or undefined for no selection */
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function MonthPicker({ value, onChange, className }: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse "YYYY-MM" into year/month numbers; null when no value
  const [selectedYear, selectedMonth] = React.useMemo(() => {
    if (!value) return [null, null];
    const parts = value.split("-").map(Number);
    const [y, m] = parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) ? parts : [null, null];
    return [y, m !== null ? m - 1 : null]; // month is 0-indexed internally
  }, [value]);

  const [viewYear, setViewYear] = React.useState(selectedYear ?? new Date().getFullYear());

  // Sync view year when value changes externally
  React.useEffect(() => {
    if (selectedYear !== null) setViewYear(selectedYear);
  }, [selectedYear]);

  const handleSelect = (monthIndex: number) => {
    const mm = String(monthIndex + 1).padStart(2, "0");
    onChange(`${viewYear}-${mm}`);
    setOpen(false);
  };

  const label = selectedYear !== null && selectedMonth !== null
    ? `${MONTHS[selectedMonth]} ${selectedYear}`
    : "All time";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-[140px] justify-start gap-2 font-normal", className)}
        >
          <CalendarIcon className="size-4 shrink-0 opacity-50" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewYear((y) => y - 1)}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="text-sm font-medium">{viewYear}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewYear((y) => y + 1)}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((name, i) => {
            const isSelected = selectedYear !== null && selectedMonth !== null && viewYear === selectedYear && i === selectedMonth;
            return (
              <Button
                key={name}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                className="h-8 w-full text-sm font-normal"
                onClick={() => handleSelect(i)}
              >
                {name}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
