"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { CLIENTS } from "@/lib/mock-data";
import {
  SidebarTrigger,
  Separator,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@ndos/ui";
import { MarkdownRenderer } from "@/components/markdown-renderer";

export default function ClientPage() {
  const [selectedClient, setSelectedClient] = useState("");
  const [includeMeetings, setIncludeMeetings] = useState(true);
  const [includeDecisions, setIncludeDecisions] = useState(true);

  const ctx = selectedClient ? CLIENTS[selectedClient] : null;

  return (
    <>
      <div className="border-b">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div>
            <h1 className="text-lg font-semibold">Client Context</h1>
            <p className="text-sm text-muted-foreground">
              Complete context bundle for a selected client
            </p>
          </div>
        </header>
      </div>
      <main className="flex-1 p-6 space-y-6">
        {/* Client Selector */}
        <div className="flex flex-wrap items-center gap-4">
          <Select value={selectedClient || "none"} onValueChange={(v) => setSelectedClient(v === "none" ? "" : v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select a client...</SelectItem>
              {Object.keys(CLIENTS).map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <button
              type="button"
              role="switch"
              aria-checked={includeMeetings}
              onClick={() => setIncludeMeetings(!includeMeetings)}
              className={`relative h-5 w-9 rounded-full transition-colors ${includeMeetings ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${includeMeetings ? "translate-x-4" : ""}`}
              />
            </button>
            Meetings
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <button
              type="button"
              role="switch"
              aria-checked={includeDecisions}
              onClick={() => setIncludeDecisions(!includeDecisions)}
              className={`relative h-5 w-9 rounded-full transition-colors ${includeDecisions ? "bg-primary" : "bg-muted"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${includeDecisions ? "translate-x-4" : ""}`}
              />
            </button>
            Decisions
          </label>
        </div>

        {/* Empty State */}
        {!ctx && (
          <Card className="justify-start">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Users className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Select a client to view their context
              </p>
            </CardContent>
          </Card>
        )}

        {/* Context Bundle */}
        {ctx && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="justify-start">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Brand Voice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {ctx.brandVoice}
                  </p>
                </CardContent>
              </Card>

              <Card className="justify-start">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Positioning</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {ctx.positioning}
                  </p>
                </CardContent>
              </Card>

              <Card className="justify-start">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Constraints</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {ctx.constraints}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {includeDecisions && ctx.decisions.length > 0 && (
                <Card className="justify-start">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Decisions ({ctx.decisions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {ctx.decisions.map((d, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex flex-col min-w-0 flex-1 pr-2">
                            <span className="text-sm truncate">{d.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {d.provenance}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {d.date}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {includeMeetings && ctx.meetings.length > 0 && (
                <Card className="justify-start">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      Meetings ({ctx.meetings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {ctx.meetings.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex flex-col min-w-0 flex-1 pr-2">
                            <span className="text-sm truncate">{m.title}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {m.summary}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {m.date}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
