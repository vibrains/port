/**
 * Get userRate for a specific user from Teamwork API v3
 */

import "dotenv/config";
import { prisma } from "@/lib/db";

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

async function findUserByName(firstName: string, lastName: string) {
  console.log(`🔍 Searching for user: ${firstName} ${lastName}`);
  console.log("=".repeat(60));

  // Fetch all people (with pagination)
  let page = 1;
  let foundUser: unknown = null;

  while (!foundUser) {
    const response = await makeRequest<{
      people: Array<{
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        userRate?: number;
        userRates?: Record<
          string,
          { amount: number; currency: { id: number; type: string } }
        >;
        userCost?: number;
        company?: { id: number; type: string };
        [key: string]: unknown;
      }>;
    }>("/projects/api/v3/people.json", {
      page: String(page),
      pageSize: "100",
    });

    if (!response.people || response.people.length === 0) {
      break;
    }

    const user = response.people.find(
      (p) =>
        p.firstName.toLowerCase() === firstName.toLowerCase() &&
        p.lastName.toLowerCase() === lastName.toLowerCase()
    );

    if (user) {
      foundUser = user;
      break;
    }

    page++;
  }

  if (foundUser) {
    console.log("✅ User found!");
    console.log("\n📊 User Details:");
    console.log(JSON.stringify(foundUser, null, 2));

    // Fetch google_id from database using email
    const userEmail = (foundUser as { email: string }).email;
    if (userEmail) {
      console.log("\n🔍 Looking up google_id in database...");
      const dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { google_id: true, name: true },
      });

      if (dbUser?.google_id) {
        console.log("\n📊 Database User Info:");
        console.log(`   Name: ${dbUser.name}`);
        console.log(`   Google ID: ${dbUser.google_id}`);
      } else {
        console.log(
          `   ⚠️ No google_id found in database for email: ${userEmail}`
        );
      }
    }
  } else {
    console.log(`❌ User "${firstName} ${lastName}" not found`);
  }
}

// Get user rate for Emiliano Borzelli
findUserByName("Emiliano", "Borzelli");
