/**
 * Executive summary and trend data queries (MOCK)
 * @module lib/db/queries/summary
 */

import {
  mockEmailCampaigns,
  mockGA4Pages,
  mockSocialPosts,
} from "@/lib/mock-data";

export async function getExecutiveSummary(
  _clientId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  email: { campaigns: number; recipients: number; openRate: number; clickRate: number; revenue: number };
  emailB2B: { campaigns: number; recipients: number; openRate: number; clickRate: number; revenue: number };
  web: { views: number; users: number; engagementTime: number; revenue: number };
  social: { posts: number; impressions: number; engagements: number; engagementRate: number };
}> {
  const inRange = (d: string | null) => {
    if (!d || !dateRange) return true;
    const t = new Date(d).getTime();
    return t >= dateRange.start.getTime() && t <= dateRange.end.getTime();
  };

  const klaviyo = mockEmailCampaigns.filter((c) => c.source === "klaviyo" && inRange(c.send_date));
  const pardot = mockEmailCampaigns.filter((c) => c.source === "pardot" && inRange(c.send_date));

  const pages = mockGA4Pages.filter((p) => {
    if (!dateRange) return true;
    return (!p.period_start || new Date(p.period_start) <= dateRange.end) &&
           (!p.period_end || new Date(p.period_end) >= dateRange.start);
  });

  const posts = mockSocialPosts.filter((p) => inRange(p.published_at));

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

  return {
    email: {
      campaigns: klaviyo.length,
      recipients: sum(klaviyo.map((c) => c.total_recipients)),
      openRate: avg(klaviyo.map((c) => c.open_rate ?? 0)),
      clickRate: avg(klaviyo.map((c) => c.click_rate ?? 0)),
      revenue: sum(klaviyo.map((c) => c.revenue ?? 0)),
    },
    emailB2B: {
      campaigns: pardot.length,
      recipients: sum(pardot.map((c) => c.total_recipients)),
      openRate: avg(pardot.map((c) => c.open_rate ?? 0)),
      clickRate: avg(pardot.map((c) => c.click_rate ?? 0)),
      revenue: sum(pardot.map((c) => c.revenue ?? 0)),
    },
    web: {
      views: sum(pages.map((p) => p.views)),
      users: sum(pages.map((p) => p.active_users)),
      engagementTime: avg(pages.map((p) => p.avg_engagement_time ?? 0)),
      revenue: sum(pages.map((p) => p.total_revenue)),
    },
    social: {
      posts: posts.length,
      impressions: sum(posts.map((p) => p.impressions)),
      engagements: sum(posts.map((p) => p.engagements)),
      engagementRate: avg(posts.map((p) => p.engagement_rate ?? 0)),
    },
  };
}

export async function getEngagementTrendByNetwork(
  _clientId: string,
  _granularity: "day" | "week" | "month",
  dateRange?: { start: Date; end: Date }
): Promise<{ date: string; [network: string]: number | string }[]> {
  const posts = mockSocialPosts.filter((p) => {
    if (!p.published_at || !dateRange) return !!p.published_at;
    const t = new Date(p.published_at).getTime();
    return t >= dateRange.start.getTime() && t <= dateRange.end.getTime();
  });

  const grouped = new Map<string, Map<string, number>>();
  for (const post of posts) {
    const key = post.published_at!.substring(0, 7);
    if (!grouped.has(key)) grouped.set(key, new Map());
    const nm = grouped.get(key)!;
    nm.set(post.network, (nm.get(post.network) ?? 0) + post.engagements);
  }

  return Array.from(grouped.entries())
    .map(([date, nm]) => {
      const point: { date: string; [k: string]: number | string } = { date };
      for (const [n, v] of nm) point[n] = v;
      return point;
    })
    .sort((a, b) => (a.date as string).localeCompare(b.date as string));
}

export async function getTrendData(
  _clientId: string,
  metric: string,
  _granularity: "day" | "week" | "month",
  dateRange?: { start: Date; end: Date }
): Promise<{ date: string; value: number }[]> {
  const months = ["2025-12", "2026-01", "2026-02", "2026-03"];
  const filtered = dateRange
    ? months.filter((m) => {
        const start = new Date(m + "-01");
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        return start <= dateRange.end && end >= dateRange.start;
      })
    : months;

  const values: Record<string, Record<string, number>> = {
    views: { "2025-12": 56200, "2026-01": 46600, "2026-02": 48600, "2026-03": 73200 },
    users: { "2025-12": 37800, "2026-01": 32000, "2026-02": 32600, "2026-03": 39600 },
    engagements: { "2025-12": 5800, "2026-01": 3920, "2026-02": 5190, "2026-03": 7030 },
    impressions: { "2025-12": 85800, "2026-01": 60200, "2026-02": 77000, "2026-03": 111100 },
    recipients: { "2025-12": 158400, "2026-01": 119050, "2026-02": 117050, "2026-03": 140400 },
    revenue: { "2025-12": 42300, "2026-01": 28250, "2026-02": 28670, "2026-03": 31550 },
    click_rate: { "2025-12": 4.48, "2026-01": 4.25, "2026-02": 4.53, "2026-03": 4.38 },
    open_rate: { "2025-12": 30.56, "2026-01": 28.90, "2026-02": 31.05, "2026-03": 30.10 },
  };

  const metricMap = values[metric] ?? {};
  return filtered.map((m) => ({ date: m, value: metricMap[m] ?? 0 }));
}

export async function getClickRateTrendBySplit(
  _clientId: string,
  _granularity: "day" | "week" | "month",
  dateRange?: { start: Date; end: Date }
): Promise<{ date: string; b2c: number; b2b: number }[]> {
  const campaigns = mockEmailCampaigns.filter((c) => {
    if (!c.send_date || !dateRange) return !!c.send_date;
    const t = new Date(c.send_date).getTime();
    return t >= dateRange.start.getTime() && t <= dateRange.end.getTime();
  });

  const grouped = new Map<string, { b2cSum: number; b2cCount: number; b2bSum: number; b2bCount: number }>();
  for (const c of campaigns) {
    const key = c.send_date!.substring(0, 7);
    const g = grouped.get(key) ?? { b2cSum: 0, b2cCount: 0, b2bSum: 0, b2bCount: 0 };
    const rate = c.click_rate ?? 0;
    if (c.source === "klaviyo") { g.b2cSum += rate; g.b2cCount++; }
    else { g.b2bSum += rate; g.b2bCount++; }
    grouped.set(key, g);
  }

  return Array.from(grouped.entries())
    .map(([date, g]) => ({
      date,
      b2c: g.b2cCount > 0 ? g.b2cSum / g.b2cCount : 0,
      b2b: g.b2bCount > 0 ? g.b2bSum / g.b2bCount : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
