/**
 * Test Teamwork API Field Selection
 *
 * This script tests the fields parameter to fetch specific fields
 * including userRate and other detailed person data.
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

  console.log(`\n🔄 Fetching: ${url.pathname}${url.search}`);

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

async function testPeopleFields() {
  console.log("=".repeat(70));
  console.log("Testing People API with fields parameter");
  console.log("=".repeat(70));

  // Test 1: Default people endpoint (no fields specified)
  console.log("\n📋 Test 1: Default people endpoint");
  const defaultPeople = await makeRequest<any>("/people.json", {
    pageSize: "2",
  });
  if (defaultPeople.people?.length > 0) {
    console.log("Available fields in default response:");
    Object.keys(defaultPeople.people[0]).forEach((key) => {
      console.log(`  - ${key}`);
    });
  }

  // Test 2: People with specific fields including userRate
  console.log(
    "\n📋 Test 2: People with fields=id,firstName,lastName,email,userRate,userCost"
  );
  const peopleWithRate = await makeRequest<any>("/people.json", {
    pageSize: "5",
    "fields[people]":
      "id,firstName,lastName,email,userRate,userCost,company,title,type",
  });

  if (peopleWithRate.people?.length > 0) {
    console.log("\nPeople with userRate data:");
    peopleWithRate.people.forEach((person: any) => {
      console.log(
        `\n  Person: ${person.firstName} ${person.lastName} (ID: ${person.id})`
      );
      console.log(`    Email: ${person.email}`);
      console.log(`    Title: ${person.title || "N/A"}`);
      console.log(`    Type: ${person.type || "N/A"}`);
      console.log(`    Company: ${person.company?.name || "N/A"}`);
      console.log(
        `    userRate: ${person.userRate !== undefined ? person.userRate : "NOT PROVIDED"}`
      );
      console.log(
        `    userCost: ${person.userCost !== undefined ? person.userCost : "NOT PROVIDED"}`
      );
    });

    console.log("\n📊 Full response structure for first person:");
    console.log(JSON.stringify(peopleWithRate.people[0], null, 2));
  } else {
    console.log("No people returned");
  }

  // Test 3: Try with fields[person] (singular) as mentioned in docs
  console.log("\n📋 Test 3: Testing fields[person] (singular)");
  try {
    const peopleSingular = await makeRequest<any>("/people.json", {
      pageSize: "2",
      "fields[person]": "id,firstName,lastName,email,userRate,userCost",
    });
    console.log("Response with fields[person]:");
    if (peopleSingular.people?.length > 0) {
      console.log(JSON.stringify(peopleSingular.people[0], null, 2));
    }
  } catch (error) {
    console.log("Error with fields[person]:", error);
  }

  // Test 4: Get a single person with fields
  console.log("\n📋 Test 4: Single person endpoint with fields");
  if (peopleWithRate.people?.length > 0) {
    const personId = peopleWithRate.people[0].id;
    try {
      const singlePerson = await makeRequest<any>(`/people/${personId}.json`, {
        "fields[person]":
          "id,firstName,lastName,email,userRate,userCost,company,title,type,avatarUrl",
      });
      console.log("Single person response:");
      console.log(JSON.stringify(singlePerson, null, 2));
    } catch (error) {
      console.log("Error fetching single person:", error);
    }
  }
}

async function testTimeEntriesFields() {
  console.log("\n" + "=".repeat(70));
  console.log("Testing Time Entries API with fields parameter");
  console.log("=".repeat(70));

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Test with fields parameter
  console.log("\n📋 Time entries with person fields");
  const timeEntries = await makeRequest<any>("/time_entries.json", {
    fromDate: sevenDaysAgo.toISOString().split("T")[0],
    toDate: today.toISOString().split("T")[0],
    pageSize: "3",
    "fields[person]": "id,firstName,lastName,email,userRate",
  });

  const entries = timeEntries["time-entries"] || [];
  console.log(`Found ${entries.length} time entries`);

  if (entries.length > 0) {
    console.log("\nFirst entry with person fields:");
    console.log(JSON.stringify(entries[0], null, 2));
  }
}

async function testProjectFields() {
  console.log("\n" + "=".repeat(70));
  console.log("Testing Projects API with fields parameter");
  console.log("=".repeat(70));

  console.log("\n📋 Projects with specific fields");
  const projects = await makeRequest<any>("/projects.json", {
    pageSize: "3",
    status: "active",
    "fields[projects]": "id,name,status,company,startDate,endDate,budget",
  });

  if (projects.projects?.length > 0) {
    console.log("\nFirst project:");
    console.log(JSON.stringify(projects.projects[0], null, 2));
  }
}

async function main() {
  console.log("🧪 Testing Teamwork API Field Selection");
  console.log(`Site: ${TEAMWORK_SITE_NAME}.teamwork.com`);

  try {
    await testPeopleFields();
    await testTimeEntriesFields();
    await testProjectFields();

    console.log("\n" + "=".repeat(70));
    console.log("✅ Field selection tests complete!");
    console.log("=".repeat(70));
  } catch (error) {
    console.error("\n❌ Test failed:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  }
}

main();
