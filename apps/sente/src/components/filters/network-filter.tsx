/**
 * Network Filter Component
 * A filter component for selecting social networks/platforms
 * @module components/filters/network-filter
 */

"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

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
import { NETWORK_COLORS } from "@/lib/utils/colors";

/**
 * Network option configuration
 */
interface NetworkOption {
  /** The value identifier for this network */
  value: string;
  /** The display label for this network */
  label: string;
  /** The brand color for this network */
  color: string;
}

/**
 * Props for the NetworkFilter component
 */
interface NetworkFilterProps {
  /** Currently selected network values */
  value: string[];
  /** Callback when selection changes */
  onChange: (networks: string[]) => void;
  /** Available network options (defaults to common social networks) */
  networks?: NetworkOption[];
  /** Title/placeholder for the filter */
  title?: string;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Whether to show color indicators (default: true) */
  showColors?: boolean;
  /** Whether to show badges for selected items (default: true) */
  showBadges?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default network options for social media platforms
 */
const DEFAULT_NETWORK_OPTIONS: NetworkOption[] = [
  { value: "facebook", label: "Facebook", color: NETWORK_COLORS.facebook },
  { value: "instagram", label: "Instagram", color: NETWORK_COLORS.instagram },
  { value: "linkedin", label: "LinkedIn", color: NETWORK_COLORS.linkedin },
  { value: "twitter", label: "Twitter/X", color: NETWORK_COLORS.twitter },
  { value: "tiktok", label: "TikTok", color: NETWORK_COLORS.tiktok },
  { value: "youtube", label: "YouTube", color: NETWORK_COLORS.youtube },
  { value: "pinterest", label: "Pinterest", color: NETWORK_COLORS.pinterest },
];

/**
 * NetworkFilter component provides a multi-select dropdown for filtering by social networks.
 * Shows brand colors for each network and uses shadcn/ui components.
 *
 * @example
 * ```tsx
 * const [networks, setNetworks] = useState<string[]>([]);
 *
 * <NetworkFilter
 *   value={networks}
 *   onChange={setNetworks}
 * />
 *
 * // With custom networks
 * <NetworkFilter
 *   value={networks}
 *   onChange={setNetworks}
 *   networks={[
 *     { value: "custom", label: "Custom Network", color: "#ff0000" },
 *   ]}
 * />
 * ```
 */
export function NetworkFilter({
  value,
  onChange,
  networks = DEFAULT_NETWORK_OPTIONS,
  title = "Network",
  placeholder = "Select networks...",
  showColors = true,
  showBadges = true,
  className,
}: NetworkFilterProps) {
  const [open, setOpen] = React.useState(false);

  // Toggle a network selection
  const toggleNetwork = (networkValue: string) => {
    const newValue = value.includes(networkValue)
      ? value.filter((v) => v !== networkValue)
      : [...value, networkValue];
    onChange(newValue);
  };

  // Clear all selections
  const clearAll = () => {
    onChange([]);
  };

  // Get selected options for badge display
  const selectedOptions = networks.filter((opt) => value.includes(opt.value));

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
                ? networks.find((opt) => opt.value === value[0])?.label ?? value[0]
                : `${value.length} ${title.toLowerCase()}s selected`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No {title.toLowerCase()} found.</CommandEmpty>
              <CommandGroup>
                {networks.map((network) => {
                  const isSelected = value.includes(network.value);
                  return (
                    <CommandItem
                      key={network.value}
                      value={network.value}
                      onSelect={() => toggleNetwork(network.value)}
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
                      {showColors && (
                        <span
                          className="mr-2 h-3 w-3 rounded-full"
                          style={{ backgroundColor: network.color }}
                        />
                      )}
                      <span>{network.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {value.length > 0 && (
                <CommandGroup>
                  <CommandItem
                    onSelect={clearAll}
                    className="justify-center text-center text-muted-foreground"
                  >
                    Clear all
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected badges with network colors */}
      {showBadges && selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedOptions.map((network) => (
            <Badge
              key={network.value}
              variant="secondary"
              className="cursor-pointer"
              style={{
                borderLeft: `3px solid ${network.color}`,
              }}
              onClick={() => toggleNetwork(network.value)}
            >
              {network.label}
              <span className="ml-1">×</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export type { NetworkOption };
export { DEFAULT_NETWORK_OPTIONS };
