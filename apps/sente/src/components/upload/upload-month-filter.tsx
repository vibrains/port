"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MonthPicker } from "@/components/ui/month-picker";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface UploadMonthFilterProps {
  value?: string;
}

export function UploadMonthFilter({ value }: UploadMonthFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (month: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    params.delete("page"); // Reset pagination on filter change
    router.push(`?${params.toString()}`);
  };

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("month");
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <MonthPicker value={value} onChange={handleChange} />
      {value && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClear}>
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
