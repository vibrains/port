"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getIndustryContext } from "@/lib/mock-api";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import {
  SidebarTrigger,
  Separator,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@ndos/ui";

export default function IndustryPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getIndustryContext().then((data) => {
      setContent(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <div className="border-b">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div>
            <h1 className="text-lg font-semibold">Industry Context</h1>
            <p className="text-sm text-muted-foreground">
              Industry trends, benchmarks, and competitive insights
            </p>
          </div>
        </header>
      </div>
      <main className="flex-1 p-6 space-y-6">
        {loading ? (
          <Card className="justify-start">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="justify-start">
            <CardHeader>
              <CardTitle className="text-base">Industry Intelligence</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={content} />
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
