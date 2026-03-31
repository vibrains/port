"use client";

import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PDFExportButton() {
  const searchParams = useSearchParams();

  function handleExport() {
    const params = searchParams.toString();
    window.open(`/report${params ? `?${params}` : ""}`, "_blank");
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export PDF
    </Button>
  );
}
