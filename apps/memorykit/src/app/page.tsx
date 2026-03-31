"use client";

import Link from "next/link";
import {
  Search,
  Users,
  Building2,
  Factory,
  Lightbulb,
  FileOutput,
  ArrowRight,
  Wrench,
  MonitorSmartphone,
  FileStack,
} from "lucide-react";
import {
  SidebarTrigger,
  Separator,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
} from "@ndos/ui";

const tools = [
  {
    name: "search_context",
    description:
      "Full-text semantic search across all organizational memory with filters for client, type, and recency.",
    params: ["query", "client?", "type?", "since_days?"],
    href: "/search",
    icon: Search,
  },
  {
    name: "client_context",
    description:
      "Retrieve a complete context bundle for a client including brand voice, positioning, constraints, decisions, and meetings.",
    params: ["client_slug", "include_meetings?", "include_decisions?"],
    href: "/client",
    icon: Users,
  },
  {
    name: "agency_context",
    description:
      "Retrieve agency-wide context including methodology, processes, values, and operational guidelines.",
    params: [],
    href: "/agency",
    icon: Building2,
  },
  {
    name: "industry_context",
    description:
      "Retrieve industry-level intelligence including trends, benchmarks, regulatory landscape, and competitive insights.",
    params: [],
    href: "/industry",
    icon: Factory,
  },
  {
    name: "suggest_memory",
    description:
      "Suggest a new memory entry for human review. Creates a draft with frontmatter metadata and 72-hour approval SLA.",
    params: ["client", "title", "content", "type", "provenance"],
    href: "/suggest",
    icon: Lightbulb,
  },
  {
    name: "extract_memories",
    description:
      "Batch extract multiple memory items from a conversation or document. Supports confidence scoring and relationship types.",
    params: ["client", "items[]"],
    href: "/extract",
    icon: FileOutput,
  },
];

export default function OverviewPage() {
  return (
    <>
      <div className="border-b">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div>
            <h1 className="text-lg font-semibold">Overview</h1>
            <p className="text-sm text-muted-foreground">
              MCP Server Demo — Interactive tool explorer
            </p>
          </div>
        </header>
      </div>
      <main className="flex-1 p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="justify-start">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">6</div>
              <p className="text-xs text-muted-foreground mt-1">
                Available MCP tools
              </p>
            </CardContent>
          </Card>
          <Card className="justify-start">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">3</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active client contexts
              </p>
            </CardContent>
          </Card>
          <Card className="justify-start">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">20</div>
              <p className="text-xs text-muted-foreground mt-1">
                Indexed documents
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tool cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.name} className="justify-start">
                <CardHeader className="flex flex-row items-start gap-2">
                  <Icon className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <CardTitle className="text-base">
                      <code>{tool.name}</code>
                    </CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {tool.params.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {tool.params.map((param) => (
                        <Badge
                          key={param}
                          variant="outline"
                          className={`font-mono text-[11px] ${
                            param.endsWith("?")
                              ? "text-muted-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {param}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button variant="ghost" size="sm" asChild className="gap-1.5 px-0">
                    <Link href={tool.href}>
                      Try it
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </>
  );
}
