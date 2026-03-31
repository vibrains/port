/**
 * Teamwork API Test Script
 *
 * This script tests the Teamwork API connection and retrieves sample data
 * to validate the integration approach.
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

interface TeamworkResponse<T> {
  STATUS: string;
  [key: string]: T | string;
}

async function makeRequest<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(endpoint, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  console.log(`\n🔄 Fetching: ${url.pathname}${url.search}`);

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

async function testConnection() {
  console.log("🧪 Testing Teamwork API Connection");
  console.log("=".repeat(60));
  console.log(`Site: ${TEAMWORK_SITE_NAME}.teamwork.com`);
  console.log(`API Key: ${TEAMWORK_API_KEY?.substring(0, 10)}...`);
  console.log("=".repeat(60));

  try {
    // Test 1: Get Account Info
    console.log("\n📋 Test 1: Get Account Information");
    const accountInfo = await makeRequest<any>("/account.json");
    console.log("✅ Account Info Retrieved:");
    console.log(`   Company: ${accountInfo.account?.name || "N/A"}`);
    console.log(`   Code: ${accountInfo.account?.code || "N/A"}`);
    console.log(`   URL: ${accountInfo.account?.URL || "N/A"}`);

    // Test 2: Get Companies
    console.log("\n📋 Test 2: Get Companies (Clients)");
    const companies = await makeRequest<any>("/companies.json", {
      pageSize: "10",
    });
    const companyList = companies.companies || [];
    console.log(`✅ Found ${companyList.length} companies:`);
    companyList.slice(0, 5).forEach((company: any) => {
      console.log(
        `   - ${company.name} (ID: ${company.id}, Owner: ${company.isOwner})`
      );
    });

    // Test 3: Get Projects
    console.log("\n📋 Test 3: Get Projects");
    const projects = await makeRequest<any>("/projects.json", {
      pageSize: "10",
      status: "active",
    });
    const projectList = projects.projects || [];
    console.log(`✅ Found ${projectList.length} active projects:`);
    projectList.slice(0, 5).forEach((project: any) => {
      console.log(
        `   - ${project.name} (ID: ${project.id}, Company: ${project.company?.name || "N/A"})`
      );
    });

    // Test 4: Get People
    console.log("\n📋 Test 4: Get People (Users)");
    const people = await makeRequest<any>("/people.json", { pageSize: "10" });
    const peopleList = people.people || [];
    console.log(`✅ Found ${peopleList.length} people:`);
    peopleList.slice(0, 5).forEach((person: any) => {
      console.log(
        `   - ${person.firstName} ${person.lastName} (ID: ${person.id}, Type: ${person.userType || "N/A"})`
      );
    });

    // Test 5: Get Recent Time Entries
    console.log("\n📋 Test 5: Get Recent Time Entries");
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const timeEntries = await makeRequest<any>("/time_entries.json", {
      fromDate: thirtyDaysAgo.toISOString().split("T")[0],
      toDate: today.toISOString().split("T")[0],
      pageSize: "10",
    });
    const entriesList = timeEntries["time-entries"] || [];
    console.log(`✅ Found ${entriesList.length} time entries in last 30 days:`);

    if (entriesList.length > 0) {
      console.log("\n   Sample entries:");
      entriesList.slice(0, 3).forEach((entry: any) => {
        const hours = Number(entry.hours) || 0;
        const minutes = Number(entry.minutes) || 0;
        const totalHours = hours + minutes / 60;
        console.log(`   - Date: ${entry.date}`);
        console.log(
          `     Person: ${entry.person?.firstName || "N/A"} ${entry.person?.lastName || ""}`
        );
        console.log(`     Project: ${entry.project?.name || "N/A"}`);
        console.log(`     Hours: ${totalHours.toFixed(2)}`);
        console.log(`     Billable: ${entry.isBillable ? "Yes" : "No"}`);
        console.log(`     Description: ${entry.description || "N/A"}`);
        console.log("");
      });

      // Analyze data structure
      console.log("\n📊 Data Structure Analysis:");
      const sampleEntry = entriesList[0];
      console.log("   Available fields in time entry:");
      Object.keys(sampleEntry).forEach((key) => {
        const value = sampleEntry[key];
        const type = typeof value;
        const preview =
          type === "object" && value !== null
            ? `{${Object.keys(value).slice(0, 3).join(", ")}...}`
            : String(value).substring(0, 50);
        console.log(`     - ${key}: ${type} = ${preview}`);
      });
    } else {
      console.log("   ⚠️  No time entries found in the last 30 days");
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ All API Tests Passed!");
    console.log("=".repeat(60));
    console.log("\n📈 Summary:");
    console.log(`   Companies: ${companyList.length}`);
    console.log(`   Projects: ${projectList.length}`);
    console.log(`   People: ${peopleList.length}`);
    console.log(`   Time Entries (30 days): ${entriesList.length}`);
    console.log("\n✨ Teamwork API integration is ready to implement!");
  } catch (error) {
    console.error("\n❌ API Test Failed:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  }
}

// Run the test
testConnection();
