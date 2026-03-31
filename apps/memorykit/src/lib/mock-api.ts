// ---------------------------------------------------------------------------
// MemoryKit Demo – Mock API
// Simulates MCP tool calls with realistic delays. All data comes from
// mock-data.ts — no network requests are made.
// ---------------------------------------------------------------------------

import {
  CLIENTS,
  AGENCY_CONTEXT,
  INDUSTRY_CONTEXT,
  SEARCH_RESULTS,
  PENDING_MEMORIES,
  type SearchResult,
  type ClientContext,
} from './mock-data'

// ---- Helpers --------------------------------------------------------------

/** Simulate network latency (300-800 ms). */
function delay(): Promise<void> {
  const ms = 300 + Math.random() * 500
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Normalize a string for fuzzy matching. */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, ' ')
}

/** Format a ClientContext into a Markdown string (mirrors the real MCP output). */
function formatClientContext(
  ctx: ClientContext,
  options?: { includeMeetings?: boolean; includeDecisions?: boolean },
): string {
  const includeMeetings = options?.includeMeetings ?? true
  const includeDecisions = options?.includeDecisions ?? true

  let md = `# ${ctx.name}\n\n`
  md += `## Brand Voice\n\n${ctx.brandVoice}\n\n`
  md += `## Positioning\n\n${ctx.positioning}\n\n`
  md += `## Constraints\n\n${ctx.constraints}\n\n`

  if (includeDecisions && ctx.decisions.length > 0) {
    md += `## Decision Log\n\n`
    for (const d of ctx.decisions) {
      md += `### ${d.title}\n`
      md += `**Date**: ${d.date}  \n`
      md += `**Source**: ${d.provenance}\n\n`
      md += `${d.content}\n\n`
    }
  }

  if (includeMeetings && ctx.meetings.length > 0) {
    md += `## Recent Meetings\n\n`
    for (const m of ctx.meetings) {
      md += `### ${m.title}\n`
      md += `**Date**: ${m.date}\n\n`
      md += `${m.summary}\n\n`
    }
  }

  return md.trim()
}

// ---- Public API -----------------------------------------------------------

/**
 * Retrieve the full context bundle for a specific client.
 */
export async function getClientContext(
  clientName: string,
  options?: { includeMeetings?: boolean; includeDecisions?: boolean },
): Promise<string> {
  await delay()

  const ctx = CLIENTS[clientName]
  if (!ctx) {
    return `Error: client "${clientName}" not found. Available clients: ${Object.keys(CLIENTS).join(', ')}.`
  }

  return formatClientContext(ctx, options)
}

/**
 * Retrieve Near&Dear agency-level context.
 */
export async function getAgencyContext(sections?: string[]): Promise<string> {
  await delay()

  if (!sections || sections.length === 0) {
    return AGENCY_CONTEXT
  }

  // Parse the full context into sections and return only the requested ones.
  const sectionMap: Record<string, RegExp> = {
    voice: /## Voice & Tone[\s\S]*?(?=\n## |$)/,
    process: /## Process Playbooks[\s\S]*?(?=\n## |$)/,
    team: /## Team Structure[\s\S]*?(?=\n## |$)/,
    standards: /## Cross-Client Standards[\s\S]*?(?=\n## |$)/,
  }

  let result = '# Near&Dear — Agency Context\n\n'
  for (const s of sections) {
    const key = s.toLowerCase()
    const regex = sectionMap[key]
    if (regex) {
      const match = AGENCY_CONTEXT.match(regex)
      if (match) {
        result += match[0].trim() + '\n\n'
      }
    }
  }

  return result.trim() || 'No matching sections found. Valid sections: voice, process, team, standards.'
}

/**
 * Retrieve shared industry knowledge for the human-vitality vertical.
 */
export async function getIndustryContext(): Promise<string> {
  await delay()
  return INDUSTRY_CONTEXT
}

/**
 * Full-text search across all stored memories.
 */
export async function searchContext(
  query: string,
  opts?: {
    client?: string
    type?: string
    sinceDays?: number
    limit?: number
  },
): Promise<SearchResult[]> {
  await delay()

  const limit = opts?.limit ?? 50
  const queryWords = norm(query).split(/\s+/).filter(Boolean)

  let results = SEARCH_RESULTS.filter((r) => {
    // Client filter
    if (opts?.client && r.client !== opts.client) return false

    // Type filter
    if (opts?.type && r.type !== opts.type) return false

    // Date filter
    if (opts?.sinceDays) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - opts.sinceDays)
      if (new Date(r.created) < cutoff) return false
    }

    // Query matching — at least one query word must appear in title, excerpt, or path
    if (queryWords.length === 0) return true
    const haystack = norm(`${r.title} ${r.excerpt} ${r.path}`)
    return queryWords.some((w) => haystack.includes(w))
  })

  // Re-rank: results with more matching words score higher
  results = results
    .map((r) => {
      const haystack = norm(`${r.title} ${r.excerpt} ${r.path}`)
      const matchCount = queryWords.filter((w) => haystack.includes(w)).length
      return { ...r, rank: matchCount }
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, limit)

  // Normalize ranks to 1-based sequential
  return results.map((r, i) => ({ ...r, rank: i + 1 }))
}

/**
 * Submit a single new memory entry for human review.
 */
export async function suggestMemory(input: {
  client_name: string
  title: string
  content: string
  type: string
  provenance: string
}): Promise<{ id: string; status: string; message: string }> {
  await delay()

  const id = `mem_${Date.now().toString(36).toUpperCase()}`
  return {
    id,
    status: 'pending',
    message: `Memory "${input.title}" submitted for review. It will appear in the approval queue for the ${input.client_name} account.`,
  }
}

/**
 * Batch-submit multiple memory entries extracted from a single source.
 */
export async function extractMemory(input: {
  client_name: string
  items: Array<{
    title: string
    content: string
    type: string
    provenance: string
    confidence: string
  }>
}): Promise<{ submitted: string[]; count: number }> {
  await delay()

  const submitted = input.items.map(
    (_, i) => `mem_${Date.now().toString(36).toUpperCase()}_${i}`,
  )

  return {
    submitted,
    count: input.items.length,
  }
}

/**
 * Retrieve all pending memory entries (used by the approval queue UI).
 * Not an MCP tool — this is a helper for the demo's admin view.
 */
export async function getPendingMemories() {
  await delay()
  return PENDING_MEMORIES
}
