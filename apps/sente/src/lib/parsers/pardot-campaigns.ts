/**
 * Pardot Email Campaigns CSV Parser
 * Parses Pardot email engagement report CSV files into EmailCampaignInsert records
 * @module lib/parsers/pardot-campaigns
 */

import { EmailCampaignInsert } from "@/types/database";
import {
  ParseResult,
  ParserOptions,
  parseNumber,
  parsePercent,
  cleanString,
  parseCSVToRecords,
  getColumnValue,
  createError,
  getDayOfWeek,
  parseDate,
  parseDateAsUTC,
} from "./index";

/**
 * Column mappings for the new simplified Pardot campaign CSV format (5 columns)
 */
const NEW_FORMAT_COLUMN_MAPPINGS = {
  name: ["Name"],
  sentOn: ["Sent On"],
  sent: ["Sent"],
  openRate: ["Open Rate"],
  totalClickThroughRate: ["Total Click-Through Rate"],
};

/**
 * Detects whether a CSV uses the new simplified Pardot format
 */
function isNewPardotFormat(headers: string[]): boolean {
  return (
    headers.some((h) => h.toLowerCase().includes("sent on")) &&
    headers.some((h) => h.toLowerCase().includes("total click-through rate"))
  );
}

/**
 * Column mappings for Pardot campaign CSV files
 * Maps normalized column names to possible variations in the CSV
 */
const COLUMN_MAPPINGS = {
  date: ["Date"],
  campaignMessageId: ["Campaign Message ID"],
  groupId: ["Group Id"],
  listSegment: ["List/Segment"],
  campaignMessageName: ["Campaign Message Name"],
  sendDate: ["Send Date"],
  sendTime: ["Send Time"],
  totalRecipients: ["Total Recipients"],
  openRate: ["Open Rate"],
  clickRate: ["Click Rate"],
  unsubscribeRate: ["Unsubscribe Rate"],
  uniqueOpens: ["Unique Opens"],
  uniqueClicks: ["Unique Clicks"],
  tags: ["Tags"],
  subject: ["Subject"],
  previewText: ["Preview Text"],
  list: ["List"],
  excludedList: ["Excluded List"],
  dayOfWeek: ["Day of Week"],
  campaignMessageChannel: ["Campaign Message Channel"],
};

/**
 * Parses a Pardot email campaigns CSV file
 * @param csvContent - The raw CSV content from the file
 * @param options - Parser options including clientId and uploadId
 * @returns ParseResult containing parsed EmailCampaignInsert records and any errors
 */
export function parsePardotCampaigns(
  csvContent: string,
  options: ParserOptions
): ParseResult<EmailCampaignInsert> {
  const errors: ParseResult<EmailCampaignInsert>["errors"] = [];
  const data: EmailCampaignInsert[] = [];

  try {
    const records = parseCSVToRecords(csvContent);
    const totalRows = records.length;

    const headers = records.length > 0 ? Object.keys(records[0]).map((h) => h.toLowerCase()) : [];
    const useNewFormat = isNewPardotFormat(headers);

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rowNumber = i + 2; // +2 because row 1 is header

      try {
        if (useNewFormat) {
          // New simplified 5-column Pardot format
          const name = getColumnValue(row, NEW_FORMAT_COLUMN_MAPPINGS.name);
          const sentOnStr = getColumnValue(row, NEW_FORMAT_COLUMN_MAPPINGS.sentOn);
          const sentStr = getColumnValue(row, NEW_FORMAT_COLUMN_MAPPINGS.sent);
          const openRateStr = getColumnValue(row, NEW_FORMAT_COLUMN_MAPPINGS.openRate);
          const clickRateStr = getColumnValue(row, NEW_FORMAT_COLUMN_MAPPINGS.totalClickThroughRate);

          let sendDate: string | null = null;
          let sendTime: string | null = null;
          let dayOfWeek: string | null = null;

          if (sentOnStr) {
            const parsedDate = parseDateAsUTC(sentOnStr);
            if (parsedDate) {
              const y = parsedDate.getUTCFullYear();
              const m = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
              const d = String(parsedDate.getUTCDate()).padStart(2, "0");
              sendDate = `${y}-${m}-${d}`;
              dayOfWeek = getDayOfWeek(parsedDate);

              // Extract time from the "Sent On" string (e.g. "1/29/26 11:00")
              const timePart = sentOnStr.trim().split(/\s+/).slice(1).join(" ");
              if (timePart) {
                const timeMatch = timePart.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                  sendTime = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}:00`;
                }
              }
            }
          }

          const totalRecipients = parseNumber(sentStr);
          const openRate = parsePercent(openRateStr);
          const clickRate = parsePercent(clickRateStr);

          let clickToOpenRate: number | null = null;
          if (openRate && openRate > 0 && clickRate !== null) {
            clickToOpenRate = clickRate / openRate;
          }

          const campaign: EmailCampaignInsert = {
            client_id: options.clientId,
            upload_id: options.uploadId,
            source: "pardot",
            campaign_id: null,
            campaign_name: cleanString(name),
            subject: null,
            preview_text: null,
            send_date: sendDate,
            send_time: sendTime,
            day_of_week: dayOfWeek,
            segment_name: null,
            total_recipients: totalRecipients || 0,
            delivered: totalRecipients || 0,
            delivery_rate: null,
            unique_opens: 0,
            open_rate: openRate,
            unique_clicks: 0,
            click_rate: clickRate,
            click_to_open_rate: clickToOpenRate,
            unsubscribes: 0,
            unsubscribe_rate: null,
            bounces: 0,
            bounce_rate: null,
            spam_complaints: 0,
            spam_rate: null,
            revenue: null,
            tags: null,
          };

          data.push(campaign);

          if (options.onProgress) {
            options.onProgress(Math.round(((i + 1) / totalRows) * 100));
          }
          continue;
        }

        // Extract values using column mappings
        const campaignMessageId = getColumnValue(row, COLUMN_MAPPINGS.campaignMessageId);
        const campaignMessageName = getColumnValue(row, COLUMN_MAPPINGS.campaignMessageName);
        const subject = getColumnValue(row, COLUMN_MAPPINGS.subject);
        const previewText = getColumnValue(row, COLUMN_MAPPINGS.previewText);
        const sendDateStr = getColumnValue(row, COLUMN_MAPPINGS.sendDate);
        const sendTimeStr = getColumnValue(row, COLUMN_MAPPINGS.sendTime);
        const listSegment = getColumnValue(row, COLUMN_MAPPINGS.listSegment);
        const list = getColumnValue(row, COLUMN_MAPPINGS.list);
        const excludedList = getColumnValue(row, COLUMN_MAPPINGS.excludedList);
        const dayOfWeekFromCSV = getColumnValue(row, COLUMN_MAPPINGS.dayOfWeek);

        // Parse numeric fields
        const totalRecipients = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.totalRecipients));
        const openRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.openRate));
        const clickRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.clickRate));
        const unsubscribeRate = parsePercent(getColumnValue(row, COLUMN_MAPPINGS.unsubscribeRate));
        const uniqueOpens = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.uniqueOpens));
        const uniqueClicks = parseNumber(getColumnValue(row, COLUMN_MAPPINGS.uniqueClicks));

        // Parse tags - Pardot uses "N/A" for no tags
        const tagsValue = getColumnValue(row, COLUMN_MAPPINGS.tags);
        const tags = tagsValue && tagsValue !== "N/A" ? [tagsValue] : null;

        // Parse date and time
        let sendDate: string | null = null;
        let sendTime: string | null = null;
        let dayOfWeek: string | null = null;

        if (sendDateStr) {
          const parsedDate = parseDate(sendDateStr);
          if (parsedDate) {
            const y = parsedDate.getFullYear();
            const m = String(parsedDate.getMonth() + 1).padStart(2, "0");
            const d = String(parsedDate.getDate()).padStart(2, "0");
            sendDate = `${y}-${m}-${d}`;
            dayOfWeek = dayOfWeekFromCSV || getDayOfWeek(parsedDate);
          }
        }

        if (sendTimeStr) {
          // Parse time from format like "07:00 AM"
          const timeMatch = sendTimeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1], 10);
            const minutes = timeMatch[2];
            const period = timeMatch[3].toUpperCase();
            if (period === "PM" && hours !== 12) hours += 12;
            if (period === "AM" && hours === 12) hours = 0;
            sendTime = `${hours.toString().padStart(2, "0")}:${minutes}:00`;
          }
        }

        // Build segment name from list and excluded list
        const segmentParts: string[] = [];
        if (listSegment) {
          segmentParts.push(listSegment);
        } else if (list) {
          segmentParts.push(list);
        }
        if (excludedList) {
          segmentParts.push(`Excluded: ${excludedList}`);
        }
        const segmentName = segmentParts.length > 0 ? segmentParts.join(" | ") : null;

        // Calculate derived metrics
        const delivered = totalRecipients || 0;
        const deliveryRate = totalRecipients && totalRecipients > 0
          ? delivered / totalRecipients
          : null;

        // Calculate click-to-open rate
        let clickToOpenRate: number | null = null;
        if (uniqueOpens && uniqueOpens > 0 && uniqueClicks !== null) {
          clickToOpenRate = uniqueClicks / uniqueOpens;
        } else if (openRate && openRate > 0 && clickRate) {
          clickToOpenRate = clickRate / openRate;
        }

        // Create the campaign record
        const campaign: EmailCampaignInsert = {
          client_id: options.clientId,
          upload_id: options.uploadId,
          source: "pardot",
          campaign_id: cleanString(campaignMessageId),
          campaign_name: cleanString(campaignMessageName),
          subject: cleanString(subject),
          preview_text: cleanString(previewText),
          send_date: sendDate,
          send_time: sendTime,
          day_of_week: dayOfWeek,
          segment_name: cleanString(segmentName),
          total_recipients: totalRecipients || 0,
          delivered: delivered,
          delivery_rate: deliveryRate,
          unique_opens: uniqueOpens || 0,
          open_rate: openRate,
          unique_clicks: uniqueClicks || 0,
          click_rate: clickRate,
          click_to_open_rate: clickToOpenRate,
          unsubscribes: 0, // Not directly available in Pardot export
          unsubscribe_rate: unsubscribeRate,
          bounces: 0, // Not directly available
          bounce_rate: null,
          spam_complaints: 0, // Not directly available
          spam_rate: null,
          revenue: null, // Not in Pardot export
          tags: tags,
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
 * Validates that a CSV file appears to be a Pardot campaigns export
 * Checks for required columns
 * @param csvContent - The raw CSV content
 * @returns True if the file appears to be a valid Pardot campaigns export
 */
export function validatePardotCampaignsCSV(csvContent: string): boolean {
  try {
    const records = parseCSVToRecords(csvContent);
    if (records.length === 0) {
      return false;
    }

    const firstRow = records[0];
    const headers = Object.keys(firstRow).map((h) => h.toLowerCase());

    // Check for key Pardot campaign columns
    const requiredColumns = ["campaign message", "subject"];
    const hasRequiredColumns = requiredColumns.every((col) =>
      headers.some((h) => h.includes(col.toLowerCase()))
    );

    // Check for Pardot-specific columns
    const hasPardotColumns =
      headers.some((h) => h.includes("list/segment") || h.includes("group id"));

    const isOldFormat = hasRequiredColumns && hasPardotColumns;

    // New simplified 5-column format check
    const isNewFormat = isNewPardotFormat(headers);

    return isOldFormat || isNewFormat;
  } catch {
    return false;
  }
}
