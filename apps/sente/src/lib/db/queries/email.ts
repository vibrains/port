/**
 * Email-related database queries (MOCK)
 * @module lib/db/queries/email
 */

import type {
  EmailCampaign,
  EmailCampaignInsert,
  KlaviyoFlow,
  KlaviyoFlowInsert,
  PardotFlow,
  PardotFlowInsert,
} from "@/types/database";
import type { PaginatedResult } from "@/lib/db/utils";
import { mockEmailCampaigns, mockKlaviyoFlows, mockPardotFlows } from "@/lib/mock-data";

// ─── Email Campaigns ────────────────────────────────────────────────────────

interface EmailCampaignQueryOptions {
  clientId: string;
  startDate?: Date;
  endDate?: Date;
  source?: "klaviyo" | "pardot";
  limit?: number;
  offset?: number;
}

export async function getEmailCampaigns(options: EmailCampaignQueryOptions): Promise<PaginatedResult<EmailCampaign>> {
  const { startDate, endDate, source, limit = 50, offset = 0 } = options;
  let data = [...mockEmailCampaigns];
  if (startDate) data = data.filter((c) => c.send_date && new Date(c.send_date) >= startDate);
  if (endDate) data = data.filter((c) => c.send_date && new Date(c.send_date) <= endDate);
  if (source) data = data.filter((c) => c.source === source);
  data.sort((a, b) => (b.send_date ?? "").localeCompare(a.send_date ?? ""));
  return { data: data.slice(offset, offset + limit), count: data.length };
}

export async function getEmailCampaignsSummary(
  _clientId: string,
  dateRange?: { start: Date; end: Date },
  source?: "klaviyo" | "pardot"
): Promise<{
  totalCampaigns: number; totalRecipients: number; avgOpenRate: number; avgClickRate: number;
  avgClickToOpenRate: number; avgDeliveryRate: number; totalUnsubscribes: number; avgUnsubscribeRate: number;
  totalBounces: number; avgBounceRate: number; totalSpamComplaints: number; avgSpamRate: number; totalRevenue: number;
}> {
  let data = [...mockEmailCampaigns];
  if (dateRange) {
    data = data.filter((c) => c.send_date && new Date(c.send_date) >= dateRange.start && new Date(c.send_date) <= dateRange.end);
  }
  if (source) data = data.filter((c) => c.source === source);
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;
  return {
    totalCampaigns: data.length,
    totalRecipients: sum(data.map((c) => c.total_recipients)),
    avgOpenRate: avg(data.map((c) => c.open_rate ?? 0)),
    avgClickRate: avg(data.map((c) => c.click_rate ?? 0)),
    avgClickToOpenRate: avg(data.map((c) => c.click_to_open_rate ?? 0)),
    avgDeliveryRate: avg(data.map((c) => c.delivery_rate ?? 0)),
    totalUnsubscribes: sum(data.map((c) => c.unsubscribes)),
    avgUnsubscribeRate: avg(data.map((c) => c.unsubscribe_rate ?? 0)),
    totalBounces: sum(data.map((c) => c.bounces)),
    avgBounceRate: avg(data.map((c) => c.bounce_rate ?? 0)),
    totalSpamComplaints: sum(data.map((c) => c.spam_complaints)),
    avgSpamRate: avg(data.map((c) => c.spam_rate ?? 0)),
    totalRevenue: sum(data.map((c) => c.revenue ?? 0)),
  };
}

export async function getTopEmailCampaigns(
  _clientId: string,
  dateRange?: { start: Date; end: Date },
  limit = 5
): Promise<{ campaignName: string; subject: string | null; source: string; totalRecipients: number; openRate: number; clickRate: number; revenue: number }[]> {
  let data = [...mockEmailCampaigns];
  if (dateRange) {
    data = data.filter((c) => c.send_date && new Date(c.send_date) >= dateRange.start && new Date(c.send_date) <= dateRange.end);
  }
  data.sort((a, b) => (b.open_rate ?? 0) - (a.open_rate ?? 0));
  return data.slice(0, limit).map((c) => ({
    campaignName: c.campaign_name ?? "Unnamed",
    subject: c.subject,
    source: c.source,
    totalRecipients: c.total_recipients,
    openRate: c.open_rate ?? 0,
    clickRate: c.click_rate ?? 0,
    revenue: c.revenue ?? 0,
  }));
}

export async function getEmailDayOfWeekBreakdown(
  _clientId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{ dayOfWeek: string; campaigns: number; avgOpenRate: number; avgClickRate: number }[]> {
  let data = [...mockEmailCampaigns];
  if (dateRange) {
    data = data.filter((c) => c.send_date && new Date(c.send_date) >= dateRange.start && new Date(c.send_date) <= dateRange.end);
  }
  const groups = new Map<string, { count: number; openSum: number; clickSum: number }>();
  for (const c of data) {
    if (!c.day_of_week) continue;
    const g = groups.get(c.day_of_week) ?? { count: 0, openSum: 0, clickSum: 0 };
    g.count++; g.openSum += c.open_rate ?? 0; g.clickSum += c.click_rate ?? 0;
    groups.set(c.day_of_week, g);
  }
  return Array.from(groups.entries()).map(([dayOfWeek, g]) => ({
    dayOfWeek, campaigns: g.count, avgOpenRate: g.openSum / g.count, avgClickRate: g.clickSum / g.count,
  }));
}

export async function getEmailEngagementByDayHour(
  _clientId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  day_of_week: number; hour_of_day: number; campaign_count: number; total_recipients: number;
  avg_open_rate: number; avg_click_rate: number;
  campaigns: { campaign_name: string; total_recipients: number; open_rate: number; click_rate: number; send_date: string }[];
}[]> {
  const dayMap: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  let data = [...mockEmailCampaigns];
  if (dateRange) {
    data = data.filter((c) => c.send_date && new Date(c.send_date) >= dateRange.start && new Date(c.send_date) <= dateRange.end);
  }

  const groups = new Map<string, {
    day_of_week: number; hour_of_day: number; campaign_count: number; total_recipients: number;
    openSum: number; clickSum: number;
    campaigns: { campaign_name: string; total_recipients: number; open_rate: number; click_rate: number; send_date: string }[];
  }>();

  for (const c of data) {
    if (!c.day_of_week || !c.send_time) continue;
    const dow = dayMap[c.day_of_week.toLowerCase()];
    if (dow === undefined) continue;
    let hour = 0;
    const ampmMatch = c.send_time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampmMatch) {
      hour = parseInt(ampmMatch[1], 10);
      if (ampmMatch[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
      if (ampmMatch[3].toUpperCase() === "AM" && hour === 12) hour = 0;
    } else {
      hour = parseInt(c.send_time.split(":")[0], 10) || 0;
    }

    const key = `${dow}-${hour}`;
    const g = groups.get(key) ?? { day_of_week: dow, hour_of_day: hour, campaign_count: 0, total_recipients: 0, openSum: 0, clickSum: 0, campaigns: [] };
    g.campaign_count++;
    g.total_recipients += c.total_recipients;
    g.openSum += c.open_rate ?? 0;
    g.clickSum += c.click_rate ?? 0;
    g.campaigns.push({ campaign_name: c.campaign_name ?? "Unnamed", total_recipients: c.total_recipients, open_rate: c.open_rate ?? 0, click_rate: c.click_rate ?? 0, send_date: c.send_date ?? "" });
    groups.set(key, g);
  }

  return Array.from(groups.values()).map((g) => ({
    ...g,
    avg_open_rate: g.campaign_count > 0 ? g.openSum / g.campaign_count : 0,
    avg_click_rate: g.campaign_count > 0 ? g.clickSum / g.campaign_count : 0,
  }));
}

export async function insertEmailCampaigns(_campaigns: EmailCampaignInsert[], _uploadId: string): Promise<{ success: boolean; inserted: number; errors: string[] }> {
  return { success: true, inserted: _campaigns.length, errors: [] };
}

// ─── Klaviyo Flows ──────────────────────────────────────────────────────────

interface KlaviyoFlowQueryOptions {
  clientId: string;
  startDate?: Date;
  endDate?: Date;
  monthKey?: string;
  channel?: string;
}

export async function getKlaviyoFlows(options: KlaviyoFlowQueryOptions): Promise<KlaviyoFlow[]> {
  const { startDate, endDate, monthKey, channel } = options;
  let data = [...mockKlaviyoFlows];

  if (startDate && endDate) {
    data = data.filter((f) => (!f.period_start || new Date(f.period_start) <= endDate) && (!f.period_end || new Date(f.period_end) >= startDate));
  }
  if (monthKey) {
    data = data.filter((f) => {
      if (f.period_start && f.period_end) {
        const ps = f.period_start.substring(0, 7);
        const pe = f.period_end.substring(0, 7);
        return ps <= monthKey && pe >= monthKey;
      }
      return f.period?.toLowerCase().includes(monthKey) ?? false;
    });
  }
  if (channel) data = data.filter((f) => f.channel === channel);
  data.sort((a, b) => (b.period_start ?? "").localeCompare(a.period_start ?? ""));
  return data;
}

export async function getKlaviyoFlowsSummary(
  _clientId: string,
  dateRange?: { start: Date; end: Date },
  _monthKey?: string
): Promise<{
  totalFlows: number; totalRecipients: number; totalRevenue: number; avgOpenRate: number;
  avgClickRate: number; avgUnsubscribeRate: number; avgBounceRate: number; avgPlacedOrderRate: number;
}> {
  let data = [...mockKlaviyoFlows];
  if (dateRange) {
    data = data.filter((f) => (!f.period_start || new Date(f.period_start) <= dateRange.end) && (!f.period_end || new Date(f.period_end) >= dateRange.start));
  }
  if (_monthKey) {
    data = data.filter((f) => {
      if (f.period_start) return f.period_start.substring(0, 7) <= _monthKey && (f.period_end ?? f.period_start).substring(0, 7) >= _monthKey;
      return false;
    });
  }
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;
  return {
    totalFlows: data.length,
    totalRecipients: sum(data.map((f) => f.total_recipients)),
    totalRevenue: sum(data.map((f) => f.revenue ?? 0)),
    avgOpenRate: avg(data.filter((f) => f.open_rate != null).map((f) => f.open_rate!)),
    avgClickRate: avg(data.filter((f) => f.click_rate != null).map((f) => f.click_rate!)),
    avgUnsubscribeRate: avg(data.filter((f) => f.unsubscribe_rate != null).map((f) => f.unsubscribe_rate!)),
    avgBounceRate: avg(data.filter((f) => f.bounce_rate != null).map((f) => f.bounce_rate!)),
    avgPlacedOrderRate: avg(data.filter((f) => f.placed_order_rate != null).map((f) => f.placed_order_rate!)),
  };
}

export async function getTopKlaviyoFlows(
  _clientId: string,
  dateRange?: { start: Date; end: Date },
  limit = 5
): Promise<{ flowName: string; channel: string; totalRecipients: number; openRate: number; clickRate: number; revenue: number }[]> {
  let data = [...mockKlaviyoFlows];
  if (dateRange) {
    data = data.filter((f) => (!f.period_start || new Date(f.period_start) <= dateRange.end) && (!f.period_end || new Date(f.period_end) >= dateRange.start));
  }
  data.sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));
  return data.slice(0, limit).map((f) => ({
    flowName: f.flow_name ?? "Unnamed",
    channel: f.channel ?? "email",
    totalRecipients: f.total_recipients,
    openRate: f.open_rate ?? 0,
    clickRate: f.click_rate ?? 0,
    revenue: f.revenue ?? 0,
  }));
}

export async function insertKlaviyoFlows(_flows: KlaviyoFlowInsert[], _uploadId: string): Promise<{ success: boolean; inserted: number }> {
  return { success: true, inserted: _flows.length };
}

// ─── Pardot Flows ───────────────────────────────────────────────────────────

interface PardotFlowQueryOptions {
  clientId: string;
  programName?: string;
  startDate?: Date;
  endDate?: Date;
  monthKey?: string;
}

export async function getPardotFlows(options: PardotFlowQueryOptions): Promise<PardotFlow[]> {
  const { programName } = options;
  let data = [...mockPardotFlows];
  if (programName) data = data.filter((f) => f.program_name === programName);
  return data;
}

export async function getPardotFlowsSummary(
  _clientId: string
): Promise<{
  totalPrograms: number; totalSent: number; totalDelivered: number; totalUniqueOpens: number;
  totalUniqueClicks: number; totalOptOuts: number; totalBounces: number;
  avgOpenRate: number; avgClickRate: number; avgOptOutRate: number; avgBounceRate: number;
}> {
  const data = mockPardotFlows;
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;
  const programs = new Set(data.map((f) => f.program_name));
  return {
    totalPrograms: programs.size,
    totalSent: sum(data.map((f) => f.sent)),
    totalDelivered: sum(data.map((f) => f.delivered)),
    totalUniqueOpens: sum(data.map((f) => f.unique_opens)),
    totalUniqueClicks: sum(data.map((f) => f.unique_clicks)),
    totalOptOuts: sum(data.map((f) => f.opt_outs)),
    totalBounces: sum(data.map((f) => f.bounces)),
    avgOpenRate: avg(data.map((f) => f.open_rate ?? 0)),
    avgClickRate: avg(data.map((f) => f.click_rate ?? 0)),
    avgOptOutRate: avg(data.map((f) => f.opt_out_rate ?? 0)),
    avgBounceRate: avg(data.map((f) => f.bounce_rate ?? 0)),
  };
}

export async function insertPardotFlows(_flows: PardotFlowInsert[], _uploadId: string): Promise<{ success: boolean; inserted: number }> {
  return { success: true, inserted: _flows.length };
}
