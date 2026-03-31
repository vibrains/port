/**
 * Klaviyo Email Campaigns CSV Parser
 * Parses Klaviyo email campaign export CSV files into EmailCampaignInsert records
 * @module lib/parsers/klaviyo-campaigns
 */

import { EmailCampaignInsert } from "@/types/database";
import {
  ParseResult,
  ParserOptions,
  parseNumber,
  parseDateAsUTC,
  parsePercent,
  cleanString,
  parseArray,
  parseCSVToRecords,
  getColumnValue,
  createError,
  getDayOfWeek,
} from "./index";

/**
 * Column mappings for Klaviyo campaign CSV files
 * Maps normalized column names to possible variations in the CSV
 */
const COLUMN_MAPPINGS = {
  campaignName: ["Name", "Campaign Name"],
  subject: ["Subject"],
  previewText: ["Preview Text"],
  sentOn: ["Sent On", "Send Time"],
  sentOnUTC: ["Sent On (UTC)"],
  sentTo: ["Sent To", "List"],
  suppressedFrom: ["Suppressed From"],
  sent: ["Sent", "Total Recipients"],
  bounces: ["Bounces"],
  delivered: ["Delivered", "Successful Deliveries"],
  deliveryRate: ["Delivery Rate"],
  uniqueOpens: ["Unique Opens"],
  openRate: ["Open Rate"],
  totalOpens: ["Total Opens"],
  uniqueClicks: ["Unique Clicks"],
  ctr: ["CTR", "Click Rate"],
  totalClicks: ["Total Clicks"],
  clickToOpenRate: ["Click-To-Open Rate"],
  optOuts: ["Opt Outs", "Unsubscribes"],
  optOutRate: ["Opt-Out Rate"],
  spamComplaints: ["Spam Complaints"],
  spamRate: ["SPAM Complaint Rate", "Spam Complaints Rate"],
  tags: ["Tags"],
  revenue: ["Revenue"],
  campaignId: ["Campaign ID"],
  campaignChannel: ["Campaign Channel"],
  sendWeekday: ["Send Weekday"],
  uniquePlacedOrder: ["Unique Placed Order"],
  placedOrderRate: ["Placed Order Rate"],
};

/**
 * Parses a Klaviyo email campaigns CSV file
 * @param csvContent - The raw CSV content from the file
 * @param options - Parser options including clientId and uploadId
 * @returns ParseResult containing parsed EmailCampaignInsert records and any errors
 */
export function parseKlaviyoCampaigns(
  csvContent: string,
  options: ParserOptions
): ParseResult<EmailCampaignInsert> {
  const errors: ParseResult<EmailCampaignInsert>["errors"] = [];
  const data: EmailCampaignInsert[] = [];

  try {
    const records = parseCSVToRecords(csvContent);
    const totalRows = records.length;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header

      try {
        // Extract values using column mappings
        const campaignName = getColumnValue(row, COLUMN_MAPPINGS.campaignName);
        const subject = getColumnValue(row, COLUMN_MAPPINGS.subject);
        const previewText = getColumnValue(row, COLUMN_MAPPINGS.previewText);
        const sentOn = getColumnValue(row, COLUMN_MAPPINGS.sentOn);
        const sentOnUTC = getColumnValue(row, COLUMN_MAPPINGS.sentOnUTC);
        const sentTo = getColumnValue(row, COLUMN_MAPPINGS.sentTo);
        const suppressedFrom = getColumnValue(row, COLUMN_MAPPINGS.suppressedFrom);

        // Parse numeric fields
        const sent = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.sent));
        const bounces = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.bounces));
        const delivered = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.delivered));
        const deliveryRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.deliveryRate));
        const uniqueOpens = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.uniqueOpens));
        const openRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.openRate));
        const uniqueClicks = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.uniqueClicks));
        const ctr = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.ctr));
        const clickToOpenRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.clickToOpenRate));
        const optOuts = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.optOuts));
        const optOutRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.optOutRate));
        const spamComplaints = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.spamComplaints));
        const spamRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.spamRate));

        // Parse tags
        const tagsValue = getColumnValue(row, COLUMN_MAPPINGS.tags);
        const tags = tagsValue ? parseArray(tagsValue) : [];

        // Parse revenue and campaign ID from newer export format
        const revenue = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.revenue));
        const campaignIdValue = getColumnValue(row, COLUMN_MAPPINGS.campaignId);
        const sendWeekday = getColumnValue(row, COLUMN_MAPPINGS.sendWeekday);

        // Parse date and derive day of week and time
        // Klaviyo exports times in UTC; convert to US Eastern for display
        let sendDate: string | null = null;
        let sendTime: string | null = null;
        let dayOfWeek: string | null = sendWeekday ? cleanString(sendWeekday) : null;

        let parsedDate: Date | null = null;
        if (sentOnUTC) {
          parsedDate = parseDateAsUTC(sentOnUTC);
        } else if (sentOn) {
          parsedDate = parseDateAsUTC(sentOn);
        }

        if (parsedDate) {
          // Klaviyo exports are 5 hours behind actual send time; add 5h to correct
          const corrected = new Date(parsedDate.getTime() + 5 * 60 * 60 * 1000);
          const y = corrected.getUTCFullYear();
          const m = String(corrected.getUTCMonth() + 1).padStart(2, "0");
          const d = String(corrected.getUTCDate()).padStart(2, "0");
          const hh = String(corrected.getUTCHours()).padStart(2, "0");
          const mm = String(corrected.getUTCMinutes()).padStart(2, "0");
          const ss = String(corrected.getUTCSeconds()).padStart(2, "0");
          sendDate = `${y}-${m}-${d}`;
          sendTime = `${hh}:${mm}:${ss}`;
          if (!dayOfWeek) dayOfWeek = getDayOfWeek(corrected);
        }

        // Build segment name from sentTo and suppressedFrom
        const segmentParts: string[] = [];
        if (sentTo) segmentParts.push(sentTo);
        if (suppressedFrom) segmentParts.push(`Excluded: ${suppressedFrom}`);
        const segmentName = segmentParts.length > 0 ? segmentParts.join(" | ") : null;

        // Compute delivery rate from delivered/sent if not provided directly
        const computedDeliveryRate = deliveryRate ?? (sent && delivered ? delivered / sent : null);
        const bounceRate = computedDeliveryRate !== null ? 1 - computedDeliveryRate : null;

        // Create the campaign record
        const campaign: EmailCampaignInsert = {
          client_id: options.clientId,
          upload_id: options.uploadId,
          source: "klaviyo",
          campaign_id: cleanString(campaignIdValue),
          campaign_name: cleanString(campaignName),
          subject: cleanString(subject),
          preview_text: cleanString(previewText),
          send_date: sendDate,
          send_time: sendTime,
          day_of_week: dayOfWeek,
          segment_name: cleanString(segmentName),
          total_recipients: sent || 0,
          delivered: delivered || 0,
          delivery_rate: computedDeliveryRate,
          unique_opens: uniqueOpens || 0,
          open_rate: openRate,
          unique_clicks: uniqueClicks || 0,
          click_rate: ctr,
          click_to_open_rate: clickToOpenRate,
          unsubscribes: optOuts || 0,
          unsubscribe_rate: optOutRate,
          bounces: bounces || 0,
          bounce_rate: bounceRate,
          spam_complaints: spamComplaints || 0,
          spam_rate: spamRate,
          revenue: revenue,
          tags: tags.length > 0 ? tags : null,
        };

        data.push(campaign);

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
 * Validates that a CSV file appears to be a Klaviyo campaigns export
 * Checks for required columns
 * @param csvContent - The raw CSV content
 * @returns True if the file appears to be a valid Klaviyo campaigns export
 */
export function validateKlaviyoCampaignsCSV(csvContent: string): boolean {
  try {
    const records = parseCSVToRecords(csvContent);
    if (records.length === 0) {
      return false;
    }

    const firstRow = records[0];
    const headers = Object.keys(firstRow).map((h) => h.toLowerCase());

    // Check for key Klaviyo campaign columns (supports both old and new export formats)
    const hasName = headers.some((h) => h === "name" || h === "campaign name");
    const hasSubject = headers.some((h) => h === "subject");
    const hasSendDate = headers.some((h) => h.includes("sent on") || h === "send time");
    const hasRequiredColumns = hasName && hasSubject && hasSendDate;

    // Check for email-specific metrics
    const hasEmailMetrics =
      headers.some((h) => h.includes("open")) &&
      headers.some((h) => h.includes("click"));

    return hasRequiredColumns && hasEmailMetrics;
  } catch {
    return false;
  }
}
