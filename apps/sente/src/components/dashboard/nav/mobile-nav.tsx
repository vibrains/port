/**
 * Mobile navigation component using Sheet
 * @module components/dashboard/nav/mobile-nav
 */

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Mail,
  Globe,
  Share2,
  Settings,
  Workflow,
  FileText,
  Upload,
  History,
  ChevronDown,
  Menu,
  Lightbulb,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * Navigation item interface
 */
interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  items?: NavItem[];
}

/**
 * Navigation items configuration
 */
const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Email",
    href: "/email",
    icon: Mail,
    items: [
      { title: "Campaigns", href: "/email", icon: Mail },
      { title: "Flows", href: "/email/flows", icon: Workflow },
    ],
  },
  {
    title: "Web",
    href: "/web",
    icon: Globe,
    items: [
      { title: "Traffic", href: "/web", icon: Globe },
      { title: "Pages", href: "/web/pages", icon: FileText },
    ],
  },
  {
    title: "Social",
    href: "/social",
    icon: Share2,
  },
  {
    title: "Insights",
    href: "/insights",
    icon: Lightbulb,
  },
  {
    title: "Admin",
    href: "/admin",
    icon: Settings,
    adminOnly: true,
    items: [
      { title: "Upload Data", href: "/admin/upload", icon: Upload },
      { title: "Upload History", href: "/admin/uploads", icon: History },
      { title: "Users", href: "/admin/users", icon: Users },
    ],
  },
];

/**
 * Single navigation link component
 */
function buildHref(basePath: string, searchParams: URLSearchParams): string {
  if (basePath.startsWith("/admin")) return basePath;

  const dateParams = new URLSearchParams();
  for (const key of ["from", "to", "month", "compare"]) {
    const val = searchParams.get(key);
    if (val) dateParams.set(key, val);
  }
  const qs = dateParams.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function NavLink({
  item,
  isActive,
  isSubItem = false,
  onClick,
  searchParams,
}: {
  item: NavItem;
  isActive: boolean;
  isSubItem?: boolean;
  onClick?: () => void;
  searchParams: URLSearchParams;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={buildHref(item.href, searchParams)}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        isSubItem && "pl-9"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-4 w-4" />
      {item.title}
    </Link>
  );
}

/**
 * Collapsible navigation section component
 */
function NavSection({
  item,
  pathname,
  onItemClick,
  searchParams,
}: {
  item: NavItem;
  pathname: string;
  onItemClick: () => void;
  searchParams: URLSearchParams;
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (item.items) {
      return item.items.some(
        (subItem) =>
          pathname === subItem.href || pathname.startsWith(subItem.href + "/")
      );
    }
    return false;
  });

  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;

  if (!item.items || item.items.length === 0) {
    return (
      <NavLink
        item={item}
        isActive={isActive}
        onClick={onItemClick}
        searchParams={searchParams}
      />
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4" />
            {item.title}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 pt-1">
        {item.items.map((subItem) => (
          <NavLink
            key={subItem.href}
            item={subItem}
            isActive={pathname === subItem.href}
            isSubItem
            onClick={onItemClick}
            searchParams={searchParams}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Mobile navigation component
 * Renders a hamburger menu that opens a sheet with navigation
 */
export function MobileNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-left">
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/sente-logo-black.svg`}
              alt="Sente"
              width={120}
              height={28}
              className="h-7 w-auto"
            />
          </SheetTitle>
        </SheetHeader>
        <nav
          className="space-y-1 p-3"
          aria-label="Mobile navigation"
        >
          {navItems.filter((item) => !item.adminOnly).map((item) => (
            <NavSection
              key={item.title}
              item={item}
              pathname={pathname}
              onItemClick={() => setIsOpen(false)}
              searchParams={new URLSearchParams(searchParams.toString())}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
