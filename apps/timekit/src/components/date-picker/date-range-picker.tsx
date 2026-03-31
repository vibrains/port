/**
 * Date Range Picker Component
 * Frontend Lead Agent - Phase 4
 *
 * Date range selector using shadcn/ui Calendar
 */

'use client';

import { CalendarIcon, X } from 'lucide-react';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
  subWeeks,
} from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  className?: string;
}

type DatePreset = {
  label: string;
  getValue: () => DateRange;
};

const datePresets: DatePreset[] = [
  {
    label: 'Previous Month',
    getValue: () => {
      const prevMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(prevMonth), to: endOfMonth(prevMonth) };
    },
  },
  {
    label: 'Current Month',
    getValue: () => {
      const now = new Date();
      return { from: startOfMonth(now), to: now };
    },
  },
  {
    label: 'Last 2 Weeks',
    getValue: () => {
      const now = new Date();
      const twoWeeksAgo = subWeeks(now, 2);
      return { from: startOfWeek(twoWeeksAgo, { weekStartsOn: 1 }), to: now };
    },
  },
  {
    label: 'Last 30 Days',
    getValue: () => {
      return { from: subDays(new Date(), 30), to: new Date() };
    },
  },
];

export function DateRangePicker({ dateRange, onDateRangeChange, className }: DateRangePickerProps) {
  const handlePresetClick = (preset: DatePreset) => {
    onDateRangeChange(preset.getValue());
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        {datePresets.map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePresetClick(preset)}
            className="h-8 text-xs whitespace-nowrap"
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            aria-label={
              dateRange?.from
                ? `Selected date range: ${format(dateRange.from, 'LLL dd, y')}${dateRange.to ? ` to ${format(dateRange.to, 'LLL dd, y')}` : ''}`
                : 'Select a date range'
            }
            className={cn(
              'w-full justify-start text-left font-normal sm:w-[300px]',
              !dateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from ? new Date(dateRange.from.getFullYear(), dateRange.from.getMonth()) : undefined}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {dateRange?.from && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDateRangeChange(undefined)}
          className="h-8 text-xs text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

export { datePresets };
