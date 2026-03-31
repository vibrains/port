"use client";

import { useState } from "react";
import { Check, Loader2, Clock } from "lucide-react";
import { suggestMemory } from "@/lib/mock-api";
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
  { value: "other", label: "Other" },
];

interface SuggestResult {
  id: string;
  status: string;
  message: string;
  markdown: string;
}

export default function SuggestPage() {
  const [client, setClient] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("");
  const [provenance, setProvenance] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestResult | null>(null);

  const { addSuggestion, entries } = useQueue();
  const suggestEntries = entries.filter((e) => e.source === "suggest");
  const canSubmit = client && title && content && type && provenance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await suggestMemory({
        client_name: client,
        title,
        content,
        type,
        provenance,
      });
      const markdown = [
        `---`,
        `id: ${res.id}`,
        `title: "${title}"`,
        `client: ${client}`,
        `type: ${type}`,
        `status: pending`,
        `submitted: ${new Date().toISOString()}`,
        `provenance: "${provenance}"`,
        `---`,
        ``,
        `# ${title}`,
        ``,
        content,
      ].join("\n");
      setResult({ ...res, markdown });
      addSuggestion({ id: res.id, title, client, type });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setClient("");
    setTitle("");
    setContent("");
    setType("");
    setProvenance("");
    setResult(null);
  };

  return (
    <>
      <div className="border-b">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div>
            <h1 className="text-lg font-semibold">Suggest Memory</h1>
            <p className="text-sm text-muted-foreground">
              Submit a new memory entry for human review
            </p>
          </div>
        </header>
      </div>
      <main className="flex-1 p-6 space-y-6">
        {!result ? (
          <Card className="justify-start">
            <CardHeader>
              <CardTitle className="text-base">New Memory Suggestion</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div className="space-y-1.5">
                  <Label>
                    Title <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Brief, descriptive title"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Content <span className="text-red-400">*</span>
                  </Label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                    rows={4}
                    placeholder="The memory content to store..."
                    className="flex w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Type <span className="text-red-400">*</span>
                  </Label>
                  <Select value={type || "none"} onValueChange={(v) => setType(v === "none" ? "" : v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select type...</SelectItem>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Provenance <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={provenance}
                    onChange={(e) => setProvenance(e.target.value)}
                    required
                    placeholder="e.g., client-call/2025-01-15, slack/brand-channel"
                  />
                </div>

                <Button type="submit" disabled={!canSubmit || loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Suggestion"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="justify-start border-primary/20 bg-primary/5">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">
                    Memory suggestion created
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ID:{" "}
                    <code className="rounded bg-muted px-1 font-mono text-primary">
                      {result.id}
                    </code>{" "}
                    &middot; Pending approval (72hr SLA)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="justify-start">
              <CardHeader>
                <CardTitle className="text-base">Generated Entry Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-foreground">
                  {result.markdown}
                </pre>
              </CardContent>
            </Card>

            <Button variant="link" onClick={handleReset} className="px-0">
              Submit another suggestion
            </Button>
          </>
        )}

        {/* Pending Queue */}
        {suggestEntries.length > 0 && (
          <Card className="justify-start">
            <CardHeader className="flex flex-row items-start gap-2">
              <Clock className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <CardTitle className="text-base">
                  Pending Queue ({suggestEntries.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suggestEntries.map((entry) => (
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
