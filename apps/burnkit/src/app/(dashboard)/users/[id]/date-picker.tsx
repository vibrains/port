"use client";

import { Button, Calendar, Popover, PopoverContent, PopoverTrigger, cn } from "@ndos/ui";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface DatePickerProps {
  startDate: Date;
  endDate: Date;
}

export function DatePicker({ startDate, endDate }: DatePickerProps) {
  const router = useRouter();

  // Helper to format date to YYYY-MM-DD in local timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const updateDateRange = (newStart?: Date, newEnd?: Date) => {
    const params = new URLSearchParams();
    params.set("dateStart", formatDateLocal(newStart || startDate));
    params.set("dateEnd", formatDateLocal(newEnd || endDate));
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-4">
      {/* From Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 w-[160px] justify-start text-left font-normal px-3",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{format(startDate, "PP")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(date) => {
              if (date) {
                updateDateRange(date, undefined);
              }
            }}
            initialFocus
          />
          <div className="p-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => updateDateRange(new Date(), undefined)}
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <span className="text-muted-foreground">to</span>

      {/* To Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-9 w-[160px] justify-start text-left font-normal px-3",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{format(endDate, "PP")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={(date) => {
              if (date) {
                updateDateRange(undefined, date);
              }
            }}
            initialFocus
          />
          <div className="p-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => updateDateRange(undefined, new Date())}
            >
              Today
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
