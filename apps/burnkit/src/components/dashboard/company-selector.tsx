"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ndos/ui";

interface Company {
  id: string;
  name: string;
  teamwork_company_id: number;
}

interface CompanySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
}

export function CompanySelector({
  value,
  onValueChange,
}: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH}/api/companies`);
        if (response.ok) {
          const data = await response.json();
          setCompanies(data);

          // Auto-select first company if none selected
          if (!value && data.length > 0) {
            onValueChange(data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="w-[280px] h-10 bg-muted animate-pulse rounded-md" />;
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a company" />
      </SelectTrigger>
      <SelectContent>
        {companies.map((company) => (
          <SelectItem key={company.id} value={company.id}>
            {company.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
