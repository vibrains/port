#!/usr/bin/env tsx
/**
 * Script to update google_id from manual-xxxx to teamwork-{id}
 *
 * This script:
 * 1. Fetches all users from the database with google_id starting with 'manual-'
 * 2. Fetches all users from Teamwork API v3
 * 3. Matches users by email (case-insensitive)
 * 4. Updates matched users' google_id to teamwork-{teamworkId}
 *
 * Environment variables:
 *   TEAMWORK_API_KEY           - Required
 *   TEAMWORK_SITE_NAME         - Required (e.g. "nearanddear")
 *
 *   DRY_RUN=true               - Preview changes without writing to DB
 *   CONFIRM_WRITE=true         - Required to write when DRY_RUN is false (safety latch)
 *
 * Usage:
 *   DRY_RUN=true npx tsx scripts/update-google-ids.ts
 *   CONFIRM_WRITE=true npx tsx scripts/update-google-ids.ts
 */

import "dotenv/config";
import { prisma } from "../src/lib/db";

const TEAMWORK_API_KEY = process.env.TEAMWORK_API_KEY;
const TEAMWORK_SITE_NAME = process.env.TEAMWORK_SITE_NAME;

// Flags
const DRY_RUN = process.env.DRY_RUN === "true";
const CONFIRM_WRITE = process.env.CONFIRM_WRITE === "true";

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

async function updateGoogleIds() {
  const mode = DRY_RUN ? "🔍 DRY RUN" : "🚀 LIVE RUN";
  console.log(`${mode}: Updating google_id from manual-xxxx to teamwork-{id}`);
  console.log("=".repeat(80));
  console.log("Settings:");
  console.log(`  DRY_RUN: ${DRY_RUN}`);
  console.log(`  CONFIRM_WRITE: ${CONFIRM_WRITE}`);
  console.log("=".repeat(80));
  console.log("");

  if (!DRY_RUN && !CONFIRM_WRITE) {
    console.error(
      "❌ Safety check: CONFIRM_WRITE=true is required for live runs."
    );
    console.error("   Set DRY_RUN=true to preview changes without writing.");
    process.exit(1);
  }

  try {
    // 1) DB users with manual- google_id
    const dbUsers = await prisma.user.findMany({
      where: {
        google_id: {
          startsWith: "manual-",
        },
        deleted_at: null,
      },
      select: { id: true, email: true, name: true, google_id: true },
    });

    console.log(
      `Found ${dbUsers.length} users with manual- google_id in database`
    );

    if (dbUsers.length === 0) {
      console.log("\n✅ No users to update. Exiting.");
      return;
    }

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
      oldGoogleId: string;
      newGoogleId: string;
      teamworkId: number;
    }> = [];

    const unmatched: Array<{ userId: string; name: string; email: string }> =
      [];

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

      const newGoogleId = `teamwork-${teamworkUser.id}`;

      updates.push({
        userId: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        oldGoogleId: dbUser.google_id,
        newGoogleId,
        teamworkId: teamworkUser.id,
      });
    }

    // 5) Summary
    console.log("\n" + "=".repeat(80));
    console.log("SUMMARY");
    console.log("=".repeat(80));
    console.log(`Users to update:      ${updates.length}`);
    console.log(`Unmatched users:      ${unmatched.length}`);
    console.log("");

    if (updates.length > 0) {
      console.log("📋 Planned updates:");
      console.log("-".repeat(80));
      for (const u of updates) {
        console.log(`  ${u.name} (${u.email})`);
        console.log(`    ${u.oldGoogleId} → ${u.newGoogleId}`);
      }
      console.log("-".repeat(80));
    }

    if (unmatched.length > 0) {
      console.log(
        "\n⚠️ Unmatched users (no Teamwork user found with same email):"
      );
      console.log("-".repeat(80));
      for (const u of unmatched) {
        console.log(`  ${u.name} (${u.email})`);
      }
      console.log("-".repeat(80));
    }

    // 6) Execute updates
    if (updates.length > 0) {
      if (DRY_RUN) {
        console.log("\n🔍 DRY RUN: No changes were made.");
        console.log(
          "   Set DRY_RUN=false and CONFIRM_WRITE=true to apply changes."
        );
      } else {
        console.log("\n🚀 Applying updates...");
        let successCount = 0;
        let errorCount = 0;

        for (const u of updates) {
          try {
            await prisma.user.update({
              where: { id: u.userId },
              data: { google_id: u.newGoogleId },
            });
            console.log(
              `  ✅ Updated ${u.name}: ${u.oldGoogleId} → ${u.newGoogleId}`
            );
            successCount++;
          } catch (error) {
            console.error(`  ❌ Failed to update ${u.name}:`, error);
            errorCount++;
          }
        }

        console.log("\n" + "=".repeat(80));
        console.log("RESULTS");
        console.log("=".repeat(80));
        console.log(`Successfully updated: ${successCount}`);
        console.log(`Failed:               ${errorCount}`);
      }
    }

    console.log("\n✅ Done!");
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateGoogleIds();
