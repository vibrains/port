"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { Badge } from "./badge";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { cn } from "../lib/utils";

interface Option {
  value: string;
  label: string;
  badge?: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  placeholder?: string;
  label?: string;
  searchPlaceholder?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select items",
  label = "items",
  searchPlaceholder = "Search...",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (value: string) => {
    const newSet = new Set(selected);
    if (newSet.has(value)) {
      newSet.delete(value);
    } else {
      newSet.add(value);
    }
    onChange(newSet);
  };

  const selectAll = () => onChange(new Set(options.map((o) => o.value)));
  const clearAll = () => onChange(new Set());

  const displayText =
    selected.size === 0
      ? `No ${label} selected`
      : selected.size === options.length
        ? `All ${label} selected`
        : `${selected.size} ${label} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 inline-flex h-9 min-w-[200px] items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 opacity-50 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2 border-b">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
            autoFocus={false}
          />
        </div>
        <div className="flex gap-1 p-2 border-b bg-muted/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              selectAll();
            }}
            className="h-7 text-xs"
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              clearAll();
            }}
            className="h-7 text-xs"
          >
            Clear All
          </Button>
        </div>
        <div className="max-h-64 overflow-auto p-1">
          {filtered.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
            >
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  selected.has(opt.value)
                    ? "bg-primary text-primary-foreground"
                    : "opacity-50"
                )}
              >
                {selected.has(opt.value) && <Check className="h-3 w-3" />}
              </div>
              <input
                type="checkbox"
                checked={selected.has(opt.value)}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleOption(opt.value);
                }}
                className="sr-only"
              />
              <span className="text-sm flex-1 truncate">{opt.label}</span>
              {opt.badge && (
                <Badge variant="secondary" className="text-xs">
                  {opt.badge}
                </Badge>
              )}
            </label>
          ))}
          {filtered.length === 0 && (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
