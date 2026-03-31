/**
 * Sprout Social Post Performance CSV Parser
 * Parses Sprout Social post performance reports into SocialPostInsert records
 * @module lib/parsers/sprout-social
 */

import { SocialPostInsert, SocialNetwork } from "@/types/database";
import {
  ParseResult,
  ParserOptions,
  parseNumber,
  parsePercent,
  cleanString,
  parseCSVToRecords,
  getColumnValue,
  createError,
  parseDate,
} from "./index";

/**
 * Column mappings for Sprout Social CSV files
 * Maps normalized column names to possible variations in the CSV
 */
const COLUMN_MAPPINGS = {
  date: ["Date"],
  postId: ["Post ID"],
  network: ["Network"],
  postType: ["Post Type"],
  contentType: ["Content Type"],
  profile: ["Profile"],
  sentBy: ["Sent by"],
  link: ["Link"],
  post: ["Post"],
  linkedContent: ["Linked Content"],
  impressions: ["Impressions"],
  organicImpressions: ["Organic Impressions"],
  paidImpressions: ["Paid Impressions"],
  reach: ["Reach"],
  organicReach: ["Organic Reach"],
  paidReach: ["Paid Reach"],
  potentialReach: ["Potential Reach"],
  engagementRate: ["Engagement Rate (per Impression)"],
  engagements: ["Engagements"],
  reactions: ["Reactions"],
  likes: ["Likes"],
  dislikes: ["Dislikes"],
  loveReactions: ["Love Reactions"],
  hahaReactions: ["Haha Reactions"],
  wowReactions: ["Wow Reactions"],
  sadReactions: ["Sad Reactions"],
  angryReactions: ["Angry Reactions"],
  comments: ["Comments"],
  shares: ["Shares"],
  saves: ["Saves"],
  postLinkClicks: ["Post Link Clicks"],
  sproutLinkClicks: ["SproutLink Clicks"],
  otherPostClicks: ["Other Post Clicks"],
  postClicksAll: ["Post Clicks (All)"],
  otherEngagements: ["Other Engagements"],
  videoViews: ["Video Views"],
  organicVideoViews: ["Organic Video Views"],
  paidVideoViews: ["Paid Video Views"],
  fullVideoViews: ["Full Video Views"],
  organicFullVideoViews: ["Organic Full Video Views"],
  paidFullVideoViews: ["Paid Full Video Views"],
  fullVideoViewRate: ["Full Video View Rate"],
  storyTapsBack: ["Story Taps Back"],
  storyTapsForward: ["Story Taps Forward"],
  storyExits: ["Story Exits"],
  avgVideoTimeWatched: ["Average Video Time Watched (Seconds)"],
  tags: ["Tags"],
};

/**
 * Maps network names from Sprout Social to our SocialNetwork type
 * @param network - The network name from the CSV
 * @returns The normalized SocialNetwork value
 */
function normalizeNetwork(network: string | undefined): SocialNetwork | null {
  if (!network) {
    return null;
  }

  const normalized = network.toLowerCase().trim();

  const networkMap: Record<string, SocialNetwork> = {
    "facebook": "facebook",
    "instagram": "instagram",
    "linkedin": "linkedin",
    "twitter": "twitter",
    "tiktok": "tiktok",
    "youtube": "youtube",
    "pinterest": "pinterest",
  };

  return networkMap[normalized] || null;
}

/**
 * Parses a Sprout Social post performance CSV file
 * @param csvContent - The raw CSV content from the file
 * @param options - Parser options including clientId and uploadId
 * @returns ParseResult containing parsed SocialPostInsert records and any errors
 */
export function parseSproutSocial(
  csvContent: string,
  options: ParserOptions
): ParseResult<SocialPostInsert> {
  const errors: ParseResult<SocialPostInsert>["errors"] = [];
  const data: SocialPostInsert[] = [];

  try {
    // Parse the CSV records
    const records = parseCSVToRecords(csvContent);
    const totalRows = records.length;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header

      try {
        // Extract values using column mappings
        const postId = getColumnValue(row, COLUMN_MAPPINGS.postId);
        const networkRaw = getColumnValue(row, COLUMN_MAPPINGS.network);
        const postType = getColumnValue(row, COLUMN_MAPPINGS.postType);
        const contentType = getColumnValue(row, COLUMN_MAPPINGS.contentType);
        const profile = getColumnValue(row, COLUMN_MAPPINGS.profile);
        const dateStr = getColumnValue(row, COLUMN_MAPPINGS.date);
        const link = getColumnValue(row, COLUMN_MAPPINGS.link);
        const postText = getColumnValue(row, COLUMN_MAPPINGS.post);

        // Normalize network
        const network = normalizeNetwork(networkRaw);

        // Skip rows with no network or post ID
        if (!network || !postId) {
          continue;
        }

        // Parse numeric fields
        const impressions = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.impressions));
        const organicImpressions = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.organicImpressions));
        const paidImpressions = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.paidImpressions));
        const reach = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.reach));
        const organicReach = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.organicReach));
        const paidReach = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.paidReach));
        const engagementRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.engagementRate));
        const engagements = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.engagements));
        const reactions = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.reactions));
        const likes = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.likes));
        const comments = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.comments));
        const shares = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.shares));
        const saves = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.saves));
        const postLinkClicks = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.postLinkClicks));
        const sproutLinkClicks = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.sproutLinkClicks));
        const otherPostClicks = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.otherPostClicks));
        const postClicksAll = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.postClicksAll));
        const videoViews = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.videoViews));
        const organicVideoViews = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.organicVideoViews));
        const paidVideoViews = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.paidVideoViews));
        const fullVideoViews = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.fullVideoViews));
        const fullVideoViewRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.fullVideoViewRate));
        const storyTapsBack = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.storyTapsBack));
        const storyTapsForward = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.storyTapsForward));
        const storyExits = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.storyExits));
        const avgVideoTimeWatched = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.avgVideoTimeWatched));

        // Parse tags
        const tagsValue = getColumnValue(row, COLUMN_MAPPINGS.tags);
        const tags = tagsValue ? [tagsValue] : null;

        // Parse published date
        let publishedAt: string | null = null;
        if (dateStr) {
          const parsedDate = parseDate(dateStr);
          if (parsedDate) {
            publishedAt = parsedDate.toISOString();
          }
        }

        // Calculate total clicks (sum of all click types)
        const totalClicks = postClicksAll || 
          (postLinkClicks || 0) + (sproutLinkClicks || 0) + (otherPostClicks || 0);

        // Create the post record
        const post: SocialPostInsert = {
          client_id: options.clientId,
          upload_id: options.uploadId,
          post_id: cleanString(postId),
          network: network,
          post_type: cleanString(postType),
          content_type: cleanString(contentType),
          profile: cleanString(profile),
          published_at: publishedAt,
          post_url: cleanString(link),
          post_text: cleanString(postText),
          permalink: cleanString(link),
          impressions: impressions || 0,
          organic_impressions: organicImpressions || 0,
          paid_impressions: paidImpressions || 0,
          reach: reach || 0,
          organic_reach: organicReach || 0,
          paid_reach: paidReach || 0,
          engagement_rate: engagementRate,
          engagements: engagements || 0,
          reactions: reactions || 0,
          likes: likes || 0,
          comments: comments || 0,
          shares: shares || 0,
          saves: saves || 0,
          post_clicks: totalClicks,
          link_clicks: postLinkClicks || 0,
          video_views: videoViews || 0,
          organic_video_views: organicVideoViews || 0,
          paid_video_views: paidVideoViews || 0,
          full_video_views: fullVideoViews || 0,
          full_video_view_rate: fullVideoViewRate,
          avg_watch_time_seconds: avgVideoTimeWatched,
          story_taps_back: storyTapsBack || 0,
          story_taps_forward: storyTapsForward || 0,
          story_exits: storyExits || 0,
          tags: tags,
        };

        data.push(post);

        // Report progress
        if (options.onProgress) {
          options.onProgress(Math.round(((i + 1) / totalRows) * 100));
        }
      } catch (error) {
        errors.push(
          createError(
            rowNumber,
            `Error parsing row: ${error instanceof Error ? error.message : "Unknown error"}`
          )
        );
      }
    }
  } catch (error) {
    errors.push(
      createError(
        0,
        `Failed to parse CSV: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    );
  }

  return {
    data,
    errors,
    rowCount: data.length + errors.length,
    validCount: data.length,
  };
}

/**
 * Validates that a CSV file appears to be a Sprout Social export
 * Checks for required columns
 * @param csvContent - The raw CSV content
 * @returns True if the file appears to be a valid Sprout Social export
 */
export function validateSproutSocialCSV(csvContent: string): boolean {
  try {
    const records = parseCSVToRecords(csvContent);
    if (records.length === 0) {
      return false;
    }

    const firstRow = records[0];
    const headers = Object.keys(firstRow).map((h) => h.toLowerCase());

    // Check for key Sprout Social columns
    const requiredColumns = ["post id", "network"];
    const hasRequiredColumns = requiredColumns.every((col) =>
      headers.some((h) => h.includes(col))
    );

    // Check for Sprout-specific metrics
    const hasSproutMetrics =
      headers.some((h) => h.includes("impressions")) &&
      headers.some((h) => h.includes("engagement"));

    return hasRequiredColumns && hasSproutMetrics;
  } catch {
    return false;
  }
}
