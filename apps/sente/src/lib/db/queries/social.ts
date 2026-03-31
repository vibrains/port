/**
 * Social media database queries (MOCK)
 * @module lib/db/queries/social
 */

import type { SocialPost, SocialPostInsert } from "@/types/database";
import type { PaginatedResult } from "@/lib/db/utils";
import { mockSocialPosts } from "@/lib/mock-data";

interface SocialPostsQueryOptions {
  clientId: string;
  startDate?: Date;
  endDate?: Date;
  network?: string;
  postType?: string;
  limit?: number;
  offset?: number;
}

function filterPosts(options: SocialPostsQueryOptions): SocialPost[] {
  const { startDate, endDate, network, postType } = options;
  let data = [...mockSocialPosts];
  if (startDate) data = data.filter((p) => p.published_at && new Date(p.published_at) >= startDate);
  if (endDate) data = data.filter((p) => p.published_at && new Date(p.published_at) <= endDate);
  if (network) data = data.filter((p) => p.network === network);
  if (postType) data = data.filter((p) => p.post_type === postType);
  return data;
}

export async function getSocialPosts(options: SocialPostsQueryOptions): Promise<PaginatedResult<SocialPost>> {
  const { limit = 50, offset = 0 } = options;
  const data = filterPosts(options);
  data.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  return { data: data.slice(offset, offset + limit), count: data.length };
}

export async function getSocialSummary(
  _clientId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  totalPosts: number; totalImpressions: number; totalOrgImpressions: number; totalPaidImpressions: number;
  totalReach: number; totalEngagements: number; totalReactions: number; totalLikes: number;
  totalComments: number; totalShares: number; totalSaves: number; totalPostClicks: number;
  totalLinkClicks: number; avgEngagementRate: number; totalVideoViews: number; totalFullVideoViews: number;
}> {
  let posts = [...mockSocialPosts];
  if (dateRange) {
    posts = posts.filter((p) => p.published_at && new Date(p.published_at) >= dateRange.start && new Date(p.published_at) <= dateRange.end);
  }
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const avg = (arr: number[]) => arr.length ? sum(arr) / arr.length : 0;
  return {
    totalPosts: posts.length,
    totalImpressions: sum(posts.map((p) => p.impressions)),
    totalOrgImpressions: sum(posts.map((p) => p.organic_impressions)),
    totalPaidImpressions: sum(posts.map((p) => p.paid_impressions)),
    totalReach: sum(posts.map((p) => p.reach)),
    totalEngagements: sum(posts.map((p) => p.engagements)),
    totalReactions: sum(posts.map((p) => p.reactions)),
    totalLikes: sum(posts.map((p) => p.likes)),
    totalComments: sum(posts.map((p) => p.comments)),
    totalShares: sum(posts.map((p) => p.shares)),
    totalSaves: sum(posts.map((p) => p.saves)),
    totalPostClicks: sum(posts.map((p) => p.post_clicks)),
    totalLinkClicks: sum(posts.map((p) => p.link_clicks)),
    avgEngagementRate: avg(posts.map((p) => p.engagement_rate ?? 0)),
    totalVideoViews: sum(posts.map((p) => p.video_views)),
    totalFullVideoViews: sum(posts.map((p) => p.full_video_views)),
  };
}

export async function getTopPerformingPosts(
  _clientId: string,
  options?: { metric?: "engagement" | "reach" | "video"; limit?: number; dateRange?: { start: Date; end: Date } }
): Promise<SocialPost[]> {
  const metric = options?.metric || "engagement";
  const limit = options?.limit || 10;
  let data = [...mockSocialPosts];
  if (options?.dateRange) {
    data = data.filter((p) => p.published_at && new Date(p.published_at) >= options.dateRange!.start && new Date(p.published_at) <= options.dateRange!.end);
  }
  const key = metric === "reach" ? "reach" : metric === "video" ? "video_views" : "engagements";
  data.sort((a, b) => (b[key] as number) - (a[key] as number));
  return data.slice(0, limit);
}

export async function getNetworkBreakdown(
  _clientId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{ network: string; posts: number; impressions: number; reach: number; engagements: number; engagementRate: number; videoViews: number }[]> {
  let posts = [...mockSocialPosts];
  if (dateRange) {
    posts = posts.filter((p) => p.published_at && new Date(p.published_at) >= dateRange.start && new Date(p.published_at) <= dateRange.end);
  }
  const groups = new Map<string, { posts: number; impressions: number; reach: number; engagements: number; engRateSum: number; videoViews: number }>();
  for (const p of posts) {
    const n = p.network || "unknown";
    const g = groups.get(n) ?? { posts: 0, impressions: 0, reach: 0, engagements: 0, engRateSum: 0, videoViews: 0 };
    g.posts++; g.impressions += p.impressions; g.reach += p.reach; g.engagements += p.engagements;
    g.engRateSum += p.engagement_rate ?? 0; g.videoViews += p.video_views;
    groups.set(n, g);
  }
  return Array.from(groups.entries())
    .map(([network, g]) => ({ network, posts: g.posts, impressions: g.impressions, reach: g.reach, engagements: g.engagements, engagementRate: g.posts > 0 ? g.engRateSum / g.posts : 0, videoViews: g.videoViews }))
    .sort((a, b) => b.posts - a.posts);
}

export async function getPostTypeBreakdown(
  _clientId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{ postType: string; posts: number; impressions: number; engagements: number; engagementRate: number }[]> {
  let posts = [...mockSocialPosts];
  if (dateRange) {
    posts = posts.filter((p) => p.published_at && new Date(p.published_at) >= dateRange.start && new Date(p.published_at) <= dateRange.end);
  }
  const groups = new Map<string, { posts: number; impressions: number; engagements: number; engRateSum: number }>();
  for (const p of posts) {
    const t = p.post_type || "Unknown";
    const g = groups.get(t) ?? { posts: 0, impressions: 0, engagements: 0, engRateSum: 0 };
    g.posts++; g.impressions += p.impressions; g.engagements += p.engagements; g.engRateSum += p.engagement_rate ?? 0;
    groups.set(t, g);
  }
  return Array.from(groups.entries())
    .map(([postType, g]) => ({ postType, posts: g.posts, impressions: g.impressions, engagements: g.engagements, engagementRate: g.posts > 0 ? g.engRateSum / g.posts : 0 }))
    .sort((a, b) => b.engagements - a.engagements);
}

export async function getContentTypeBreakdown(
  _clientId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{ contentType: string; posts: number; impressions: number; engagements: number; engagementRate: number }[]> {
  let posts = [...mockSocialPosts];
  if (dateRange) {
    posts = posts.filter((p) => p.published_at && new Date(p.published_at) >= dateRange.start && new Date(p.published_at) <= dateRange.end);
  }
  const groups = new Map<string, { posts: number; impressions: number; engagements: number; engRateSum: number }>();
  for (const p of posts) {
    const t = p.content_type || "Unknown";
    const g = groups.get(t) ?? { posts: 0, impressions: 0, engagements: 0, engRateSum: 0 };
    g.posts++; g.impressions += p.impressions; g.engagements += p.engagements; g.engRateSum += p.engagement_rate ?? 0;
    groups.set(t, g);
  }
  return Array.from(groups.entries())
    .map(([contentType, g]) => ({ contentType, posts: g.posts, impressions: g.impressions, engagements: g.engagements, engagementRate: g.posts > 0 ? g.engRateSum / g.posts : 0 }))
    .sort((a, b) => b.engagements - a.engagements);
}

export async function getSocialEngagementByDayHour(
  _clientId: string,
  dateRange?: { start: Date; end: Date }
): Promise<{
  day_of_week: number; hour_of_day: number; post_count: number;
  total_engagements: number; avg_engagement_rate: number;
  posts: { network: string; post_text: string; engagements: number; published_at: string }[];
}[]> {
  let posts = [...mockSocialPosts];
  if (dateRange) {
    posts = posts.filter((p) => p.published_at && new Date(p.published_at) >= dateRange.start && new Date(p.published_at) <= dateRange.end);
  }

  const groups = new Map<string, {
    day_of_week: number; hour_of_day: number; post_count: number;
    total_engagements: number; engRateSum: number;
    posts: { network: string; post_text: string; engagements: number; published_at: string }[];
  }>();

  for (const p of posts) {
    if (!p.published_at) continue;
    const d = new Date(p.published_at);
    const dow = d.getUTCDay();
    const hour = d.getUTCHours();
    const key = `${dow}-${hour}`;
    const g = groups.get(key) ?? { day_of_week: dow, hour_of_day: hour, post_count: 0, total_engagements: 0, engRateSum: 0, posts: [] };
    g.post_count++;
    g.total_engagements += p.engagements;
    g.engRateSum += p.engagement_rate ?? 0;
    g.posts.push({ network: p.network, post_text: (p.post_text ?? "").slice(0, 80), engagements: p.engagements, published_at: p.published_at });
    groups.set(key, g);
  }

  return Array.from(groups.values()).map((g) => ({
    ...g,
    avg_engagement_rate: g.post_count > 0 ? g.engRateSum / g.post_count : 0,
  }));
}

export async function insertSocialPosts(_posts: SocialPostInsert[], _uploadId: string): Promise<{ success: boolean; inserted: number }> {
  return { success: true, inserted: _posts.length };
}
