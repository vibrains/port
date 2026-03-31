/**
 * Insights database queries (MOCK)
 * @module lib/db/queries/insights
 */

import type { Insight } from "@/types/database";
import { mockInsights } from "@/lib/mock-data";

// In-memory mutable copy
const insights = [...mockInsights];

export async function getInsights(
  _clientId: string,
  channel?: string
): Promise<Insight[]> {
  let data = [...insights];
  if (channel) data = data.filter((i) => i.channel === channel);
  return data.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getInsightById(
  _clientId: string,
  id: string
): Promise<Insight | null> {
  return insights.find((i) => i.id === id) ?? null;
}

export async function createInsight(data: {
  clientId: string;
  channel: string | null;
  title: string;
  content: string;
  generatedBy?: string;
  model?: string;
  promptContext?: Record<string, unknown>;
  createdAt?: string;
}): Promise<Insight> {
  const insight: Insight = {
    id: crypto.randomUUID(),
    client_id: data.clientId,
    channel: data.channel,
    title: data.title,
    content: data.content,
    generated_by: data.generatedBy ?? "mock-llm",
    model: data.model ?? "mock-v1",
    prompt_context: data.promptContext ?? {},
    created_at: data.createdAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  insights.unshift(insight);
  return insight;
}

export async function updateInsight(
  _clientId: string,
  id: string,
  data: { title?: string; content?: string; promptContext?: Record<string, unknown> }
): Promise<Insight> {
  const idx = insights.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Insight not found");
  if (data.title !== undefined) insights[idx].title = data.title;
  if (data.content !== undefined) insights[idx].content = data.content;
  if (data.promptContext !== undefined) insights[idx].prompt_context = data.promptContext;
  insights[idx].updated_at = new Date().toISOString();
  return { ...insights[idx] };
}

export async function deleteInsight(_clientId: string, id: string): Promise<void> {
  const idx = insights.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Insight not found");
  insights.splice(idx, 1);
}

export async function deleteAllInsights(_clientId: string): Promise<void> {
  insights.length = 0;
}

export async function deleteInsightsByMonth(_clientId: string, month: string): Promise<number> {
  const toRemove = insights.filter((i) => {
    const d = new Date(i.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return key === month;
  });
  for (const i of toRemove) {
    const idx = insights.indexOf(i);
    if (idx !== -1) insights.splice(idx, 1);
  }
  return toRemove.length;
}

export async function deleteInsightsByGroupId(_clientId: string, groupId: string): Promise<number> {
  const toRemove = insights.filter((i) => (i.prompt_context as Record<string, unknown>)?.groupId === groupId);
  for (const i of toRemove) {
    const idx = insights.indexOf(i);
    if (idx !== -1) insights.splice(idx, 1);
  }
  return toRemove.length;
}

export async function updateSortOrders(
  _clientId: string,
  orders: { id: string; sortOrder: number }[]
): Promise<void> {
  for (const { id, sortOrder } of orders) {
    const insight = insights.find((i) => i.id === id);
    if (insight) {
      insight.prompt_context = { ...insight.prompt_context, sortOrder };
    }
  }
}

export async function getMostRecentDataMonth(
  _clientId: string
): Promise<{ start: Date; end: Date }> {
  // Return March 2026 as most recent data month
  return {
    start: new Date(2026, 2, 1),
    end: new Date(2026, 2, 31),
  };
}
