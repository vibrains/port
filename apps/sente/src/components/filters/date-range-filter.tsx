/**
 * Date Range Filter Component
 * A date range selector with preset options using shadcn/ui Calendar and Popover
 * @module components/filters/date-range-filter
 */

"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDateRange } from "@/lib/utils/dates";

/**
 * Date range value type
 */
interface DateRangeValue {
  from: Date;
  to: Date;
}

/**
 * Preset configuration
 */
interface DateRangePreset {
  label: string;
  value: DateRangeValue;
}

/**
 * Props for the DateRangeFilter component
 */
interface DateRangeFilterProps {
  /** Current selected date range */
  value: DateRangeValue | undefined;
  /** Callback when date range changes */
  onChange: (range: DateRangeValue | undefined) => void;
  /** Optional custom presets (defaults to standard presets) */
  presets?: DateRangePreset[];
  /** Placeholder text for the trigger button */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to align the popover to the start */
  align?: "start" | "center" | "end";
}

/**
 * Default date range presets
 */
const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: "Last 7 days",
    value: (() => {
      const { start, end } = getDateRange("last7days");
      return { from: start, to: end };
    })(),
  },
  {
    label: "Last 30 days",
    value: (() => {
      const { start, end } = getDateRange("last30days");
      return { from: start, to: end };
    })(),
  },
  {
    label: "Last Month",
    value: (() => {
      const { start, end } = getDateRange("lastMonth");
      return { from: start, to: end };
    })(),
  },
  {
    label: "Last 3 Months",
    value: (() => {
      const { start, end } = getDateRange("last3months");
      return { from: start, to: end };
    })(),
  },
  {
    label: "Last Year",
    value: (() => {
      const { start, end } = getDateRange("lastYear");
      return { from: start, to: end };
    })(),
  },
];

const PRESETS_PLACEHOLDER = "__presets_placeholder__";

/**
 * DateRangeFilter component provides a date range picker with preset options.
 * Uses shadcn/ui Calendar and Popover components for a polished UI.
 *
 * @example
 * ```tsx
 * const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>();
 *
 * <DateRangeFilter
 *   value={dateRange}
 *   onChange={setDateRange}
 * />
 *
 * // With custom presets
 * <DateRangeFilter
 *   value={dateRange}
 *   onChange={setDateRange}
 *   presets={[
 *     { label: "Today", value: { from: new Date(), to: new Date() } },
 *   ]}
 * />
 * ```
 */
export function DateRangeFilter({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  placeholder = "Select date range",
  className,
  align = "start",
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Convert our value format to react-day-picker format
  const dateRange: DateRange | undefined = value
    ? { from: value.from, to: value.to }
    : undefined;

  const selectedPreset = React.useMemo(
    () =>
      presets.find(
        (p) =>
          value &&
          p.value.from.getTime() === value.from.getTime() &&
          p.value.to.getTime() === value.to.getTime()
      )?.label,
    [presets, value]
  );

  // Handle preset selection
  const handlePresetChange = (presetLabel: string) => {
    const preset = presets.find((p) => p.label === presetLabel);
    if (preset) {
      onChange(preset.value);
    }
  };

  // Handle calendar selection
  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      onChange({
        from: range.from,
        to: range.to ?? range.from,
      });
    } else {
      onChange(undefined);
    }
  };

  // Format the display value
  const displayValue = React.useMemo(() => {
    if (!value?.from) return placeholder;

    // Check if it matches a preset
    const matchingPreset = presets.find(
      (p) =>
        p.value.from.getTime() === value.from.getTime() &&
        p.value.to.getTime() === value.to.getTime()
    );
    if (matchingPreset) return matchingPreset.label;

    // Format as date range
    if (value.to && value.from.getTime() !== value.to.getTime()) {
      return `${format(value.from, "MMM d")} - ${format(value.to, "MMM d, yyyy")}`;
    }

    return format(value.from, "MMM d, yyyy");
  }, [value, presets, placeholder]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Preset Selector */}
      <Select
        value={selectedPreset ?? PRESETS_PLACEHOLDER}
        onValueChange={(selectedValue) => {
          if (selectedValue === PRESETS_PLACEHOLDER) return;
          handlePresetChange(selectedValue);
        }}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Presets" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={PRESETS_PLACEHOLDER} disabled>
            Presets
          </SelectItem>
          {presets.map((preset) => (
            <SelectItem key={preset.label} value={preset.label}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Custom Date Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[240px] justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={dateRange}
            onSelect={handleCalendarSelect}
            numberOfMonths={2}
          />
          <div className="border-t p-3 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(undefined);
                setIsOpen(false);
              }}
            >
              Clear
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Done
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export type { DateRangeValue, DateRangePreset };
