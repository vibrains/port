"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CampaignTypeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const campaignType = searchParams.get("campaignType") ?? "all";

  const handleChange = (value: "all" | "b2c" | "b2b") => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("campaignType");
    } else {
      params.set("campaignType", value);
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <Select
      value={campaignType}
      onValueChange={(value) => handleChange(value as "all" | "b2c" | "b2b")}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Campaign Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Campaigns</SelectItem>
        <SelectItem value="b2c">B2C (Klaviyo)</SelectItem>
        <SelectItem value="b2b">B2B (Pardot)</SelectItem>
      </SelectContent>
    </Select>
  );
}
