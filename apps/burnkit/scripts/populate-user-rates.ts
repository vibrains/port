#!/usr/bin/env tsx
/**
 * Script to populate user_rate on users from Teamwork API v3
 *
 * This script:
 * 1. Fetches all users from the database (active only: deleted_at = null)
 * 2. Fetches all users from Teamwork API v3
 * 3. Matches users by email (case-insensitive)
 * 4. Updates matched users with their user_rate from Teamwork
 *
 * Environment variables:
 *   TEAMWORK_API_KEY           - Required
 *   TEAMWORK_SITE_NAME         - Required (e.g. "nearanddear")
 *
 *   DRY_RUN=true               - Preview changes without writing to DB
 *   CONFIRM_WRITE=true         - Required to write when DRY_RUN is false (safety latch)
 *   OVERWRITE_EXISTING=true    - Overwrite users that already have a user_rate
 *   ALLOW_ZERO_RATES=true      - Allow zero rates to be saved
 *   PREFERRED_CURRENCY_ID=1    - Currency ID to use from userRates object (fallback)
 *   MIN_RATE_DOLLARS=10        - Sanity min (default 10)
 *   MAX_RATE_DOLLARS=2000      - Sanity max (default 2000)
 *
 * Usage:
 *   DRY_RUN=true npx tsx scripts/populate-user-rates.ts
 *   CONFIRM_WRITE=true npx tsx scripts/populate-user-rates.ts
 *   CONFIRM_WRITE=true OVERWRITE_EXISTING=true npx tsx scripts/populate-user-rates.ts
 */

import { prisma } from "../src/lib/db";

const TEAMWORK_API_KEY = process.env.TEAMWORK_API_KEY;
const TEAMWORK_SITE_NAME = process.env.TEAMWORK_SITE_NAME;

// Flags
const DRY_RUN = process.env.DRY_RUN === "true";
const CONFIRM_WRITE = process.env.CONFIRM_WRITE === "true";
const OVERWRITE_EXISTING = process.env.OVERWRITE_EXISTING === "true";
const ALLOW_ZERO_RATES = process.env.ALLOW_ZERO_RATES === "true";
const PREFERRED_CURRENCY_ID = process.env.PREFERRED_CURRENCY_ID ?? "1";

// Sanity bounds (in cents)
const MIN_RATE_CENTS = Math.round(
  (toNumber(process.env.MIN_RATE_DOLLARS) ?? 10) * 100
);
const MAX_RATE_CENTS = Math.round(
  (toNumber(process.env.MAX_RATE_DOLLARS) ?? 2000) * 100
);

if (!TEAMWORK_API_KEY || !TEAMWORK_SITE_NAME) {
  console.error("❌ Missing required environment variables:");
  console.error(
    "   TEAMWORK_API_KEY and TEAMWORK_SITE_NAME must be set in .env"
  );
  process.exit(1);
}

const BASE_URL = `https://${TEAMWORK_SITE_NAME}.teamwork.com`;

interface TeamworkPerson {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  userRate?: number | string | null;
  userRates?: Record<string, { amount?: number | string | null }>;
}

/**
 * Convert a value to number, handling strings and guarding NaN/Infinity.
 */
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Extract rate in cents from Teamwork user data.
 * Preference:
 *  - userRate (commonly cents in v3 payloads)
 *  - userRates[currencyId].amount (commonly dollars) -> cents
 */
function extractRateCents(
  u: TeamworkPerson,
  currencyId: string
): number | null {
  const userRateNum = toNumber(u.userRate);
  if (userRateNum !== null) return Math.round(userRateNum);

  const dollars = toNumber(u.userRates?.[currencyId]?.amount);
  if (dollars !== null) return Math.round(dollars * 100);

  return null;
}

function isRateWithinBounds(rateCents: number): boolean {
  return rateCents >= MIN_RATE_CENTS && rateCents <= MAX_RATE_CENTS;
}

async function makeRequest<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(endpoint, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }

  // Teamwork uses Basic Auth with API key as username and 'X' as password
  const authString = Buffer.from(`${TEAMWORK_API_KEY}:X`).toString("base64");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${authString}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  return (await response.json()) as T;
}

async function fetchAllTeamworkUsers(): Promise<{
  users: TeamworkPerson[];
  skippedNoEmail: number;
}> {
  const allUsers: TeamworkPerson[] = [];
  let skippedNoEmail = 0;

  let page = 1;
  const pageSize = 100;

  while (true) {
    console.log(`Fetching Teamwork users page ${page}...`);

    const response = await makeRequest<{ people: TeamworkPerson[] }>(
      "/projects/api/v3/people.json",
      { page: String(page), pageSize: String(pageSize) }
    );

    const people = response.people ?? [];
    if (people.length === 0) break;

    for (const u of people) {
      const email = u.email?.trim();
      if (!email) {
        skippedNoEmail++;
        continue;
      }
      allUsers.push(u);
    }

    if (people.length < pageSize) break;

    page++;
    await new Promise((r) => setTimeout(r, 100)); // be nice to the API
  }

  return { users: allUsers, skippedNoEmail };
}

function buildTeamworkEmailMap(users: TeamworkPerson[]) {
  const map = new Map<string, TeamworkPerson>();
  const counts = new Map<string, number>();

  for (const u of users) {
    const email = u.email?.trim();
    if (!email) continue;

    const key = email.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);

    // Note: last one wins; we also surface duplicates so you can investigate
    map.set(key, u);
  }

  const duplicates: { email: string; count: number }[] = [];
  for (const [email, count] of counts.entries()) {
    if (count > 1) duplicates.push({ email, count });
  }

  duplicates.sort((a, b) => b.count - a.count);

  return { map, duplicates };
}

function centsToDollars(rateCents: number): string {
  return (rateCents / 100).toFixed(2);
}

async function populateUserRates() {
  const mode = DRY_RUN ? "🔍 DRY RUN" : "🚀 LIVE RUN";
  console.log(`${mode}: Populating user_rate from Teamwork API v3`);
  console.log("=".repeat(80));
  console.log("Settings:");
  console.log(`  DRY_RUN: ${DRY_RUN}`);
  console.log(`  CONFIRM_WRITE: ${CONFIRM_WRITE}`);
  console.log(`  OVERWRITE_EXISTING: ${OVERWRITE_EXISTING}`);
  console.log(`  ALLOW_ZERO_RATES: ${ALLOW_ZERO_RATES}`);
  console.log(`  PREFERRED_CURRENCY_ID: ${PREFERRED_CURRENCY_ID}`);
  console.log(`  MIN_RATE: $${centsToDollars(MIN_RATE_CENTS)}/hour`);
  console.log(`  MAX_RATE: $${centsToDollars(MAX_RATE_CENTS)}/hour`);
  console.log("=".repeat(80));
  console.log("");

  try {
    // 1) DB users (active only)
    const dbUsers = await prisma.user.findMany({
      where: { deleted_at: null },
      select: { id: true, email: true, name: true, user_rate: true },
    });

    console.log(`Found ${dbUsers.length} active users in database`);

    // 2) Teamwork users
    console.log("\nFetching users from Teamwork API v3...");
    const { users: teamworkUsers, skippedNoEmail } =
      await fetchAllTeamworkUsers();
    console.log(`Found ${teamworkUsers.length} Teamwork users (with email)`);
    if (skippedNoEmail > 0)
      console.log(`Skipped ${skippedNoEmail} Teamwork users with no email`);

    // 3) Map by email + detect duplicates
    const { map: teamworkByEmail, duplicates } =
      buildTeamworkEmailMap(teamworkUsers);
    if (duplicates.length > 0) {
      console.log(
        `\n⚠️ Duplicate Teamwork emails detected: ${duplicates.length}`
      );
      duplicates
        .slice(0, 10)
        .forEach((d) => console.log(`  ${d.email} (${d.count} records)`));
      if (duplicates.length > 10)
        console.log(`  ... and ${duplicates.length - 10} more`);
    }

    // 4) Matching + buckets
    const updates: Array<{
      userId: string;
      name: string;
      email: string;
      nextRateCents: number;
      prevRateCents: number | null;
    }> = [];

    const noChangeNeeded: Array<{
      userId: string;
      name: string;
      email: string;
      rateCents: number;
    }> = [];

    const alreadyHasRateSkipped: Array<{
      userId: string;
      name: string;
      email: string;
      rateCents: number;
    }> = [];

    const unmatched: Array<{ userId: string; name: string; email: string }> =
      [];

    const skippedInvalid: Array<{
      name: string;
      email: string;
      reason: string;
    }> = [];
    const skippedZero: Array<{ name: string; email: string }> = [];
    const skippedBounds: Array<{
      name: string;
      email: string;
      rateCents: number;
    }> = [];

    for (const dbUser of dbUsers) {
      const emailKey = dbUser.email.toLowerCase();
      const teamworkUser = teamworkByEmail.get(emailKey);

      if (!teamworkUser) {
        unmatched.push({
          userId: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
        });
        continue;
      }

      const rateCents = extractRateCents(teamworkUser, PREFERRED_CURRENCY_ID);

      if (rateCents == null) {
        skippedInvalid.push({
          name: dbUser.name,
          email: dbUser.email,
          reason: "Invalid rate (null/NaN/undefined)",
        });
        continue;
      }

      if (rateCents === 0 && !ALLOW_ZERO_RATES) {
        skippedZero.push({ name: dbUser.name, email: dbUser.email });
        continue;
      }

      if (!isRateWithinBounds(rateCents)) {
        skippedBounds.push({
          name: dbUser.name,
          email: dbUser.email,
          rateCents,
        });
        continue;
      }

      const existing = dbUser.user_rate ?? null;

      if (existing !== null && !OVERWRITE_EXISTING) {
        alreadyHasRateSkipped.push({
          userId: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          rateCents: existing,
        });
        continue;
      }

      if (existing !== null && existing === rateCents) {
        noChangeNeeded.push({
          userId: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          rateCents: existing,
        });
        continue;
      }

      updates.push({
        userId: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        nextRateCents: rateCents,
        prevRateCents: existing,
      });
    }

    // 5) Summary
    console.log("\n" + "-".repeat(80));
    console.log("📊 MATCHING RESULTS");
    console.log("-".repeat(80));
    console.log(`Users to update: ${updates.length}`);
    console.log(`No change needed (same rate): ${noChangeNeeded.length}`);
    console.log(`Already have rate (skipped): ${alreadyHasRateSkipped.length}`);
    console.log(`Unmatched: ${unmatched.length}`);
    console.log(`Skipped (invalid rate): ${skippedInvalid.length}`);
    console.log(`Skipped (zero rate): ${skippedZero.length}`);
    console.log(`Skipped (out of bounds): ${skippedBounds.length}`);

    if (updates.length > 0) {
      updates.sort((a, b) => b.nextRateCents - a.nextRateCents);

      const rates = updates
        .map((u) => u.nextRateCents)
        .slice()
        .sort((a, b) => a - b);
      const avg = rates.reduce((s, x) => s + x, 0) / rates.length;

      console.log("\nRate sanity check (updates):");
      console.log(
        `  min: ${rates[0]} cents ($${centsToDollars(rates[0])}/hour)`
      );
      console.log(
        `  max: ${rates[rates.length - 1]} cents ($${centsToDollars(rates[rates.length - 1])}/hour)`
      );
      console.log(
        `  avg: ${Math.round(avg)} cents ($${centsToDollars(Math.round(avg))}/hour)`
      );

      console.log("\nUsers to update:");
      updates.forEach((u, i) => {
        const next = `$${centsToDollars(u.nextRateCents)}/hour`;
        const prev =
          u.prevRateCents === null
            ? "(new)"
            : `(was $${centsToDollars(u.prevRateCents)}/hour)`;
        console.log(`  ${i + 1}. ${u.name} (${u.email}) → ${next} ${prev}`);
      });
    }

    if (skippedBounds.length > 0) {
      console.log("\nSkipped (out of bounds):");
      skippedBounds.slice(0, 25).forEach((u, i) => {
        console.log(
          `  ${i + 1}. ${u.name} (${u.email}) - $${centsToDollars(u.rateCents)}/hour (outside $${centsToDollars(
            MIN_RATE_CENTS
          )}-$${centsToDollars(MAX_RATE_CENTS)})`
        );
      });
      if (skippedBounds.length > 25)
        console.log(`  ... and ${skippedBounds.length - 25} more`);
    }

    if (skippedInvalid.length > 0) {
      console.log("\nSkipped (invalid):");
      skippedInvalid
        .slice(0, 25)
        .forEach((u, i) =>
          console.log(`  ${i + 1}. ${u.name} (${u.email}) - ${u.reason}`)
        );
      if (skippedInvalid.length > 25)
        console.log(`  ... and ${skippedInvalid.length - 25} more`);
    }

    if (skippedZero.length > 0) {
      console.log("\nSkipped (zero rates):");
      skippedZero
        .slice(0, 25)
        .forEach((u, i) => console.log(`  ${i + 1}. ${u.name} (${u.email})`));
      if (skippedZero.length > 25)
        console.log(`  ... and ${skippedZero.length - 25} more`);
    }

    if (unmatched.length > 0) {
      console.log("\nUnmatched (no Teamwork email match):");
      unmatched
        .slice(0, 25)
        .forEach((u, i) => console.log(`  ${i + 1}. ${u.name} (${u.email})`));
      if (unmatched.length > 25)
        console.log(`  ... and ${unmatched.length - 25} more`);
    }

    // 6) DRY RUN guard
    if (DRY_RUN) {
      console.log("\n" + "=".repeat(80));
      console.log("[DRY RUN] No changes written to database.");
      console.log("=".repeat(80));
      console.log("\nTo write to the database, run:");
      console.log(
        "  CONFIRM_WRITE=true npx tsx scripts/populate-user-rates.ts"
      );
      return;
    }

    // 7) Safety latch
    if (!CONFIRM_WRITE) {
      console.log(
        "\n🚫 LIVE RUN blocked. Set CONFIRM_WRITE=true to allow DB writes."
      );
      console.log(
        "Example: CONFIRM_WRITE=true npx tsx scripts/populate-user-rates.ts"
      );
      return;
    }

    if (updates.length === 0) {
      console.log("\n✅ No users need updating!");
      return;
    }

    // 8) Write updates in a single transaction (fast + consistent)
    console.log("\n" + "=".repeat(80));
    console.log("Writing to database...");
    console.log("=".repeat(80));

    const ops = updates.map((u) =>
      prisma.user.update({
        where: { id: u.userId },
        data: { user_rate: u.nextRateCents },
      })
    );

    const results = await prisma.$transaction(ops);
    console.log(`✅ Successfully updated ${results.length} users`);

    // 9) Final counts (active only)
    const usersWithRate = await prisma.user.count({
      where: { user_rate: { not: null }, deleted_at: null },
    });
    const usersWithoutRate = await prisma.user.count({
      where: { user_rate: null, deleted_at: null },
    });

    console.log("\n" + "-".repeat(80));
    console.log("📌 DATABASE STATE (active users only)");
    console.log("-".repeat(80));
    console.log(`Users with user_rate: ${usersWithRate}`);
    console.log(`Users without user_rate: ${usersWithoutRate}`);
  } catch (error) {
    console.error("❌ Error populating user rates:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

populateUserRates();
