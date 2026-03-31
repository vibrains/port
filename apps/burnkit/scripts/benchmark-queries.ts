/**
 * Benchmark + Golden-file harness for BurnKit dashboard queries.
 *
 * Usage:
 *   cd apps/burnkit
 *
 *   # Capture golden files (run once on known-good code):
 *   npx tsx -r tsconfig-paths/register scripts/benchmark-queries.ts --golden
 *
 *   # Benchmark only:
 *   npx tsx -r tsconfig-paths/register scripts/benchmark-queries.ts
 *
 *   # Benchmark + validate against golden files:
 *   npx tsx -r tsconfig-paths/register scripts/benchmark-queries.ts --validate
 *
 * Requires DATABASE_URL in env (or .env file).
 */

import 'dotenv/config'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import {
  getOverviewData,
  getClientData,
  getPersonData,
  getPersonClientData,
} from '@/actions/dashboard-data'
import type { FilterParams } from '@/types/dashboard'

// ============================================================================
// Config
// ============================================================================

const GOLDEN_DIR = join(__dirname, 'golden')
const RUNS_PER_SCENARIO = 5 // run each 5 times, drop best/worst, average middle 3

const SCENARIOS: { name: string; filters: FilterParams }[] = [
  {
    name: 'wide',
    filters: {
      dateStart: '2024-01-01',
      dateEnd: '2024-12-31',
    },
  },
  {
    name: 'narrow',
    filters: {
      dateStart: '2024-06-01',
      dateEnd: '2024-06-30',
    },
  },
  {
    name: 'external-only',
    filters: {
      dateStart: '2024-01-01',
      dateEnd: '2024-12-31',
      clientType: 'external',
    },
  },
]

const QUERIES = [
  { name: 'getOverviewData', fn: getOverviewData },
  { name: 'getClientData', fn: getClientData },
  { name: 'getPersonData', fn: getPersonData },
  { name: 'getPersonClientData', fn: getPersonClientData },
] as const

// ============================================================================
// Helpers
// ============================================================================

function goldenPath(scenario: string, query: string): string {
  return join(GOLDEN_DIR, `${scenario}_${query}.json`)
}

/** Round all numbers in a value to 4 decimal places for stable comparison */
function roundDeep(val: unknown): unknown {
  if (val === null || val === undefined) return val
  if (typeof val === 'number') return Math.round(val * 10000) / 10000
  if (Array.isArray(val)) return val.map(roundDeep)
  if (typeof val === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k] = roundDeep(v)
    }
    return out
  }
  return val
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

async function timeExecution(fn: () => Promise<unknown>): Promise<{ ms: number; result: unknown }> {
  const start = performance.now()
  const result = await fn()
  const ms = performance.now() - start
  return { ms, result }
}

/** Run fn RUNS_PER_SCENARIO times, drop best/worst, return trimmed mean */
async function benchmarkFn(fn: () => Promise<unknown>): Promise<{ avgMs: number; result: unknown }> {
  const timings: number[] = []
  let lastResult: unknown

  for (let i = 0; i < RUNS_PER_SCENARIO; i++) {
    const { ms, result } = await timeExecution(fn)
    timings.push(ms)
    lastResult = result
  }

  timings.sort((a, b) => a - b)
  // Drop best and worst, average the rest
  const middle = timings.slice(1, -1)
  const avgMs = middle.reduce((sum, t) => sum + t, 0) / middle.length

  return { avgMs, result: lastResult }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2)
  const captureGolden = args.includes('--golden')
  const validate = args.includes('--validate')

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required. Set it in .env or environment.')
    process.exit(1)
  }

  console.log(`\nBurnKit Query Benchmark`)
  console.log(`${'='.repeat(60)}`)
  console.log(`Scenarios: ${SCENARIOS.length} | Queries: ${QUERIES.length} | Runs/each: ${RUNS_PER_SCENARIO}`)
  if (captureGolden) console.log(`Mode: CAPTURE GOLDEN FILES`)
  else if (validate) console.log(`Mode: BENCHMARK + VALIDATE`)
  else console.log(`Mode: BENCHMARK ONLY`)
  console.log()

  // Warm-up: run one query to establish DB connection
  await getOverviewData({})

  const allTimings: number[] = []
  let validationPassed = true

  for (const scenario of SCENARIOS) {
    console.log(`--- Scenario: ${scenario.name} ---`)

    for (const query of QUERIES) {
      const { avgMs, result } = await benchmarkFn(() => query.fn(scenario.filters))
      allTimings.push(avgMs)

      const rounded = roundDeep(result)
      const tag = `${avgMs.toFixed(1)}ms`
      console.log(`  ${query.name.padEnd(25)} ${tag}`)

      if (captureGolden) {
        const path = goldenPath(scenario.name, query.name)
        writeFileSync(path, JSON.stringify(rounded, null, 2) + '\n')
      }

      if (validate) {
        const path = goldenPath(scenario.name, query.name)
        if (!existsSync(path)) {
          console.log(`    SKIP (no golden file)`)
          continue
        }
        const golden = JSON.parse(readFileSync(path, 'utf-8'))
        if (!deepEqual(rounded, golden)) {
          console.log(`    FAIL: output differs from golden file`)
          validationPassed = false
        } else {
          console.log(`    OK`)
        }
      }
    }
    console.log()
  }

  // Summary
  const totalAvg = allTimings.reduce((s, t) => s + t, 0) / allTimings.length
  const totalSum = allTimings.reduce((s, t) => s + t, 0)

  console.log(`${'='.repeat(60)}`)
  console.log(`SCALAR: ${totalAvg.toFixed(1)}ms (avg per query)`)
  console.log(`TOTAL:  ${totalSum.toFixed(1)}ms (sum of all ${allTimings.length} measurements)`)

  if (captureGolden) {
    console.log(`\nGolden files saved to ${GOLDEN_DIR}/`)
  }

  if (validate && !validationPassed) {
    console.error(`\nVALIDATION FAILED: outputs differ from golden files`)
    process.exit(1)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('Benchmark failed:', err)
  process.exit(1)
})
