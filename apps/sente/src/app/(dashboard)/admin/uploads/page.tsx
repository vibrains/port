/**
 * Upload History Page
 * Page for viewing and managing upload history
 * @module app/(dashboard)/admin/uploads/page
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getUploadHistory } from "@/lib/db/queries/uploads";
import { DataUpload } from "@/types/database";
import { UploadHistoryTable } from "@/components/upload/upload-history-table";
import { UploadMonthFilter } from "@/components/upload/upload-month-filter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Upload } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Upload History | Sente",
  description: "View and manage past data uploads",
};

/**
 * Upload History Page
 * Displays a table of all past uploads with filtering and pagination
 */
export default async function UploadHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Check admin role
  if (session.user.role !== "admin") {
    redirect("/");
  }

  // Get client ID from session
  const clientId = session.user.clientIds?.[0];
  if (!clientId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6" />
            Upload History
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage past data uploads
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No client associated with your account. Please contact an administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse pagination and filter params
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams?.page === "string" ? parseInt(resolvedParams.page, 10) : 1;
  const pageSize = typeof resolvedParams?.pageSize === "string" ? parseInt(resolvedParams.pageSize, 10) : 20;
  const month = typeof resolvedParams?.month === "string" ? resolvedParams.month : undefined;

  // Fetch upload history (with optional month filter)
  let uploads: DataUpload[] = [];
  let error: string | null = null;

  try {
    uploads = await getUploadHistory(clientId, month);
  } catch (err) {
    console.error("Error fetching upload history:", err);
    error = err instanceof Error ? err.message : "Failed to fetch upload history";
  }

  // Calculate pagination
  const totalCount = uploads.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const validPage = Math.min(Math.max(1, page), totalPages || 1);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedUploads = uploads.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6" />
            Upload History
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage past data uploads
          </p>
        </div>
        <Link href="/admin/upload">
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload New File
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Uploads"
          value={totalCount}
          description={month ? `Uploads for ${month}` : "All time uploads"}
        />
        <StatCard
          label="Completed"
          value={uploads.filter((u) => u.status === "completed").length}
          description="Successfully processed"
        />
        <StatCard
          label="Failed"
          value={uploads.filter((u) => u.status === "failed").length}
          description="Failed uploads"
        />
        <StatCard
          label="Processing"
          value={uploads.filter((u) => u.status === "processing").length}
          description="Currently processing"
        />
      </div>

      {/* Upload History Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Recent Uploads</CardTitle>
              <CardDescription>
                Showing {paginatedUploads.length} of {totalCount} uploads
              </CardDescription>
            </div>
            <UploadMonthFilter value={month} />
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please try again later or contact support.
              </p>
            </div>
          ) : (
            <UploadHistoryTable
              uploads={paginatedUploads}
              page={validPage}
              pageSize={pageSize}
              totalCount={totalCount}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Stat card component for displaying upload statistics
 */
interface StatCardProps {
  label: string;
  value: number;
  description: string;
}

function StatCard({ label, value, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
