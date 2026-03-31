import { SidebarInset } from "@ndos/ui";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarInset className="m-0">{children}</SidebarInset>;
}
