/**
 * Web analytics database queries (MOCK)
 * @module lib/db/queries/web
 */

import type { GA4Page, GA4PageInsert, GA4Acquisition, GA4AcquisitionInsert } from "@/types/database";
import type { PaginatedResult } from "@/lib/db/utils";
import { mockGA4Pages, mockGA4Acquisition } from "@/lib/mock-data";

interface GA4PagesQueryOptions {
  clientId: string;
  startDate?: Date;
  endDate?: Date;
  source?: string;
  pagePath?: string;
  limit?: number;
  offset?: number;
}

export async function getGA4Pages(options: GA4PagesQueryOptions): Promise<PaginatedResult<GA4Page>> {
  const { startDate, endDate, source, pagePath, limit = 50, offset = 0 } = options;
  let data = [...mockGA4Pages];

  if (startDate && endDate) {
    data = data.filter((p) => (!p.period_start || new Date(p.period_start) <= endDate) && (!p.period_end || new Date(p.period_end) >= startDate));
  }
  if (source) data = data.filter((p) => p.source === source);
  if (pagePath) data = data.filter((p) => p.page_path?.toLowerCase().includes(pagePath.toLowerCase()));

  data.sort((a, b) => b.views - a.views);
  return { data: data.slice(offset, offset + limit), count: data.length };
}

export async function getTopPages(
  _clientId: string,
  options?: { limit?: number; dateRange?: { start: Date; end: Date } }
): Promise<GA4Page[]> {
  const limit = options?.limit || 10;
  let data = [...mockGA4Pages];
  if (options?.dateRange) {
    data = data.filter((p) => (!p.period_start || new Date(p.period_start) <= options.dateRange!.end) && (!p.period_end || new Date(p.period_end) >= options.dateRange!.start));
  }
  data.sort((a, b) => b.views - a.views);
  return data.slice(0, limit);
}

export async function getWebSummary(
  _clientId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{ totalViews: number; totalUsers: number; avgEngagementTime: number; totalKeyEvents: number; totalRevenue: number }> {
  let pages = [...mockGA4Pages];
  if (dateRange) {
    pages = pages.filter((p) => (!p.period_start || new Date(p.period_start) <= dateRange.end) && (!p.period_end || new Date(p.period_end) >= dateRange.start));
  }
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;
  return {
    totalViews: sum(pages.map((p) => p.views)),
    totalUsers: sum(pages.map((p) => p.active_users)),
    avgEngagementTime: avg(pages.map((p) => p.avg_engagement_time ?? 0)),
    totalKeyEvents: sum(pages.map((p) => p.key_events)),
    totalRevenue: sum(pages.map((p) => p.total_revenue)),
  };
}

export async function insertGA4Pages(_pages: GA4PageInsert[], _uploadId: string): Promise<{ success: boolean; inserted: number }> {
  return { success: true, inserted: _pages.length };
}

interface GA4AcquisitionQueryOptions {
  clientId: string;
  startDate?: Date;
  endDate?: Date;
  source?: string;
}

export async function getGA4Acquisition(options: GA4AcquisitionQueryOptions): Promise<GA4Acquisition[]> {
  const { startDate, endDate, source } = options;
  let data = [...mockGA4Acquisition];

  if (startDate && endDate) {
    data = data.filter((a) => (!a.period_start || new Date(a.period_start) <= endDate) && (!a.period_end || new Date(a.period_end) >= startDate));
  }
  if (source) data = data.filter((a) => a.first_user_source === source);
  data.sort((a, b) => b.sessions - a.sessions);
  return data;
}

export async function getAcquisitionSummary(
  _clientId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  totalSessions: number;
  totalNewUsers: number;
  totalReturningUsers: number;
  totalEngagedSessions: number;
  avgEngagementRate: number;
  avgEngagementTime: number;
  totalKeyEvents: number;
  totalRevenue: number;
}> {
  let data = [...mockGA4Acquisition];
  if (dateRange) {
    data = data.filter((a) => (!a.period_start || new Date(a.period_start) <= dateRange.end) && (!a.period_end || new Date(a.period_end) >= dateRange.start));
  }
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;
  return {
    totalSessions: sum(data.map((a) => a.sessions)),
    totalNewUsers: sum(data.map((a) => a.new_users)),
    totalReturningUsers: sum(data.map((a) => a.returning_users)),
    totalEngagedSessions: sum(data.map((a) => a.engaged_sessions)),
    avgEngagementRate: avg(data.map((a) => a.engagement_rate ?? 0)),
    avgEngagementTime: avg(data.map((a) => a.avg_engagement_time ?? 0)),
    totalKeyEvents: sum(data.map((a) => a.key_events)),
    totalRevenue: sum(data.map((a) => a.total_revenue)),
  };
}

export async function getTrafficSourceBreakdown(
  _clientId: string,
  dateRange?: { start: Date; end: Date },
  limit = 5
): Promise<{ sourceMedium: string; sessions: number; newUsers: number; engagementRate: number; totalRevenue: number }[]> {
  let data = [...mockGA4Acquisition];
  if (dateRange) {
    data = data.filter((a) => (!a.period_start || new Date(a.period_start) <= dateRange.end) && (!a.period_end || new Date(a.period_end) >= dateRange.start));
  }
  const grouped = new Map<string, { sessions: number; newUsers: number; engRateSum: number; count: number; revenue: number }>();
  for (const a of data) {
    const key = a.first_user_source || "unknown";
    const g = grouped.get(key) ?? { sessions: 0, newUsers: 0, engRateSum: 0, count: 0, revenue: 0 };
    g.sessions += a.sessions;
    g.newUsers += a.new_users;
    g.engRateSum += a.engagement_rate ?? 0;
    g.count++;
    g.revenue += a.total_revenue;
    grouped.set(key, g);
  }
  return Array.from(grouped.entries())
    .map(([k, g]) => ({ sourceMedium: k, sessions: g.sessions, newUsers: g.newUsers, engagementRate: g.count > 0 ? g.engRateSum / g.count : 0, totalRevenue: g.revenue }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, limit);
}

export async function insertGA4Acquisition(_data: GA4AcquisitionInsert[], _uploadId: string): Promise<{ success: boolean; inserted: number }> {
  return { success: true, inserted: _data.length };
}
