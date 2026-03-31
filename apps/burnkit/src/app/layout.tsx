import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SidebarInset, SidebarProvider } from "@ndos/ui";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BurnKit - Financial Analytics",
  description: "Financial analytics and time tracking insights",
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
        <Providers>
          <SidebarProvider>
            <Suspense fallback={null}>
              <AppSidebar />
            </Suspense>
            <SidebarInset>{children}</SidebarInset>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
