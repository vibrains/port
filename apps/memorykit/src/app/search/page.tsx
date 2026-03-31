"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Filter, ArrowUpDown, FileText, Loader2 } from "lucide-react";
import { searchContext } from "@/lib/mock-api";
import type { SearchResult } from "@/lib/mock-data";
import {
  SidebarTrigger,
  Separator,
  Input,
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

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "decision", label: "Decision" },
  { value: "preference", label: "Preference" },
  { value: "constraint", label: "Constraint" },
  { value: "fact", label: "Fact" },
  { value: "meeting", label: "Meeting" },
  { value: "brief", label: "Brief" },
];

const CLIENT_OPTIONS = [
  { value: "", label: "All clients" },
  { value: "Acme Wellness", label: "Acme Wellness" },
  { value: "Lumina Aesthetics", label: "Lumina Aesthetics" },
  { value: "Peak Performance", label: "Peak Performance" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [client, setClient] = useState("");
  const [type, setType] = useState("");
  const [sortNewest, setSortNewest] = useState(true);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const doSearch = useCallback(
    async (q: string, c: string, t: string) => {
      setLoading(true);
      setHasSearched(true);
      try {
        const res = await searchContext(q, {
          client: c || undefined,
          type: t || undefined,
        });
        setResults(res);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query, client, type);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, client, type, doSearch]);

  const sortedResults = [...results].sort((a, b) => {
    const dateA = new Date(a.created).getTime();
    const dateB = new Date(b.created).getTime();
    return sortNewest ? dateB - dateA : dateA - dateB;
  });

  const highlightExcerpt = (text: string, q: string) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  };

  return (
    <>
      <div className="border-b">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div>
            <h1 className="text-lg font-semibold">Search Context</h1>
            <p className="text-sm text-muted-foreground">
              Full-text search across organizational memory
            </p>
          </div>
        </header>
      </div>
      <main className="flex-1 p-6 space-y-6">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories... (e.g., brand voice, campaign, budget)"
            className="py-3 pl-10 pr-4"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </div>
          <Select value={client} onValueChange={(v) => setClient(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All clients" />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={(v) => setType(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={() => setSortNewest(!sortNewest)}
            className="flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortNewest ? "Newest first" : "Oldest first"}
          </button>
        </div>

        {/* Results */}
        {loading && (
          <Card className="justify-start">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-12 w-12 text-muted-foreground mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        )}

        {!loading && hasSearched && results.length === 0 && (
          <Card className="justify-start">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Search className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No results found</p>
              <p className="text-xs text-muted-foreground">
                Try adjusting your query or filters
              </p>
            </CardContent>
          </Card>
        )}


        {!loading && sortedResults.length > 0 && (
          <Card className="justify-start">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Results ({sortedResults.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                      <span className="text-sm truncate">{result.title}</span>
                      <span
                        className="text-xs text-muted-foreground line-clamp-1"
                        dangerouslySetInnerHTML={{
                          __html: highlightExcerpt(result.excerpt, query),
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {result.created} &middot; {result.provenance}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <Badge className="text-xs">{result.client}</Badge>
                      <Badge variant="secondary" className="text-xs">
                        {result.type}
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
