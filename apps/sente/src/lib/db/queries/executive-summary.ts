/**
 * Executive Summary database queries (MOCK)
 * @module lib/db/queries/executive-summary
 */

import { mockExecutiveSummaries } from "@/lib/mock-data";

// In-memory store for edits during the session
const overrides = new Map<string, string>();

function key(channel: string, month: string): string {
  return `${channel}::${month}`;
}

export async function getExecutiveSummary(
  _clientId: string,
  channel: string,
  month: string
): Promise<string> {
  const k = key(channel, month);
  if (overrides.has(k)) return overrides.get(k)!;
  return mockExecutiveSummaries[channel]?.[month] ?? "";
}

export async function upsertExecutiveSummary(
  _clientId: string,
  channel: string,
  month: string,
  content: string
): Promise<void> {
  overrides.set(key(channel, month), content);
}
