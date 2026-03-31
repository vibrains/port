"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Search,
  Users,
  Building2,
  Globe,
  PlusCircle,
  Download,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Badge,
} from "@ndos/ui";
import { useQueue } from "@/lib/queue-context";

const navItems = [
  { title: "Overview", href: "/", icon: Brain, badgeKey: null },
  { title: "Search Context", href: "/search", icon: Search, badgeKey: null },
  { title: "Client Context", href: "/client", icon: Users, badgeKey: null },
  { title: "Agency Context", href: "/agency", icon: Building2, badgeKey: null },
  { title: "Industry Context", href: "/industry", icon: Globe, badgeKey: null },
  { title: "Suggest Memory", href: "/suggest", icon: PlusCircle, badgeKey: "suggest" as const },
  { title: "Extract Memory", href: "/extract", icon: Download, badgeKey: "extract" as const },
];

export function AppSidebar() {
  const pathname = usePathname();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const normalizedPath = pathname.replace(basePath, "") || "/";
  const { suggestCount, extractCount } = useQueue();

  const getBadgeCount = (key: string | null) => {
    if (key === "suggest") return suggestCount;
    if (key === "extract") return extractCount;
    return 0;
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">MemoryKit</span>
            <span className="text-xs text-muted-foreground">MCP Demo</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  normalizedPath === item.href ||
                  (item.href !== "/" && normalizedPath.startsWith(item.href));
                const count = getBadgeCount(item.badgeKey);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {count > 0 && (
                          <Badge variant="secondary" className="ml-auto h-5 min-w-5 justify-center px-1.5 text-[10px]">
                            {count}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            v0.1.0 &mdash; Demo Mode
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
