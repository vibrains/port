"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FlowTypeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const flowType = searchParams.get("flowType") ?? "all";

  const handleChange = (value: "all" | "b2c" | "b2b") => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("flowType");
    } else {
      params.set("flowType", value);
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <Select
      value={flowType}
      onValueChange={(value) => handleChange(value as "all" | "b2c" | "b2b")}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Flow Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Flows</SelectItem>
        <SelectItem value="b2c">B2C (Klaviyo)</SelectItem>
        <SelectItem value="b2b">B2B (Pardot)</SelectItem>
      </SelectContent>
    </Select>
  );
}
