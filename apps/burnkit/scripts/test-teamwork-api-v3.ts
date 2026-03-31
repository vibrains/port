/**
 * Teamwork API v3 Test Script
 *
 * This script tests the Teamwork API v3 endpoints.
 * Example: https://{site_name}.teamwork.com/projects/api/v3/me.json
 */

import "dotenv/config";

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

  console.log(`\n🔄 Fetching: ${url.toString()}`);

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

  const data = await response.json();
  return data as T;
}

async function testApiV3() {
  console.log("🧪 Testing Teamwork API v3");
  console.log("=".repeat(60));
  console.log(`Site: ${TEAMWORK_SITE_NAME}.teamwork.com`);
  console.log(`API Key: ${TEAMWORK_API_KEY?.substring(0, 10)}...`);
  console.log("=".repeat(60));

  try {
    // Test 1: Get current user (me.json)
    console.log("\n📋 Test 1: Get Current User (me.json)");
    const me = await makeRequest<any>("/projects/api/v3/me.json");
    console.log("✅ Current User Retrieved:");
    console.log(JSON.stringify(me, null, 2));

    // Test 2: Try projects endpoint
    console.log("\n📋 Test 2: Get Projects (v3)");
    try {
      const projects = await makeRequest<any>("/projects/api/v3/projects.json");
      console.log("✅ Projects Retrieved:");
      console.log(JSON.stringify(projects, null, 2).substring(0, 2000));
    } catch (error: any) {
      console.log(`❌ Projects endpoint failed: ${error.message}`);
    }

    // Test 3: Try companies endpoint
    console.log("\n📋 Test 3: Get Companies (v3)");
    try {
      const companies = await makeRequest<any>(
        "/projects/api/v3/companies.json"
      );
      console.log("✅ Companies Retrieved:");
      console.log(JSON.stringify(companies, null, 2).substring(0, 2000));
    } catch (error: any) {
      console.log(`❌ Companies endpoint failed: ${error.message}`);
    }

    // Test 4: Try people endpoint
    console.log("\n📋 Test 4: Get People (v3)");
    try {
      const people = await makeRequest<any>("/projects/api/v3/people.json");
      console.log("✅ People Retrieved:");
      console.log(JSON.stringify(people, null, 2).substring(0, 2000));
    } catch (error: any) {
      console.log(`❌ People endpoint failed: ${error.message}`);
    }

    // Test 5: Try time entries endpoint
    console.log("\n📋 Test 5: Get Time Entries (v3)");
    try {
      const timeEntries = await makeRequest<any>(
        "/projects/api/v3/timeentries.json"
      );
      console.log("✅ Time Entries Retrieved:");
      console.log(JSON.stringify(timeEntries, null, 2).substring(0, 2000));
    } catch (error: any) {
      console.log(`❌ Time entries endpoint failed: ${error.message}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ API v3 testing complete!");
    console.log("=".repeat(60));
  } catch (error: any) {
    console.error("\n❌ API v3 Test Failed:");
    console.error(error.message);
    process.exit(1);
  }
}

testApiV3();
