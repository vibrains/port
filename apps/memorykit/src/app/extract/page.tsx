"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Check, Clock } from "lucide-react";
import { extractMemory } from "@/lib/mock-api";
import { CLIENTS } from "@/lib/mock-data";
import { useQueue } from "@/lib/queue-context";
import {
  SidebarTrigger,
  Separator,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Label,
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@ndos/ui";

const TYPE_OPTIONS = [
  { value: "decision", label: "Decision" },
  { value: "preference", label: "Preference" },
  { value: "constraint", label: "Constraint" },
  { value: "fact", label: "Fact" },
  { value: "competitive-intel", label: "Competitive Intel" },
  { value: "relationship", label: "Relationship" },
  { value: "other", label: "Other" },
];

interface ExtractionItem {
  title: string;
  content: string;
  type: string;
  provenance: string;
  confidence: "high" | "medium";
}

interface ExtractResult {
  id: string;
  title: string;
  status: string;
}

const emptyItem = (): ExtractionItem => ({
  title: "",
  content: "",
  type: "",
  provenance: "",
  confidence: "high",
});

export default function ExtractPage() {
  const [client, setClient] = useState("");
  const [items, setItems] = useState<ExtractionItem[]>([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const { addExtractions, entries } = useQueue();
  const extractEntries = entries.filter((e) => e.source === "extract");
  const [results, setResults] = useState<ExtractResult[] | null>(null);

  const updateItem = (
    idx: number,
    field: keyof ExtractionItem,
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSubmit =
    client &&
    items.every((item) => item.title && item.content && item.type && item.provenance);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await extractMemory({ client_name: client, items });
      const mapped = res.submitted.map((id, i) => ({
        id,
        title: items[i]?.title || `Item ${i + 1}`,
        status: "pending",
      }));
      setResults(mapped);
      addExtractions(
        mapped.map((m) => ({
          id: m.id,
          title: m.title,
          client,
          type: items[mapped.indexOf(m)]?.type || "other",
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setClient("");
    setItems([emptyItem()]);
    setResults(null);
  };

  return (
    <>
      <div className="border-b">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div>
            <h1 className="text-lg font-semibold">Extract Memory</h1>
            <p className="text-sm text-muted-foreground">
              Batch extract memory items from conversations or documents
            </p>
          </div>
        </header>
      </div>
      <main className="flex-1 p-6 space-y-6">
        {!results ? (
          <Card className="justify-start">
            <CardHeader>
              <CardTitle className="text-base">Batch Extraction</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client */}
                <div className="space-y-1.5">
                  <Label>
                    Client <span className="text-red-400">*</span>
                  </Label>
                  <Select value={client || "none"} onValueChange={(v) => setClient(v === "none" ? "" : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select client..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select client...</SelectItem>
                      {Object.keys(CLIENTS).map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Extraction Items ({items.length})
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        {/* Item header */}
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="font-mono text-xs">
                            Item {idx + 1}
                          </Badge>
                          {items.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(idx)}
                              className="h-7 w-7 text-muted-foreground hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        {/* Title */}
                        <Input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateItem(idx, "title", e.target.value)}
                          placeholder="Title"
                          required
                        />

                        {/* Content */}
                        <textarea
                          value={item.content}
                          onChange={(e) => updateItem(idx, "content", e.target.value)}
                          placeholder="Memory content..."
                          required
                          rows={2}
                          className="flex w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        />

                        {/* Type + Confidence row */}
                        <div className="flex gap-3">
                          <Select value={item.type || "none"} onValueChange={(v) => updateItem(idx, "type", v === "none" ? "" : v)}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Type..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Type...</SelectItem>
                              {TYPE_OPTIONS.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={item.confidence} onValueChange={(v) => updateItem(idx, "confidence", v)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Provenance */}
                        <Input
                          type="text"
                          value={item.provenance}
                          onChange={(e) =>
                            updateItem(idx, "provenance", e.target.value)
                          }
                          placeholder="e.g., meeting/2025-01-15, slack/general"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <Button type="submit" disabled={!canSubmit || loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      Extract {items.length} {items.length === 1 ? "Item" : "Items"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Success Card */}
            <Card className="justify-start border-primary/20 bg-primary/5">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">
                    Batch extraction complete
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {results.length}{" "}
                    {results.length === 1 ? "memory" : "memories"} extracted
                    successfully
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Results Card */}
            <Card className="justify-start">
              <CardHeader>
                <CardTitle className="text-base">Extraction Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm truncate">{r.title}</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {r.id}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button variant="link" onClick={handleReset} className="px-0">
              Start new extraction
            </Button>
          </>
        )}

        {/* Pending Queue */}
        {extractEntries.length > 0 && (
          <Card className="justify-start">
            <CardHeader className="flex flex-row items-start gap-2">
              <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <CardTitle className="text-base">
                  Pending Queue ({extractEntries.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {extractEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between">
                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                      <span className="text-sm truncate">{entry.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {entry.client} &middot;{" "}
                        <code className="font-mono">{entry.id}</code>
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Badge variant="secondary" className="text-xs">
                        {entry.type}
                      </Badge>
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                        pending
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
