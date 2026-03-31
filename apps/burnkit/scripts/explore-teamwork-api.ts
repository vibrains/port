/**
 * Comprehensive Teamwork API Exploration Script
 *
 * This script explores all available Teamwork API endpoints to understand
 * the data structure and available fields for integration.
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

// Rate limiting helper
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function makeRequest<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(endpoint, BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

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

function logSection(title: string) {
  console.log("\n" + "=".repeat(70));
  console.log(`🔍 ${title}`);
  console.log("=".repeat(70));
}

function logSubSection(title: string) {
  console.log("\n📋 " + title);
  console.log("-".repeat(50));
}

function analyzeObject(obj: any, prefix = ""): string[] {
  const fields: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value === null) {
      fields.push(`${fullKey}: null`);
    } else if (typeof value === "object" && !Array.isArray(value)) {
      fields.push(...analyzeObject(value, fullKey));
    } else if (Array.isArray(value)) {
      fields.push(`${fullKey}: array[${value.length}]`);
    } else {
      const preview = String(value).substring(0, 40);
      fields.push(`${fullKey}: ${typeof value} = ${preview}`);
    }
  }
  return fields;
}

async function exploreAccount() {
  logSubSection("Account Information");
  const account = await makeRequest<any>("/account.json");
  console.log("Account data structure:");
  analyzeObject(account.account).forEach((field) => console.log(`  ${field}`));
  return account.account;
}

async function exploreCompanies() {
  logSubSection("Companies (Clients)");
  const companies = await makeRequest<any>("/companies.json", {
    pageSize: "5",
  });
  const companyList = companies.companies || [];
  console.log(
    `Found ${companies.status?.count || companyList.length} companies`
  );

  if (companyList.length > 0) {
    console.log("\nSample company structure:");
    analyzeObject(companyList[0]).forEach((field) => console.log(`  ${field}`));

    console.log("\nFirst 3 companies:");
    companyList.slice(0, 3).forEach((c: any) => {
      console.log(`  - ${c.name} (ID: ${c.id})`);
    });
  }
  return companyList;
}

async function exploreProjects() {
  logSubSection("Projects");
  const projects = await makeRequest<any>("/projects.json", {
    pageSize: "5",
    status: "active",
  });
  const projectList = projects.projects || [];
  console.log(`Found ${projects.status?.count || projectList.length} projects`);

  if (projectList.length > 0) {
    console.log("\nSample project structure:");
    analyzeObject(projectList[0]).forEach((field) => console.log(`  ${field}`));

    console.log("\nFirst 3 projects:");
    projectList.slice(0, 3).forEach((p: any) => {
      console.log(`  - ${p.name} (ID: ${p.id}, Company: ${p.company?.name})`);
    });
  }
  return projectList;
}

async function explorePeople() {
  logSubSection("People (Users)");
  const people = await makeRequest<any>("/people.json", { pageSize: "5" });
  const peopleList = people.people || [];
  console.log(`Found ${people.status?.count || peopleList.length} people`);

  if (peopleList.length > 0) {
    console.log("\nSample person structure:");
    analyzeObject(peopleList[0]).forEach((field) => console.log(`  ${field}`));

    console.log("\nFirst 3 people:");
    peopleList.slice(0, 3).forEach((p: any) => {
      console.log(
        `  - ${p["first-name"]} ${p["last-name"]} (ID: ${p.id}, Email: ${p["email-address"]})`
      );
    });
  }
  return peopleList;
}

async function exploreTimeEntries() {
  logSubSection("Time Entries");

  // Get entries from last 7 days
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const timeEntries = await makeRequest<any>("/time_entries.json", {
    fromDate: sevenDaysAgo.toISOString().split("T")[0],
    toDate: today.toISOString().split("T")[0],
    pageSize: "5",
  });

  const entriesList = timeEntries["time-entries"] || [];
  console.log(
    `Found ${timeEntries.status?.count || entriesList.length} time entries in last 7 days`
  );

  if (entriesList.length > 0) {
    console.log("\nSample time entry structure:");
    analyzeObject(entriesList[0]).forEach((field) => console.log(`  ${field}`));

    console.log("\nFirst 3 time entries:");
    entriesList.slice(0, 3).forEach((e: any) => {
      const hours = parseFloat(e.hoursDecimal || 0);
      console.log(`  - Date: ${e.date?.split("T")[0]}`);
      console.log(
        `    Person: ${e["person-first-name"]} ${e["person-last-name"]}`
      );
      console.log(`    Project: ${e["project-name"]}`);
      console.log(`    Task: ${e["todo-item-name"] || "N/A"}`);
      console.log(`    Hours: ${hours.toFixed(2)}`);
      console.log(`    Billable: ${e.isbillable === "1" ? "Yes" : "No"}`);
      console.log(
        `    Description: ${e.description?.substring(0, 50) || "N/A"}`
      );
      console.log("");
    });
  }
  return entriesList;
}

async function exploreTasks() {
  logSubSection("Tasks");

  // First get a project to fetch tasks from
  const projects = await makeRequest<any>("/projects.json", {
    pageSize: "1",
    status: "active",
  });

  if (projects.projects?.length > 0) {
    const projectId = projects.projects[0].id;
    console.log(`Fetching tasks from project: ${projects.projects[0].name}`);

    try {
      const tasks = await makeRequest<any>(
        `/projects/${projectId}/tasks.json`,
        {
          pageSize: "5",
        }
      );
      const taskList = tasks["todo-items"] || [];
      console.log(`Found ${tasks.status?.count || taskList.length} tasks`);

      if (taskList.length > 0) {
        console.log("\nSample task structure:");
        analyzeObject(taskList[0]).forEach((field) =>
          console.log(`  ${field}`)
        );

        console.log("\nFirst 3 tasks:");
        taskList.slice(0, 3).forEach((t: any) => {
          console.log(`  - ${t.content} (ID: ${t.id})`);
          console.log(`    Status: ${t.status}`);
          console.log(`    Estimated: ${t["estimated-minutes"]} minutes`);
        });
      }
      return taskList;
    } catch (error) {
      console.log(
        "  ⚠️ Could not fetch tasks (may require different permissions)"
      );
      return [];
    }
  }
  return [];
}

async function exploreTaskLists() {
  logSubSection("Task Lists");

  const projects = await makeRequest<any>("/projects.json", {
    pageSize: "1",
    status: "active",
  });

  if (projects.projects?.length > 0) {
    const projectId = projects.projects[0].id;

    try {
      const tasklists = await makeRequest<any>(
        `/projects/${projectId}/tasklists.json`,
        {
          pageSize: "5",
        }
      );
      const listItems = tasklists.tasklists || [];
      console.log(
        `Found ${tasklists.status?.count || listItems.length} task lists`
      );

      if (listItems.length > 0) {
        console.log("\nSample task list structure:");
        analyzeObject(listItems[0]).forEach((field) =>
          console.log(`  ${field}`)
        );

        console.log("\nFirst 3 task lists:");
        listItems.slice(0, 3).forEach((tl: any) => {
          console.log(`  - ${tl.name} (ID: ${tl.id})`);
        });
      }
      return listItems;
    } catch (error) {
      console.log("  ⚠️ Could not fetch task lists");
      return [];
    }
  }
  return [];
}

async function exploreTags() {
  logSubSection("Tags");

  try {
    const tags = await makeRequest<any>("/tags.json", { pageSize: "10" });
    const tagList = tags.tags || [];
    console.log(`Found ${tags.status?.count || tagList.length} tags`);

    if (tagList.length > 0) {
      console.log("\nSample tag structure:");
      analyzeObject(tagList[0]).forEach((field) => console.log(`  ${field}`));

      console.log("\nAll tags:");
      tagList.forEach((t: any) => {
        console.log(`  - ${t.name} (ID: ${t.id}, Color: ${t.color})`);
      });
    }
    return tagList;
  } catch (error) {
    console.log("  ⚠️ Could not fetch tags");
    return [];
  }
}

async function exploreWorkloads() {
  logSubSection("Workloads (Resource Management)");

  try {
    const workloads = await makeRequest<any>("/workloads.json", {
      pageSize: "5",
    });
    console.log(
      "Workloads data:",
      JSON.stringify(workloads, null, 2).substring(0, 500)
    );
    return workloads;
  } catch (error) {
    console.log(
      "  ⚠️ Workloads endpoint not available or requires different plan"
    );
    return null;
  }
}

async function exploreDashboard() {
  logSubSection("Dashboard Data");

  try {
    const dashboard = await makeRequest<any>("/dashboard.json");
    console.log("Dashboard data structure:");
    analyzeObject(dashboard).forEach((field) => console.log(`  ${field}`));
    return dashboard;
  } catch (error) {
    console.log("  ⚠️ Dashboard endpoint not available");
    return null;
  }
}

async function exploreLatestActivity() {
  logSubSection("Latest Activity");

  try {
    const activity = await makeRequest<any>("/latestActivity.json", {
      maxRecords: "5",
    });
    const activityList = activity.activity || [];
    console.log(`Found ${activityList.length} recent activities`);

    if (activityList.length > 0) {
      console.log("\nSample activity structure:");
      analyzeObject(activityList[0]).forEach((field) =>
        console.log(`  ${field}`)
      );
    }
    return activityList;
  } catch (error) {
    console.log("  ⚠️ Activity endpoint not available");
    return [];
  }
}

async function analyzeTimeEntryPatterns(entries: any[]) {
  logSubSection("Time Entry Data Analysis");

  if (entries.length === 0) {
    console.log("No time entries to analyze");
    return;
  }

  // Count billable vs non-billable
  const billable = entries.filter((e) => e.isbillable === "1").length;
  const nonBillable = entries.length - billable;

  console.log("Billable breakdown:");
  console.log(
    `  Billable: ${billable} (${((billable / entries.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `  Non-billable: ${nonBillable} (${((nonBillable / entries.length) * 100).toFixed(1)}%)`
  );

  // Group by person
  const byPerson: Record<string, number> = {};
  entries.forEach((e) => {
    const name = `${e["person-first-name"]} ${e["person-last-name"]}`;
    byPerson[name] = (byPerson[name] || 0) + parseFloat(e.hoursDecimal || 0);
  });

  console.log("\nHours by person:");
  Object.entries(byPerson)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, hours]) => {
      console.log(`  ${name}: ${hours.toFixed(2)} hours`);
    });

  // Group by project
  const byProject: Record<string, number> = {};
  entries.forEach((e) => {
    const project = e["project-name"] || "Unknown";
    byProject[project] =
      (byProject[project] || 0) + parseFloat(e.hoursDecimal || 0);
  });

  console.log("\nHours by project:");
  Object.entries(byProject)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([project, hours]) => {
      console.log(`  ${project.substring(0, 40)}: ${hours.toFixed(2)} hours`);
    });
}

async function main() {
  console.log("🚀 Teamwork API Comprehensive Exploration");
  console.log(`Site: ${TEAMWORK_SITE_NAME}.teamwork.com`);
  console.log(`Base URL: ${BASE_URL}`);

  try {
    // Core endpoints
    logSection("CORE ENDPOINTS");
    await exploreAccount();
    await sleep(500);

    await exploreCompanies();
    await sleep(500);

    await exploreProjects();
    await sleep(500);

    await explorePeople();
    await sleep(500);

    const timeEntries = await exploreTimeEntries();
    await sleep(500);

    // Project-related endpoints
    logSection("PROJECT DETAILS");
    await exploreTaskLists();
    await sleep(500);

    await exploreTasks();
    await sleep(500);

    // Other endpoints
    logSection("OTHER ENDPOINTS");
    await exploreTags();
    await sleep(500);

    await exploreLatestActivity();
    await sleep(500);

    await exploreDashboard();
    await sleep(500);

    // Analysis
    logSection("DATA ANALYSIS");
    await analyzeTimeEntryPatterns(timeEntries);

    // Summary
    logSection("SUMMARY");
    console.log("✅ Successfully explored Teamwork API endpoints");
    console.log("\nAvailable data for BurnKit integration:");
    console.log("  ✓ Account information");
    console.log("  ✓ Companies (clients)");
    console.log("  ✓ Projects (jobs)");
    console.log("  ✓ People (users)");
    console.log("  ✓ Time entries with full details");
    console.log("  ✓ Tasks and task lists");
    console.log("  ✓ Tags for categorization");
    console.log("\nKey fields for mapping:");
    console.log(
      "  Time Entry → Person: person-id, person-first-name, person-last-name"
    );
    console.log("  Time Entry → Company: company-id, company-name");
    console.log("  Time Entry → Project: project-id, project-name");
    console.log("  Time Entry → Task: todo-item-id, todo-item-name");
    console.log("  Billing: isbillable (1/0), isbilled (1/0)");
  } catch (error) {
    console.error("\n❌ Exploration failed:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  }
}

main();
