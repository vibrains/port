#!/usr/bin/env tsx
/**
 * DRY RUN: Preview which users will get user_rate from Teamwork API v3
 *
 * This script:
 * 1. Fetches all users from the database
 * 2. Fetches all users from Teamwork API v3
 * 3. Matches users by email (case-insensitive)
 * 4. Shows which users would be updated with their user_rate
 *
 * Usage: npx tsx scripts/dry-run-user-rates.ts
 */

import { prisma } from "../src/lib/db";

const TEAMWORK_API_KEY = process.env.TEAMWORK_API_KEY;
const TEAMWORK_SITE_NAME = process.env.TEAMWORK_SITE_NAME;

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
  email: string;
  userRate: number;
}

async function makeRequest<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(endpoint, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

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

  const data = await response.json();
  return data as T;
}

async function fetchAllTeamworkUsers(): Promise<TeamworkPerson[]> {
  const allUsers: TeamworkPerson[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    console.log(`Fetching page ${page}...`);
    const response = await makeRequest<{ people: TeamworkPerson[] }>(
      "/projects/api/v3/people.json",
      {
        page: String(page),
        pageSize: String(pageSize),
      }
    );

    if (!response.people || response.people.length === 0) {
      break;
    }

    allUsers.push(...response.people);

    if (response.people.length < pageSize) {
      break;
    }

    page++;

    // Rate limiting - be nice to the API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allUsers;
}

async function dryRunUserRates() {
  console.log("🔍 DRY RUN: Preview user_rate updates\n");
  console.log("=".repeat(70));

  try {
    // 1. Fetch all users from database
    const dbUsers = await prisma.user.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`Found ${dbUsers.length} users in database\n`);

    // 2. Fetch all users from Teamwork API v3
    console.log("Fetching users from Teamwork API v3...");
    const teamworkUsers = await fetchAllTeamworkUsers();
    console.log(`Found ${teamworkUsers.length} users in Teamwork\n`);

    // 3. Create email -> teamwork user map (case-insensitive)
    const teamworkByEmail = new Map(
      teamworkUsers.map((u) => [u.email.toLowerCase(), u])
    );

    // 4. Match and categorize
    const wouldUpdate: {
      name: string;
      email: string;
      userRate: number;
      rateDollars: string;
    }[] = [];
    const unmatched: { name: string; email: string }[] = [];

    for (const dbUser of dbUsers) {
      const teamworkUser = teamworkByEmail.get(dbUser.email.toLowerCase());

      if (teamworkUser) {
        wouldUpdate.push({
          name: dbUser.name,
          email: dbUser.email,
          userRate: teamworkUser.userRate,
          rateDollars: (teamworkUser.userRate / 100).toFixed(2),
        });
      } else {
        unmatched.push({
          name: dbUser.name,
          email: dbUser.email,
        });
      }
    }

    // 5. Display results
    console.log("\n" + "=".repeat(70));
    console.log("📊 SUMMARY");
    console.log("=".repeat(70));
    console.log(`✅ Would update: ${wouldUpdate.length} users`);
    console.log(`❌ Unmatched: ${unmatched.length} users`);
    console.log(`📈 Total database users: ${dbUsers.length}`);
    console.log(`📈 Total Teamwork users: ${teamworkUsers.length}`);

    if (wouldUpdate.length > 0) {
      console.log("\n" + "=".repeat(70));
      console.log("✅ USERS THAT WOULD BE UPDATED");
      console.log("=".repeat(70));

      // Sort by rate descending
      wouldUpdate.sort((a, b) => b.userRate - a.userRate);

      wouldUpdate.forEach((u, i) => {
        console.log(`${i + 1}. ${u.name}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Rate: $${u.rateDollars}/hour`);
        console.log();
      });
    }

    if (unmatched.length > 0) {
      console.log("\n" + "=".repeat(70));
      console.log("❌ UNMATCHED USERS (no matching email in Teamwork)");
      console.log("=".repeat(70));

      unmatched.forEach((u, i) => {
        console.log(`${i + 1}. ${u.name} (${u.email})`);
      });
    }

    // Show sample of Teamwork users for reference
    console.log("\n" + "=".repeat(70));
    console.log("📋 SAMPLE OF TEAMWORK USERS (for reference)");
    console.log("=".repeat(70));
    teamworkUsers.slice(0, 10).forEach((u) => {
      const rateDollars = (u.userRate / 100).toFixed(2);
      console.log(
        `• ${u.firstName} ${u.lastName} (${u.email}) - $${rateDollars}/hour`
      );
    });
    if (teamworkUsers.length > 10) {
      console.log(`... and ${teamworkUsers.length - 10} more`);
    }

    console.log("\n" + "=".repeat(70));
    console.log("🏁 DRY RUN COMPLETE");
    console.log("=".repeat(70));
    console.log("\nTo actually update the database, run:");
    console.log("  npx tsx scripts/populate-user-rates.ts");
  } catch (error) {
    console.error("Error during dry run:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
dryRunUserRates();
