import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarInset, SidebarProvider } from "@ndos/ui";
import { AppSidebar } from "@/components/app-sidebar";
import { QueueProvider } from "@/lib/queue-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MemoryKit - MCP Server for Organizational Memory",
  description:
    "Interactive demo of the MemoryKit MCP server for managing organizational memory with semantic search, client contexts, and structured extraction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueueProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>{children}</SidebarInset>
          </SidebarProvider>
        </QueueProvider>
      </body>
    </html>
  );
}
