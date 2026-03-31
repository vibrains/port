/**
 * Source Filter Component
 * A filter component for selecting data sources/channels
 * @module components/filters/source-filter
 */

"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

/**
 * Source option configuration
 */
interface SourceOption {
  /** The value identifier for this source */
  value: string;
  /** The display label for this source */
  label: string;
  /** Optional icon to display */
  icon?: LucideIcon;
}

/**
 * Props for the SourceFilter component
 */
interface SourceFilterProps {
  /** Currently selected source values */
  value: string[];
  /** Callback when selection changes */
  onChange: (sources: string[]) => void;
  /** Available source options */
  options: SourceOption[];
  /** Title/placeholder for the filter */
  title?: string;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Whether to allow multiple selection (default: true) */
  multiple?: boolean;
  /** Whether to show badges for selected items (default: true) */
  showBadges?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Maximum height of the dropdown */
  maxHeight?: number;
}

/**
 * Default source options for marketing channels
 */
const DEFAULT_SOURCE_OPTIONS: SourceOption[] = [
  { value: "email", label: "Email" },
  { value: "social", label: "Social Media" },
  { value: "paid", label: "Paid Ads" },
  { value: "organic", label: "Organic Search" },
  { value: "direct", label: "Direct" },
  { value: "referral", label: "Referral" },
  { value: "affiliate", label: "Affiliate" },
];

/**
 * SourceFilter component provides a multi-select dropdown for filtering by data sources.
 * Uses shadcn/ui Command and Popover components for an accessible, searchable interface.
 *
 * @example
 * ```tsx
 * const [sources, setSources] = useState<string[]>([]);
 *
 * <SourceFilter
 *   value={sources}
 *   onChange={setSources}
 *   options={[
 *     { value: "email", label: "Email", icon: MailIcon },
 *     { value: "social", label: "Social Media", icon: ShareIcon },
 *   ]}
 *   title="Channel"
 * />
 * ```
 */
export function SourceFilter({
  value,
  onChange,
  options = DEFAULT_SOURCE_OPTIONS,
  title = "Source",
  placeholder = "Select sources...",
  multiple = true,
  showBadges = true,
  className,
  maxHeight = 300,
}: SourceFilterProps) {
  const [open, setOpen] = React.useState(false);

  // Toggle a source selection
  const toggleSource = (sourceValue: string) => {
    if (multiple) {
      const newValue = value.includes(sourceValue)
        ? value.filter((v) => v !== sourceValue)
        : [...value, sourceValue];
      onChange(newValue);
    } else {
      onChange(value.includes(sourceValue) ? [] : [sourceValue]);
      setOpen(false);
    }
  };

  // Clear all selections
  const clearAll = () => {
    onChange([]);
  };

  // Get selected options for badge display
  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            <span className="truncate">
              {value.length === 0
                ? placeholder
                : value.length === 1
                ? options.find((opt) => opt.value === value[0])?.label ?? value[0]
                : `${value.length} ${title.toLowerCase()}s selected`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
            <CommandList style={{ maxHeight }}>
              <CommandEmpty>No {title.toLowerCase()} found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const Icon = option.icon;
                  const isSelected = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => toggleSource(option.value)}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50 [&_svg]:invisible"
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {value.length > 0 && (
                <>
                  <CommandGroup>
                    <CommandItem
                      onSelect={clearAll}
                      className="justify-center text-center text-muted-foreground"
                    >
                      Clear all
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected badges */}
      {showBadges && selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((option) => (
            <Badge
              key={option.value}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => toggleSource(option.value)}
            >
              {option.label}
              <span className="ml-1">×</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export type { SourceOption };
export { DEFAULT_SOURCE_OPTIONS };
